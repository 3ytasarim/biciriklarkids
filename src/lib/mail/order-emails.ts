import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderEvents, orderItems, orders } from "@/lib/db/schema";
import { getSiteSettings, type SiteSettings } from "@/lib/settings";
import { absoluteUrl } from "@/lib/seo/site";
import { formatPrice } from "@/lib/commerce/money";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/commerce/order-labels";
import { PAYMENT_LABELS } from "@/lib/payments/registry";
import { mailReady, sendEmail } from "@/lib/email";
import { MAIL_EVENT_INFO, type MailEvent } from "./templates";
import { fill, renderMailHtml, renderMailText, type MailSummary, type MailVars } from "./render";

type OrderRow = typeof orders.$inferSelect;

function bankInfo(s: SiteSettings): string {
  const b = s.payments.bankTransfer;
  return [b.bankName && `Banka: ${b.bankName}`, b.accountHolder && `Alıcı: ${b.accountHolder}`, b.iban && `IBAN: ${b.iban}`, b.note].filter(Boolean).join("\n") || "Banka bilgileri sipariş sayfanızda yer alır.";
}

function varsFor(o: Pick<OrderRow, "orderNumber" | "firstName" | "lastName" | "email" | "phone" | "grandTotal" | "status" | "paymentStatus" | "paymentProvider" | "carrier" | "trackingNumber" | "shippingAddress">, s: SiteSettings, link: string, statusOverride?: string): MailVars {
  const a = o.shippingAddress;
  return {
    ad: o.firstName,
    soyad: o.lastName,
    siparis_no: o.orderNumber,
    toplam: formatPrice(o.grandTotal),
    durum: statusOverride ?? ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS] ?? o.status,
    odeme_yontemi: `${PAYMENT_LABELS[o.paymentProvider] ?? o.paymentProvider} — ${PAYMENT_STATUS_LABELS[o.paymentStatus as keyof typeof PAYMENT_STATUS_LABELS] ?? o.paymentStatus}`,
    kargo_firmasi: o.carrier || "—",
    takip_no: o.trackingNumber || "—",
    siparis_linki: link,
    banka_bilgisi: bankInfo(s),
    teslimat_adresi: a ? `${a.firstName} ${a.lastName}\n${a.addressLine}\n${a.district} / ${a.city}${a.postalCode ? ` ${a.postalCode}` : ""}\n${a.phone}` : "—",
    telefon: o.phone,
    eposta: o.email,
    magaza: s.brand.name,
  };
}

function compose(event: MailEvent, s: SiteSettings, vars: MailVars, summary: MailSummary | null, cta: { label: string; url: string } | null) {
  const t = s.mailTemplates[event];
  const subject = fill(t.subject, vars).replace(/\s+/g, " ").trim();
  const heading = fill(t.heading, vars);
  const body = fill(t.body, vars);
  const c = s.contact;
  const html = renderMailHtml({
    heading,
    body,
    summary,
    cta,
    preheader: subject,
    brand: { name: s.brand.name, logoUrl: absoluteUrl("/brand/biciriklar-logo.png"), siteUrl: absoluteUrl("/"), tagline: s.brand.tagline },
    footer: { email: c.email, phone: c.phone, address: [c.street, c.district, c.city].filter(Boolean).join(", ") || null },
  });
  return { subject, html, text: renderMailText(heading, body, summary, cta) };
}

/**
 * Sipariş olayına ait e-postayı gönderir (şablon kapalıysa veya SMTP hazır değilse sessizce geçer).
 * Hiçbir zaman hata fırlatmaz — sipariş akışını bozmaz. Sonuç sipariş zaman çizelgesine (gizli not) yazılır.
 * `orderLink`: müşterinin erişim anahtarlı sipariş bağlantısı (yalnızca sipariş anında bilinir).
 */
export async function sendOrderEmail(event: MailEvent, orderId: string, opts: { orderLink?: string; statusLabel?: string } = {}): Promise<void> {
  try {
    const s = await getSiteSettings();
    if (!s.mailTemplates[event].enabled || !mailReady(s.mail)) return;
    const [o] = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (!o) return;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, orderId)).orderBy(asc(orderItems.name));
    const store = MAIL_EVENT_INFO[event].audience === "store";
    const to = store ? s.mail.notifyEmail || s.contact.email : o.email;
    if (!to) return;
    const link = opts.orderLink ?? absoluteUrl(`/siparis-takibi`);
    const vars = varsFor(o, s, link, opts.statusLabel);
    const summary: MailSummary = {
      items: items.map((i) => ({ name: i.name, variant: i.variantLabel, quantity: i.quantity, lineTotal: i.lineTotal })),
      subtotal: o.subtotal,
      discount: o.discountTotal,
      shipping: o.shippingTotal,
      total: o.grandTotal,
    };
    const cta = store ? { label: "Siparişi panelde aç", url: absoluteUrl(`/admin/siparisler/${o.id}`) } : { label: "Siparişimi görüntüle", url: link };
    const mail = compose(event, s, vars, summary, cta);
    const res = await sendEmail({ to, ...mail, replyTo: store ? o.email : null }, s);
    await db.insert(orderEvents).values({
      orderId: o.id,
      type: "note",
      message: `E-posta (${MAIL_EVENT_INFO[event].label}) → ${to}: ${res.sent ? "gönderildi" : `gönderilemedi — ${res.error}`}`,
      isPublic: false,
      actor: "Sistem",
    });
  } catch (e) {
    console.error("[email] sipariş e-postası hazırlanamadı", event, e);
  }
}

/** Admin önizlemesi: örnek siparişle şablonun HTML'i. */
export function previewOrderEmail(event: MailEvent, s: SiteSettings) {
  const sample = {
    orderNumber: "BK-2026-1042",
    firstName: "Ayşe",
    lastName: "Yılmaz",
    email: "ornek@ornek.com",
    phone: "0 (5xx) xxx xx xx",
    grandTotal: 900,
    status: event === "order_shipped" ? "shipped" : event === "order_delivered" ? "delivered" : event === "order_cancelled" ? "cancelled" : event === "order_received" ? "pending" : "confirmed",
    paymentStatus: event === "order_received" ? "awaiting_transfer" : "paid",
    paymentProvider: event === "order_received" ? "bank_transfer" : "iyzico",
    carrier: "Yurtiçi Kargo",
    trackingNumber: "123456789012",
    shippingAddress: { firstName: "Ayşe", lastName: "Yılmaz", phone: "0 (5xx) xxx xx xx", city: "İstanbul", district: "Tuzla", postalCode: "34940", addressLine: "Örnek Mah. Örnek Sok. No: 1" },
  } as unknown as OrderRow;
  const link = absoluteUrl("/siparis-takibi");
  const summary: MailSummary = {
    items: [
      { name: "Avokado Figürlü Keçe Çanta Dikiş Kiti", quantity: 2, lineTotal: 400 },
      { name: "8’li Keçe Punch Örgü Seti", quantity: 1, lineTotal: 700 },
    ],
    subtotal: 1100,
    discount: 200,
    shipping: 0,
    total: 900,
  };
  const store = MAIL_EVENT_INFO[event].audience === "store";
  return compose(event, s, varsFor(sample, s, link), summary, store ? { label: "Siparişi panelde aç", url: absoluteUrl("/admin/siparisler") } : { label: "Siparişimi görüntüle", url: link });
}
