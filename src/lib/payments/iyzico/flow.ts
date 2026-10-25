import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderEvents, orderItems, orders, paymentTransactions } from "@/lib/db/schema";
import { hashOrderToken, markOrderPaid } from "@/lib/commerce/orders";
import { toKurus } from "@/lib/commerce/money";
import { getSiteSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/seo/site";
import { getClientIp } from "@/lib/request-meta";
import { iyzicoProvider } from "../providers/iyzico";
import { iyzicoConfig, retrieveCheckoutForm, verifyResponseSignature } from "./client";
import { after } from "next/server";
import { sendOrderEmail } from "@/lib/mail/order-emails";

export type IyzicoOutcome = "basarili" | "inceleme" | "hata" | "baslatilamadi";

const orderUrl = (orderNumber: string, token: string, outcome?: IyzicoOutcome) =>
  absoluteUrl(`/siparis/${orderNumber}?t=${encodeURIComponent(token)}${outcome ? `&odeme=${outcome}` : ""}`);

/** Sipariş numarası + görüntüleme anahtarı ile siparişi doğrular (anahtar özetiyle karşılaştırma). */
async function loadOrder(orderNumber: string, token: string) {
  if (!orderNumber || !token) return null;
  const [o] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber.toUpperCase())).limit(1);
  if (!o || hashOrderToken(token) !== o.accessTokenHash) return null;
  return o;
}

/**
 * iyzico geri çağrısı: müşteri ödeme sayfasından dönerken iyzico `token`'ı POST eder.
 * Sonuç istemciden ALINMAZ — token ile iyzico'dan sunucu tarafında sorgulanır (retrieve) ve
 * sipariş no / tutar / dolandırıcılık durumu eşleşirse sipariş "ödendi" yapılır. İdempotent.
 */
export async function handleIyzicoCallback(orderNumber: string, accessToken: string, cfToken: string | null): Promise<string> {
  const cfg = iyzicoConfig(await getSiteSettings());
  const o = await loadOrder(orderNumber, accessToken);
  if (!o) return absoluteUrl("/siparis-takibi");
  if (o.paymentStatus === "paid") return orderUrl(o.orderNumber, accessToken, "basarili");
  if (!cfg || !cfToken) return orderUrl(o.orderNumber, accessToken, "hata");

  const res = await retrieveCheckoutForm(cfg, cfToken, o.id);
  const signatureOk = verifyResponseSignature(cfg, [res.paymentStatus, res.paymentId, res.currency, res.basketId, res.conversationId, res.paidPrice, res.price, res.token], res.signature);
  if (signatureOk === false) console.warn("[iyzico] yanıt imzası doğrulanamadı", o.orderNumber);

  const summary = {
    step: "retrieve",
    status: res.status,
    paymentStatus: res.paymentStatus,
    fraudStatus: res.fraudStatus,
    paymentId: res.paymentId,
    price: res.price,
    paidPrice: res.paidPrice,
    installment: res.installment,
    cardAssociation: res.cardAssociation,
    lastFourDigits: res.lastFourDigits, // iyzico'nun maskeli döndürdüğü son 4 hane; kart numarası değildir
    errorCode: res.errorCode,
    errorMessage: res.errorMessage,
    signatureOk,
  };

  const matches =
    res.status === "success" &&
    res.paymentStatus === "SUCCESS" &&
    res.basketId === o.orderNumber &&
    res.conversationId === o.id &&
    typeof res.price === "number" &&
    toKurus(res.price) === toKurus(o.grandTotal) &&
    typeof res.paidPrice === "number" &&
    toKurus(res.paidPrice) >= toKurus(o.grandTotal);

  if (matches && res.fraudStatus === 1) {
    const paidNow = await markOrderPaid(o.id, { provider: "iyzico", reference: res.paymentId ?? cfToken, amount: res.paidPrice!, actor: "iyzico", raw: summary });
    if (paidNow) {
      const link = orderUrl(o.orderNumber, accessToken);
      after(async () => {
        await sendOrderEmail("payment_confirmed", o.id, { orderLink: link });
        await sendOrderEmail("admin_new_order", o.id);
      });
    }
    return orderUrl(o.orderNumber, accessToken, "basarili");
  }

  if (matches && res.fraudStatus === 0) {
    // Ödeme alındı ama iyzico incelemesinde: kargolanmamalı. Admin iyzico panelinden takip eder.
    await db.insert(paymentTransactions).values({ orderId: o.id, provider: "iyzico", providerReference: res.paymentId ?? cfToken, amount: res.paidPrice!, status: "pending", raw: summary });
    await db.insert(orderEvents).values({ orderId: o.id, type: "payment", message: "Kart ödemesi iyzico güvenlik incelemesinde (fraudStatus=0). Onaylanmadan kargolamayın.", isPublic: false, actor: "iyzico" });
    return orderUrl(o.orderNumber, accessToken, "inceleme");
  }

  await db.insert(paymentTransactions).values({ orderId: o.id, provider: "iyzico", providerReference: res.paymentId ?? cfToken, amount: o.grandTotal, status: "failed", raw: summary });
  await db.update(orders).set({ paymentStatus: "failed" }).where(and(eq(orders.id, o.id), eq(orders.paymentStatus, o.paymentStatus)));
  await db.insert(orderEvents).values({
    orderId: o.id,
    type: "payment",
    message: `Kart ödemesi tamamlanamadı${res.errorMessage ? `: ${res.errorMessage}` : ""}.`,
    isPublic: false,
    actor: "iyzico",
  });
  return orderUrl(o.orderNumber, accessToken, "hata");
}

/** Ödenmemiş iyzico siparişi için ödeme sayfasını yeniden açar (müşteri "tekrar dene"). */
export async function restartIyzicoPayment(orderNumber: string, accessToken: string): Promise<string> {
  const o = await loadOrder(orderNumber, accessToken);
  if (!o) return absoluteUrl("/siparis-takibi");
  if (o.paymentStatus === "paid" || ["cancelled", "refunded"].includes(o.status) || o.paymentProvider !== "iyzico" || !iyzicoConfig(await getSiteSettings())) {
    return orderUrl(o.orderNumber, accessToken);
  }
  const [settings, items] = await Promise.all([getSiteSettings(), db.select().from(orderItems).where(eq(orderItems.orderId, o.id))]);
  try {
    const init = await iyzicoProvider.initiate({
      order: { id: o.id, orderNumber: o.orderNumber, grandTotal: o.grandTotal, currency: o.currency, email: o.email, phone: o.phone, firstName: o.firstName, lastName: o.lastName },
      items: items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice, categoryName: i.categoryName })),
      settings,
      returnUrl: orderUrl(o.orderNumber, accessToken),
      accessToken,
      ipAddress: await getClientIp(),
      checkout: {
        customerId: o.customerId,
        shipping: o.shippingAddress,
        billing: o.billingAddress,
        shippingTotal: o.shippingTotal,
        discountTotal: o.discountTotal,
        lines: items.map((i) => ({ id: i.productId ?? i.id, name: i.name, categoryName: i.categoryName, lineTotal: i.lineTotal })),
      },
    });
    return init.kind === "redirect" ? init.url : orderUrl(o.orderNumber, accessToken, "baslatilamadi");
  } catch (e) {
    console.error("[iyzico] yeniden başlatılamadı", o.orderNumber, e);
    return orderUrl(o.orderNumber, accessToken, "baslatilamadi");
  }
}
