import "server-only";
import { cache } from "react";
import { z } from "zod";
import { db } from "@/lib/db";
import { CARRIER_BRAND_KEYS } from "@/lib/commerce/carriers";
import { siteSettings } from "@/lib/db/schema";

/**
 * Site ayarlarının şeması ve varsayılanları. DB'de `site_settings` tablosunda anahtar başına JSON olarak
 * saklanır; eksik/bozuk anahtar varsayılana düşer. Varsayılanlar: iletişim bilgileri
 * mevcut siteden (biciriklar.com.tr) alınmıştır, diğerleri boştur ve admin'den girilir.
 */
const nullableStr = z.string().trim().max(500).nullable().catch(null);

export const settingsSchema = z.object({
  brand: z
    .object({
      name: z.string().default("Bıcırıklar Kids"),
      legalName: z.string().default("Bıcırıklar Kids"),
      tagline: z.string().default("Minik Eller İçin Büyük Hayaller"),
      logoUrl: nullableStr.default(null),
      defaultOgImage: nullableStr.default(null),
    })
    .default({ name: "Bıcırıklar Kids", legalName: "Bıcırıklar Kids", tagline: "Minik Eller İçin Büyük Hayaller", logoUrl: null, defaultOgImage: null }),
  contact: z
    .object({
      email: nullableStr.default(null),
      phone: nullableStr.default(null),
      whatsapp: nullableStr.default(null),
      street: nullableStr.default(null),
      district: nullableStr.default(null),
      city: nullableStr.default(null),
      postalCode: nullableStr.default(null),
      workingHours: nullableStr.default(null),
    })
    .default({ email: null, phone: null, whatsapp: null, street: null, district: null, city: null, postalCode: null, workingHours: null }),
  /** Yalnızca gerçek hesaplar girilir; boş olanlar sitede ve şemada (sameAs) görünmez. */
  social: z
    .object({
      instagram: nullableStr.default(null),
      facebook: nullableStr.default(null),
      youtube: nullableStr.default(null),
      tiktok: nullableStr.default(null),
      pinterest: nullableStr.default(null),
    })
    .default({ instagram: null, facebook: null, youtube: null, tiktok: null, pinterest: null }),
  announcement: z
    .object({
      enabled: z.boolean().default(true),
      items: z.array(z.object({ text: z.string().max(140), href: z.string().max(300).nullable().default(null) })).max(6).default([]),
    })
    .default({ enabled: true, items: [] }),
  /** Kampanya popup'ı. Tarihler İstanbul saatiyle "YYYY-MM-DDTHH:mm"; boşsa o yönde sınır yok. */
  popup: z
    .object({
      enabled: z.boolean().default(false),
      imageUrl: nullableStr.default(null),
      alt: z.string().max(200).catch("").default(""),
      href: nullableStr.default(null),
      startsAt: nullableStr.default(null),
      endsAt: nullableStr.default(null),
      /** Ziyaretçi açılıştan kaç saniye sonra görür. */
      delaySeconds: z.number().int().min(0).max(60).catch(4).default(4),
      /** Kapatan ziyaretçiye kaç gün sonra tekrar gösterilir. */
      hideDays: z.number().int().min(0).max(365).catch(3).default(3),
    })
    .default({ enabled: false, imageUrl: null, alt: "", href: null, startsAt: null, endsAt: null, delaySeconds: 4, hideDays: 3 }),
  shipping: z
    .object({
      /** Sabit kargo ücreti (TL). null → ayarlanmadı: ödeme özetinde "sipariş onayında bildirilir" yazar. */
      flatFee: z.number().min(0).nullable().default(null),
      /** Bu tutar ve üzeri ücretsiz kargo (TL). null → kampanya yok. */
      freeThreshold: z.number().min(0).nullable().default(null),
      /** Tahmini kargoya teslim süresi metni (ör. "1–3 iş günü"). */
      dispatchTime: nullableStr.default(null),
      /** Kargo firmaları; aktif olan varsa ödeme adımında müşteri seçer (lib/commerce/carriers.ts). */
      carriers: z
        .array(
          z.object({
            id: z.string().min(1).max(40),
            brand: z.enum(CARRIER_BRAND_KEYS).catch("other"),
            name: z.string().max(60),
            fee: z.number().min(0),
            freeThreshold: z.number().min(0).nullable().default(null),
            note: nullableStr.default(null),
            logoUrl: nullableStr.default(null),
            active: z.boolean().default(true),
          }),
        )
        .max(12)
        .default([]),
    })
    .default({ flatFee: null, freeThreshold: null, dispatchTime: null, carriers: [] }),
  payments: z
    .object({
      bankTransfer: z
        .object({
          enabled: z.boolean().default(false),
          bankName: nullableStr.default(null),
          accountHolder: nullableStr.default(null),
          iban: nullableStr.default(null),
          note: nullableStr.default(null),
        })
        .default({ enabled: false, bankName: null, accountHolder: null, iban: null, note: null }),
    })
    .default({ bankTransfer: { enabled: false, bankName: null, accountHolder: null, iban: null, note: null } }),
  /**
   * Kartla ödeme (iyzico) — admin'den girilir. Sunucuda IYZICO_* ENV tanımlıysa ENV önceliklidir.
   * Gizli anahtar şifreli saklanır (lib/crypto/secret-box); istemciye hiçbir zaman gönderilmez.
   */
  iyzico: z
    .object({
      enabled: z.boolean().default(false),
      mode: z.enum(["live", "sandbox"]).catch("live").default("live"),
      apiKey: nullableStr.default(null),
      secretKeyEnc: z.string().max(2000).nullable().catch(null).default(null),
      /** Ekranda kaydın varlığını göstermek için gizli anahtarın son 4 karakteri */
      secretLast4: z.string().max(4).nullable().catch(null).default(null),
      installments: z.string().max(40).catch("1,2,3,6,9").default("1,2,3,6,9"),
    })
    .default({ enabled: false, mode: "live", apiKey: null, secretKeyEnc: null, secretLast4: null, installments: "1,2,3,6,9" }),
  analytics: z
    .object({
      gtmId: nullableStr.default(null),
      ga4Id: nullableStr.default(null),
      googleAdsId: nullableStr.default(null),
      metaPixelId: nullableStr.default(null),
    })
    .default({ gtmId: null, ga4Id: null, googleAdsId: null, metaPixelId: null }),
  commerce: z
    .object({
      /** Cayma hakkı süresi (gün) — mevcut iade politikasında 14 gün. */
      returnDays: z.number().int().min(0).max(365).default(14),
      /** Merchant feed varsayılan Google ürün kategorisi (ürün bazında ezilebilir). */
      googleProductCategory: nullableStr.default(null),
    })
    .default({ returnDays: 14, googleProductCategory: null }),
  /** /sss sayfasındaki sorular (sayfada görünür → FAQPage). */
  siteFaq: z.array(z.object({ question: z.string().max(300), answer: z.string().max(4000) })).max(60).catch([]).default([]),
});

export type SiteSettings = z.infer<typeof settingsSchema>;
export type SettingsKey = keyof SiteSettings;

export const getSiteSettings = cache(async (): Promise<SiteSettings> => {
  let rows: { key: string; value: unknown }[] = [];
  try {
    rows = await db.select({ key: siteSettings.key, value: siteSettings.value }).from(siteSettings);
  } catch (e) {
    console.error("[settings] okunamadı, varsayılanlar kullanılıyor", e);
  }
  const raw: Record<string, unknown> = {};
  for (const r of rows) raw[r.key] = r.value;
  const parsed = settingsSchema.safeParse(raw);
  if (parsed.success) return parsed.data;
  // Bozuk anahtar varsa yalnızca o anahtarı varsayılana düşür.
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(settingsSchema.shape) as SettingsKey[]) {
    const one = settingsSchema.shape[key].safeParse(raw[key]);
    out[key] = one.success ? one.data : settingsSchema.shape[key].parse(undefined);
  }
  return out as SiteSettings;
});

export async function saveSetting<K extends SettingsKey>(key: K, value: SiteSettings[K]) {
  const parsed = settingsSchema.shape[key].parse(value);
  await db
    .insert(siteSettings)
    .values({ key, value: parsed })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: parsed, updatedAt: new Date() } });
}

/** ENV değeri admin ayarından önceliklidir (deploy ortamına göre farklı ID kullanılabilsin). */
export function resolveAnalyticsIds(s: SiteSettings["analytics"]) {
  const pick = (env: string | undefined, db: string | null) => (env?.trim() ? env.trim() : db?.trim() || null);
  return {
    gtmId: pick(process.env.NEXT_PUBLIC_GTM_ID, s.gtmId),
    ga4Id: pick(process.env.NEXT_PUBLIC_GA4_ID, s.ga4Id),
    googleAdsId: pick(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID, s.googleAdsId),
    metaPixelId: pick(process.env.NEXT_PUBLIC_META_PIXEL_ID, s.metaPixelId),
  };
}
