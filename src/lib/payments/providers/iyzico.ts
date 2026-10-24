import "server-only";
import { db } from "@/lib/db";
import { paymentTransactions } from "@/lib/db/schema";
import { toKurus } from "@/lib/commerce/money";
import { absoluteUrl } from "@/lib/seo/site";
import type { PaymentInitContext, PaymentProvider } from "../types";
import { initializeCheckoutForm, iyzicoConfig, iyziPrice, verifyResponseSignature } from "../iyzico/client";

/**
 * iyzico Checkout Form (hosted ödeme sayfası).
 * - Kart verisi bu sunucuya HİÇ gelmez: müşteri iyzico'nun sayfasına yönlendirilir (redirect).
 * - Sonuç YALNIZCA geri çağrıda iyzico'dan sunucu tarafında sorgulanarak (retrieve) doğrulanır →
 *   app/api/payments/iyzico/callback/route.ts → markOrderPaid().
 * - Sepet: indirim kalemlere kuruş hassasiyetinde orantılı dağıtılır; kargo ayrı kalem. Kalemler toplamı = price = paidPrice
 *   (taksit vade farkı iyzico tarafında paidPrice'a eklenir).
 * - Anahtar yoksa (ne ENV ne Admin › Ayarlar › Kartla ödeme) yöntem ödeme sayfasında görünmez.
 */
export const iyzicoProvider: PaymentProvider = {
  id: "iyzico",
  label: "Kredi / Banka Kartı",
  description: "iyzico güvencesiyle kartla ödeyin; taksit seçenekleri ödeme ekranında gösterilir. Kart bilgileriniz sitemizde saklanmaz.",
  isEnabled: (settings) => iyzicoConfig(settings) !== null,
  async initiate(ctx) {
    const cfg = iyzicoConfig(ctx.settings);
    if (!cfg) throw new Error("iyzico yapılandırılmamış.");
    const payload = buildCheckoutPayload(ctx, cfg.installments);
    const res = await initializeCheckoutForm(cfg, payload);

    const ok = res.status === "success" && typeof res.paymentPageUrl === "string" && typeof res.token === "string";
    // Kayıt: başlatma denemesi (ham yanıt; kart verisi içermez)
    await db.insert(paymentTransactions).values({
      orderId: ctx.order.id,
      provider: "iyzico",
      providerReference: res.token ?? null,
      amount: ctx.order.grandTotal,
      status: ok ? "pending" : "failed",
      raw: { step: "initialize", status: res.status, errorCode: res.errorCode, errorMessage: res.errorMessage, tokenExpireTime: res.tokenExpireTime, signatureOk: verifyResponseSignature(cfg, [res.conversationId, res.token], res.signature) },
    });
    if (!ok) {
      console.error("[iyzico] initialize başarısız", res.errorCode, res.errorMessage);
      throw new Error(res.errorMessage || "Ödeme sayfası açılamadı.");
    }
    return { kind: "redirect", url: res.paymentPageUrl! };
  },
};

/** Kuruş hassasiyetinde orantılı indirim dağıtımı; kalan kuruş en büyük kaleme eklenir. */
export function distributeDiscount(lineTotalsK: number[], discountK: number): number[] {
  const total = lineTotalsK.reduce((s, x) => s + x, 0);
  if (discountK <= 0 || total <= 0) return lineTotalsK;
  const d = Math.min(discountK, total);
  const cuts = lineTotalsK.map((x) => Math.floor((x * d) / total));
  let rest = d - cuts.reduce((s, x) => s + x, 0);
  const order = lineTotalsK.map((x, i) => [x, i] as const).sort((a, b) => b[0] - a[0]);
  for (let j = 0; rest > 0; j = (j + 1) % order.length) {
    const i = order[j]![1];
    if (lineTotalsK[i]! - cuts[i]! > 0) {
      cuts[i]!++;
      rest--;
    }
  }
  return lineTotalsK.map((x, i) => x - cuts[i]!);
}

const clean = (s: string | null | undefined, max = 120) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, max) || "-";
const gsm = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("90") ? `+${digits}` : digits.startsWith("0") ? `+9${digits}` : `+90${digits}`;
};
const addr = (a: PaymentInitContext["checkout"]["shipping"]) => ({
  contactName: clean(`${a.firstName} ${a.lastName}`, 100),
  city: clean(a.city, 50),
  country: "Turkey",
  address: clean(`${a.addressLine} ${a.district}/${a.city}`, 250),
  zipCode: a.postalCode || undefined,
});

export function buildCheckoutPayload(ctx: PaymentInitContext, installments: number[] = [1, 2, 3, 6, 9]) {
  const { order, checkout } = ctx;
  const linesK = checkout.lines.map((l) => toKurus(l.lineTotal));
  const discounted = distributeDiscount(linesK, toKurus(checkout.discountTotal));
  const basketItems = checkout.lines
    .map((l, i) => ({ id: l.id.slice(0, 50), name: clean(l.name, 100), category1: clean(l.categoryName ?? "Kit", 50), itemType: "PHYSICAL", priceK: discounted[i]! }))
    .filter((b) => b.priceK > 0);
  const shippingK = toKurus(checkout.shippingTotal);
  if (shippingK > 0) basketItems.push({ id: "KARGO", name: "Kargo", category1: "Kargo", itemType: "VIRTUAL", priceK: shippingK });

  const sumK = basketItems.reduce((s, b) => s + b.priceK, 0);
  if (sumK !== toKurus(order.grandTotal)) {
    // Tutarsızlık sipariş toplamı hesabında bir hata demektir: ödemeyi başlatma.
    throw new Error(`iyzico sepet toplamı (${sumK}) sipariş toplamıyla (${toKurus(order.grandTotal)}) eşleşmiyor.`);
  }
  const now = new Date().toISOString().replace("T", " ").slice(0, 19);
  const price = iyziPrice(sumK / 100);

  return {
    locale: "tr",
    conversationId: order.id,
    price,
    paidPrice: price,
    currency: "TRY",
    basketId: order.orderNumber,
    paymentGroup: "PRODUCT",
    callbackUrl: absoluteUrl(`/api/payments/iyzico/callback?n=${encodeURIComponent(order.orderNumber)}&t=${encodeURIComponent(ctx.accessToken)}`),
    enabledInstallments: installments,
    buyer: {
      id: (checkout.customerId ?? `misafir-${order.orderNumber}`).slice(0, 50),
      name: clean(order.firstName, 50),
      surname: clean(order.lastName, 50),
      gsmNumber: gsm(order.phone),
      email: order.email,
      // T.C. kimlik no ödeme formunda toplanmıyor; iyzico'nun bu durum için kabul ettiği değer.
      identityNumber: "11111111111",
      lastLoginDate: now,
      registrationDate: now,
      registrationAddress: addr(checkout.billing).address,
      ip: ctx.ipAddress === "unknown" ? "127.0.0.1" : ctx.ipAddress,
      city: clean(checkout.billing.city, 50),
      country: "Turkey",
      zipCode: checkout.billing.postalCode || undefined,
    },
    shippingAddress: addr(checkout.shipping),
    billingAddress: addr(checkout.billing),
    basketItems: basketItems.map(({ priceK, ...b }) => ({ ...b, price: iyziPrice(priceK / 100) })),
  };
}
