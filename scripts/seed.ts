import "./env";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";
import { DEFAULT_HOMEPAGE_SECTIONS } from "../src/lib/content/homepage-defaults";
import { SEED_CATEGORIES } from "./seed-data/categories";
import { SEED_PAGES, SITE_FAQ } from "./seed-data/pages";

/**
 * Temel içerik seed'i (idempotent). Var olan kayıtların ÜZERİNE YAZMAZ (admin düzenlemeleri korunur);
 * `--force` ile sayfa/kategori metinleri seed'deki haline döndürülür.
 * Ürün EKLEMEZ — örnek ürünler için: npm run db:seed-demo
 */
const force = process.argv.includes("--force");

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  const { siteSettings, categories, pages, homepageSections, videos, redirects } = schema;

  // ── Site ayarları (mevcut siteden gerçek iletişim bilgileri; diğerleri boş) ──
  const settings: Record<string, unknown> = {
    brand: { name: "Bıcırıklar Kids", legalName: "Bıcırıklar Kids", tagline: "Minik Eller İçin Büyük Hayaller", logoUrl: null, defaultOgImage: null },
    contact: {
      email: "info@dholazer.com",
      phone: "0 (536) 825 26 34",
      whatsapp: null,
      street: "Yayla Mah. Vatan Cad. No: 45/B",
      district: "Tuzla",
      city: "İstanbul",
      postalCode: null,
      workingHours: null,
    },
    social: { instagram: null, facebook: null, youtube: null, tiktok: null, pinterest: null },
    announcement: { enabled: true, items: [{ text: "Duyuru alanı · Kampanya metnini Admin › Ayarlar › Duyuru Çubuğu’ndan girin", href: null }] },
    shipping: { flatFee: null, freeThreshold: null, dispatchTime: null },
    payments: { bankTransfer: { enabled: false, bankName: null, accountHolder: null, iban: null, note: null } },
    analytics: { gtmId: null, ga4Id: null, googleAdsId: null, metaPixelId: null },
    commerce: { returnDays: 14, googleProductCategory: null },
    siteFaq: SITE_FAQ,
  };
  for (const [key, value] of Object.entries(settings)) {
    await db.insert(siteSettings).values({ key, value }).onConflictDoNothing();
  }
  console.log("✓ Site ayarları");

  // ── Kategoriler ──
  for (const c of SEED_CATEGORIES) {
    const values = {
      name: c.name,
      slug: c.slug,
      accent: c.accent,
      sortOrder: c.sortOrder,
      description: c.description,
      content: c.content ?? null,
      faq: c.faq ?? [],
      seoTitle: c.seoTitle ?? null,
      seoDescription: c.seoDescription ?? null,
    };
    if (force) await db.insert(categories).values(values).onConflictDoUpdate({ target: categories.slug, set: values });
    else await db.insert(categories).values(values).onConflictDoNothing();
  }
  console.log(`✓ ${SEED_CATEGORIES.length} kategori`);

  // ── Sayfalar ──
  for (const p of SEED_PAGES) {
    const values = { slug: p.slug, title: p.title, kind: p.kind, excerpt: p.excerpt ?? null, content: p.content, faq: p.faq ?? [], sortOrder: p.sortOrder, showInFooter: p.showInFooter ?? true };
    if (force) await db.insert(pages).values(values).onConflictDoUpdate({ target: pages.slug, set: values });
    else await db.insert(pages).values(values).onConflictDoNothing();
  }
  console.log(`✓ ${SEED_PAGES.length} sayfa`);

  // ── Ana sayfa bölümleri ──
  let order = 0;
  for (const s of DEFAULT_HOMEPAGE_SECTIONS) {
    await db
      .insert(homepageSections)
      .values({ key: s.key, type: s.type, eyebrow: s.eyebrow ?? null, title: s.title ?? null, subtitle: s.subtitle ?? null, config: s.config, isActive: s.isActive ?? true, sortOrder: order++ * 10 })
      .onConflictDoNothing();
  }
  // "Eğitici Favoriler" bölümünü eğitici aktivite kategorisine bağla (kategori varsa).
  await db.execute(sql`
    update homepage_sections set config = jsonb_set(config, '{categoryId}', to_jsonb(c.id::text))
    from categories c where homepage_sections.key = 'educational' and c.slug = 'egitici-aktivite-kitleri'
      and (homepage_sections.config->>'categoryId') is null`);
  console.log(`✓ ${DEFAULT_HOMEPAGE_SECTIONS.length} ana sayfa bölümü`);

  // ── Video alanları (URL boş → sitede "VideoTest" yer tutucusu) ──
  const slots = [
    { slot: "home-lifestyle", title: "Atölyeden: küçük ellerde büyük işler", aspectRatio: "21/9", mobileAspectRatio: "4/5" },
    { slot: "home-howto", title: "Ürün nasıl kullanılır?", aspectRatio: "4/3", mobileAspectRatio: "4/5" },
    { slot: "home-brand", title: "Bıcırıklar Kids marka filmi", aspectRatio: "21/9", mobileAspectRatio: "4/5" },
  ];
  for (const v of slots) await db.insert(videos).values(v).onConflictDoNothing();
  console.log(`✓ ${slots.length} video alanı (VideoTest)`);

  // ── Eski Wix URL'lerinden 301 yönlendirmeler ──
  const legacy: [string, string][] = [
    ["/category/all-products", "/urunler"],
    ["/category/keçe-çanta-dikiş-kitleri", "/kategori/kece-canta-dikis-kitleri"],
    ["/category/keçe-oyuncak-dikiş-kitleri", "/kategori/kece-oyuncak-dikis-kitleri"],
    ["/category/hazır-setler", "/urunler"],
    ["/cart-page", "/sepet"],
    ["/blank", "/gizlilik-politikasi"],
    ["/blank-3", "/sartlar-ve-kosullar"],
    ["/blank-4", "/iade-politikasi"],
    ["/kvkk-aydınlatma-metni", "/kvkk-aydinlatma-metni"],
    ["/çerez-kullanımı-politikası", "/cerez-politikasi"],
  ];
  for (const [sourcePath, destinationPath] of legacy) {
    await db.insert(redirects).values({ sourcePath, destinationPath, statusCode: 301, note: "Eski Wix sitesi" }).onConflictDoNothing();
  }
  console.log(`✓ ${legacy.length} eski URL yönlendirmesi`);

  await pool.end();
  console.log("Seed tamamlandı.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
