"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { addresses, customers } from "@/lib/db/schema";
import { checkoutSchema } from "@/lib/validation/checkout";
import { normalizeTrPhone } from "@/lib/validation/tr";
import { getCartForCheckout } from "@/lib/commerce/cart";
import { createOrderFromCart, OrderError, recordPaymentInit } from "@/lib/commerce/orders";
import { getProvider } from "@/lib/payments/registry";
import { getSiteSettings } from "@/lib/settings";
import { getCustomer } from "@/lib/auth/customer";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientIp, getIpHash } from "@/lib/request-meta";
import { absoluteUrl } from "@/lib/seo/site";
import { sendEmail } from "@/lib/email";

export type PlaceOrderResult =
  | { ok: true; redirectTo: string; html?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Sipariş oluşturma. Server Action'lar Next.js tarafından Origin kontrolüyle CSRF'e karşı korunur.
 * Tüm doğrulama sunucuda tekrar yapılır; fiyat/stok/kupon DB'den hesaplanır.
 */
export async function placeOrderAction(raw: unknown): Promise<PlaceOrderResult> {
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = i.path.join(".");
      if (k && !fieldErrors[k]) fieldErrors[k] = i.message;
    }
    return { ok: false, error: "Lütfen işaretli alanları kontrol edin.", fieldErrors };
  }
  const d = parsed.data;
  const ipHash = await getIpHash();
  if (await consumeRateLimit([`checkout:${ipHash}`], 10, 60 * 60_000)) {
    return { ok: false, error: "Çok fazla sipariş denemesi yapıldı. Lütfen bir süre sonra tekrar deneyin." };
  }

  const [settings, cart, customer] = await Promise.all([getSiteSettings(), getCartForCheckout(), getCustomer()]);
  if (!cart || !cart.view.items.some((l) => l.available)) return { ok: false, error: "Sepetiniz boş." };

  const provider = getProvider(d.paymentMethod);
  if (!provider || !provider.isEnabled(settings)) return { ok: false, error: "Seçilen ödeme yöntemi şu anda kullanılamıyor.", fieldErrors: { paymentMethod: "Ödeme yöntemi seçin." } };

  const email = d.email.trim().toLowerCase();
  const phone = normalizeTrPhone(d.phone)!;
  const shipping = { firstName: d.firstName, lastName: d.lastName, phone, city: d.city, district: d.district, postalCode: d.postalCode || null, addressLine: d.addressLine };
  const billing = d.billingSame
    ? { ...shipping, invoiceType: d.invoiceType, companyName: d.companyName || null, taxOffice: d.taxOffice || null, taxNumber: d.taxNumber || null }
    : {
        firstName: d.billingFirstName!,
        lastName: d.billingLastName!,
        phone,
        city: d.billingCity!,
        district: d.billingDistrict!,
        postalCode: null,
        addressLine: d.billingAddressLine!,
        invoiceType: d.invoiceType,
        companyName: d.companyName || null,
        taxOffice: d.taxOffice || null,
        taxNumber: d.taxNumber || null,
      };

  // Misafir müşteri kaydı (e-posta ile eşleşir); pazarlama izni yalnızca açıkça işaretlendiyse.
  let customerId = customer?.id ?? null;
  if (!customerId) {
    const [row] = await db
      .insert(customers)
      .values({ email, firstName: d.firstName, lastName: d.lastName, phone, marketingConsent: Boolean(d.marketingConsent), marketingConsentAt: d.marketingConsent ? new Date() : null })
      .onConflictDoUpdate({ target: customers.email, set: { phone, updatedAt: new Date() } })
      .returning({ id: customers.id, passwordHash: customers.passwordHash });
    // Üyelik şifresi olan bir hesaba oturum açmadan sipariş bağlanmaz (başkasının hesabına yazılmasın).
    customerId = row && !row.passwordHash ? row.id : null;
  }

  let result: Awaited<ReturnType<typeof createOrderFromCart>>;
  try {
    result = await createOrderFromCart({
      cartId: cart.cartId,
      couponCode: cart.view.coupon?.code ?? null,
      customerId,
      email,
      phone,
      firstName: d.firstName,
      lastName: d.lastName,
      shipping,
      billing,
      note: d.note || null,
      paymentProvider: provider.id,
      carrierId: d.shippingCarrier || null,
      ipHash,
      settings,
    });
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    console.error("[checkout] sipariş oluşturulamadı", e);
    return { ok: false, error: "Sipariş oluşturulurken bir hata oluştu. Lütfen tekrar deneyin." };
  }

  if (customer && d.saveAddress) {
    await db
      .insert(addresses)
      .values({ customerId: customer.id, title: "Teslimat adresim", ...shipping, postalCode: shipping.postalCode, invoiceType: d.invoiceType, companyName: d.companyName || null, taxOffice: d.taxOffice || null, taxNumber: d.taxNumber || null })
      .catch(() => {});
  }
  if (customerId && d.marketingConsent) {
    await db.update(customers).set({ marketingConsent: true, marketingConsentAt: new Date() }).where(eq(customers.id, customerId));
  }

  const { order, token, lines } = result;
  const returnUrl = absoluteUrl(`/siparis/${order.orderNumber}?t=${token}`);
  await sendEmail({ to: email, subject: `Siparişiniz alındı — ${order.orderNumber}`, text: `Sipariş numaranız: ${order.orderNumber}. Sipariş detayları: ${returnUrl}` });

  let init: Awaited<ReturnType<typeof provider.initiate>>;
  try {
    init = await provider.initiate({
      order: { id: order.id, orderNumber: order.orderNumber, grandTotal: order.grandTotal, currency: order.currency, email, phone, firstName: d.firstName, lastName: d.lastName },
      items: lines.map((l) => ({ name: l.name, quantity: l.quantity, unitPrice: l.unitPrice, categoryName: l.categoryName })),
      settings,
      returnUrl,
      accessToken: token,
      ipAddress: await getClientIp(),
      checkout: {
        customerId,
        shipping,
        billing,
        shippingTotal: order.shippingTotal,
        discountTotal: order.discountTotal,
        lines: lines.map((l) => ({ id: l.productId, name: l.name, categoryName: l.categoryName, lineTotal: l.lineTotal })),
      },
    });
  } catch (e) {
    // Sipariş oluştu ama ödeme sayfası açılamadı: müşteri sipariş sayfasında "tekrar dene" ile devam edebilir.
    console.error("[checkout] ödeme başlatılamadı", order.orderNumber, e);
    return { ok: true, redirectTo: `/siparis/${order.orderNumber}?t=${token}&odeme=baslatilamadi` };
  }

  if (init.kind === "instructions") {
    await recordPaymentInit(order.id, provider.id, order.grandTotal, init.paymentStatus);
    return { ok: true, redirectTo: `/siparis/${order.orderNumber}?t=${token}` };
  }
  if (init.kind === "redirect") return { ok: true, redirectTo: init.url };
  return { ok: true, redirectTo: `/siparis/${order.orderNumber}?t=${token}`, html: init.html };
}
