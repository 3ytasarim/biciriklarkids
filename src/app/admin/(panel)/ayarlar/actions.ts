"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { bool, faqItems, formObject, int, jsonArray, optional, optionalMedia, optionalMoney, required, zodErrors, type ActionState } from "@/lib/admin/form";
import { revalidateSite } from "@/lib/admin/revalidate";
import { saveSetting } from "@/lib/settings";
import { CARRIER_BRAND_KEYS, type ShippingCarrier } from "@/lib/commerce/carriers";

const url = z
  .string()
  .trim()
  .max(300)
  .refine((v) => v === "" || /^https:\/\//i.test(v), "https:// ile başlayan tam adres girin.")
  .transform((v) => (v === "" ? null : v));

const trackingId = (re: RegExp, msg: string) =>
  z
    .string()
    .trim()
    .max(40)
    .refine((v) => v === "" || re.test(v), msg)
    .transform((v) => (v === "" ? null : v));

const iban = z
  .string()
  .trim()
  .transform((v) => v.replace(/\s/g, "").toUpperCase())
  .refine((v) => v === "" || /^TR\d{24}$/.test(v), "IBAN TR ile başlamalı ve 26 karakter olmalı.")
  .transform((v) => (v === "" ? null : v.replace(/(.{4})/g, "$1 ").trim()));

/** datetime-local değeri ("YYYY-MM-DDTHH:mm") veya boş. */
const localDateTime = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v), "Geçerli bir tarih ve saat seçin.")
  .transform((v) => (v === "" ? null : v));

const schema = z.object({
  brandName: required("Marka adı", 120),
  legalName: required("Ticari ünvan", 200),
  tagline: optional(160),
  logoUrl: optionalMedia,
  defaultOgImage: optionalMedia,
  email: optional(160),
  phone: optional(40),
  whatsapp: optional(40),
  street: optional(200),
  district: optional(80),
  city: optional(80),
  postalCode: optional(10),
  workingHours: optional(160),
  instagram: url,
  facebook: url,
  youtube: url,
  tiktok: url,
  pinterest: url,
  announcementEnabled: bool,
  announcementItems: jsonArray(z.object({ text: z.string().trim().max(140), href: z.string().trim().max(300) }), 6),
  popupEnabled: bool,
  popupImage: optionalMedia,
  popupAlt: optional(200),
  popupHref: optional(300),
  popupStartsAt: localDateTime,
  popupEndsAt: localDateTime,
  popupDelay: int(0, 60),
  popupHideDays: int(0, 365),
  flatFee: optionalMoney,
  freeThreshold: optionalMoney,
  dispatchTime: optional(80),
  bankEnabled: bool,
  bankName: optional(120),
  accountHolder: optional(160),
  iban,
  bankNote: optional(300),
  gtmId: trackingId(/^GTM-[A-Z0-9]{4,12}$/, "Biçim: GTM-XXXXXXX"),
  ga4Id: trackingId(/^G-[A-Z0-9]{4,14}$/, "Biçim: G-XXXXXXXXXX"),
  googleAdsId: trackingId(/^AW-\d{6,14}$/, "Biçim: AW-123456789"),
  metaPixelId: trackingId(/^\d{6,20}$/, "Yalnızca rakam"),
  returnDays: int(0, 365),
  googleProductCategory: optional(255),
  siteFaq: faqItems,
});

/** "79,90" / "1.250,00" / "" → sayı | null */
const parseTl = (v: string) => {
  const s = v.replace(/\s/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 && n <= 1_000_000 ? Math.round(n * 100) / 100 : NaN;
};

const carrierRows = z
  .array(
    z.object({
      id: z.string().regex(/^[a-z0-9]{3,40}$/i),
      brand: z.enum(CARRIER_BRAND_KEYS),
      name: z.string().trim().max(60),
      fee: z.string().max(20),
      freeThreshold: z.string().max(20),
      note: z.string().trim().max(80),
      active: z.boolean(),
    }),
  )
  .max(12);

/** Kargo firmaları: JSON satırlar + her satırın `carrierLogo_<id>` logo alanı. */
function parseCarriers(fd: FormData): { carriers: ShippingCarrier[] } | { error: string } {
  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get("carriers") ?? "[]"));
  } catch {
    return { error: "Kargo firmaları okunamadı." };
  }
  const parsed = carrierRows.safeParse(raw);
  if (!parsed.success) return { error: "Kargo firması bilgileri geçersiz." };
  const carriers: ShippingCarrier[] = [];
  for (const r of parsed.data) {
    if (!r.name) return { error: "Her kargo firmasına bir ad girin." };
    const fee = parseTl(r.fee);
    const free = parseTl(r.freeThreshold);
    if (fee == null || Number.isNaN(fee)) return { error: `${r.name}: geçerli bir kargo ücreti girin (ücretsizse 0).` };
    if (Number.isNaN(free)) return { error: `${r.name}: ücretsiz kargo eşiği geçersiz.` };
    const logo = optionalMedia.safeParse(String(fd.get(`carrierLogo_${r.id}`) ?? ""));
    carriers.push({ id: r.id, brand: r.brand, name: r.name, fee, freeThreshold: free, note: r.note || null, logoUrl: logo.success ? logo.data : null, active: r.active });
  }
  return { carriers };
}

export async function saveSettingsAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin("admin");
  const parsed = schema.safeParse({ ...formObject(fd), announcementItems: fd.get("announcementItems") ?? "[]", siteFaq: fd.get("siteFaq") ?? "[]" });
  if (!parsed.success) return zodErrors(parsed.error);
  const d = parsed.data;
  if (d.bankEnabled && (!d.iban || !d.accountHolder)) return { status: "error", message: "Havale/EFT'yi açmak için IBAN ve hesap sahibi zorunlu.", errors: { iban: "Zorunlu." } };
  if (d.popupEnabled && !d.popupImage) return { status: "error", message: "Popup'ı açmak için bir görsel seçin.", errors: { popupImage: "Zorunlu." } };
  if (d.popupStartsAt && d.popupEndsAt && d.popupStartsAt >= d.popupEndsAt) return { status: "error", message: "Popup bitiş tarihi başlangıçtan sonra olmalı.", errors: { popupEndsAt: "Başlangıçtan sonra olmalı." } };
  const popupHref = d.popupHref && (d.popupHref.startsWith("/") || /^https:\/\//.test(d.popupHref)) ? d.popupHref : null;
  const carriers = parseCarriers(fd);
  if ("error" in carriers) return { status: "error", message: carriers.error };
  await Promise.all([
    saveSetting("brand", { name: d.brandName, legalName: d.legalName, tagline: d.tagline ?? "", logoUrl: d.logoUrl, defaultOgImage: d.defaultOgImage }),
    saveSetting("contact", { email: d.email, phone: d.phone, whatsapp: d.whatsapp, street: d.street, district: d.district, city: d.city, postalCode: d.postalCode, workingHours: d.workingHours }),
    saveSetting("social", { instagram: d.instagram, facebook: d.facebook, youtube: d.youtube, tiktok: d.tiktok, pinterest: d.pinterest }),
    saveSetting("announcement", { enabled: d.announcementEnabled, items: d.announcementItems.filter((i) => i.text).map((i) => ({ text: i.text, href: i.href.startsWith("/") || /^https?:\/\//.test(i.href) ? i.href : null })) }),
    saveSetting("popup", { enabled: d.popupEnabled, imageUrl: d.popupImage, alt: d.popupAlt ?? "", href: popupHref, startsAt: d.popupStartsAt, endsAt: d.popupEndsAt, delaySeconds: d.popupDelay, hideDays: d.popupHideDays }),
    saveSetting("shipping", { flatFee: d.flatFee, freeThreshold: d.freeThreshold, dispatchTime: d.dispatchTime, carriers: carriers.carriers }),
    saveSetting("payments", { bankTransfer: { enabled: d.bankEnabled, bankName: d.bankName, accountHolder: d.accountHolder, iban: d.iban, note: d.bankNote } }),
    saveSetting("analytics", { gtmId: d.gtmId, ga4Id: d.ga4Id, googleAdsId: d.googleAdsId, metaPixelId: d.metaPixelId }),
    saveSetting("commerce", { returnDays: d.returnDays, googleProductCategory: d.googleProductCategory }),
    saveSetting("siteFaq", d.siteFaq),
  ]);
  revalidateSite();
  return { status: "success", message: "Ayarlar kaydedildi." };
}
