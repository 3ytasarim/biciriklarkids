import "./env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import sharp from "sharp";
import { renderToStaticMarkup } from "react-dom/server";
import * as schema from "../src/lib/db/schema";
import { FeltArt, type Motif } from "../src/components/ui/FeltArt";
import type { Accent } from "../src/lib/catalog/types";
import { buildSearchText } from "../src/lib/catalog/search-text";

/**
 * TASARIM TESTİ İÇİN ÖRNEK ÜRÜNLER — "DEMO PRODUCT" olarak açıkça işaretli (ad, SKU, rozet, isDemo=true).
 * Görseller stok fotoğraf değil, üretilmiş keçe illüstrasyonlarıdır ve üzerinde "DEMO" yazar.
 * Demo ürünler sitemap, Merchant feed ve JSON-LD Product şemasına girmez; sayfaları noindex'tir.
 * Temizlemek için: npm run demo:clear
 */
type Demo = {
  key: string;
  name: string;
  category: string;
  price: number;
  compareAt?: number;
  stock: number;
  flags?: Partial<Record<"bestseller" | "newProduct" | "giftProduct" | "featured", boolean>>;
  age: [number, number];
  difficulty: "easy" | "medium" | "hard";
  type: string;
  art: [Accent, Motif][];
};

const DEMOS: Demo[] = [
  { key: "fil-canta", name: "Fil Figürlü Keçe Çanta Kiti", category: "kece-canta-dikis-kitleri", price: 200, compareAt: 250, stock: 40, flags: { bestseller: true, giftProduct: true }, age: [5, 10], difficulty: "easy", type: "Dikiş Kiti", art: [["sky", "bag"], ["sun", "bear"]] },
  { key: "kedi-canta", name: "Kedi Figürlü Keçe Çanta Kiti", category: "kece-canta-dikis-kitleri", price: 200, compareAt: 250, stock: 25, flags: { newProduct: true }, age: [5, 10], difficulty: "easy", type: "Dikiş Kiti", art: [["coral", "cat"], ["berry", "bag"]] },
  { key: "roket-canta", name: "Roket Figürlü Keçe Çanta Kiti", category: "kece-canta-dikis-kitleri", price: 220, stock: 18, flags: { featured: true }, age: [6, 11], difficulty: "medium", type: "Dikiş Kiti", art: [["sky", "rocket"], ["coral", "bag"]] },
  { key: "panda-oyuncak", name: "Panda Elyaf Dolgulu Keçe Oyuncak Kiti", category: "kece-oyuncak-dikis-kitleri", price: 180, compareAt: 220, stock: 2, flags: { bestseller: true }, age: [6, 12], difficulty: "medium", type: "Oyuncak Kiti", art: [["leaf", "bear"], ["sun", "star"]] },
  { key: "balik-oyuncak", name: "Balık Elyaf Dolgulu Keçe Oyuncak Kiti", category: "kece-oyuncak-dikis-kitleri", price: 180, stock: 30, flags: { newProduct: true, giftProduct: true }, age: [5, 10], difficulty: "easy", type: "Oyuncak Kiti", art: [["sky", "fish"], ["lilac", "fish"]] },
  { key: "dortlu-oyuncak", name: "4’lü Deniz Hayvanları Keçe Oyuncak Seti", category: "kece-oyuncak-dikis-kitleri", price: 420, compareAt: 560, stock: 12, flags: { featured: true, bestseller: true }, age: [6, 12], difficulty: "medium", type: "Oyuncak Kiti", art: [["sun", "star"], ["sky", "fish"]] },
  { key: "egitim-seti", name: "6’lı Keçe Çanta Eğitim Dikiş Seti", category: "egitim-dikis-setleri", price: 880, compareAt: 1100, stock: 8, flags: { giftProduct: true }, age: [6, 12], difficulty: "medium", type: "Eğitim Seti", art: [["coral", "flower"], ["leaf", "bag"]] },
  { key: "punch-seti", name: "Keçe Punch Örgü Seti", category: "punch-orgu-setleri", price: 390, stock: 0, age: [8, 14], difficulty: "hard", type: "Punch Seti", art: [["berry", "heart"], ["lilac", "flower"]] },
  { key: "ahsap-boyama", name: "Ahşap Orman Hayvanları Boyama Seti", category: "ahsap-boyama-setleri", price: 190, stock: 22, flags: { newProduct: true }, age: [4, 9], difficulty: "easy", type: "Boyama Seti", art: [["leaf", "flower"], ["sun", "cat"]] },
  { key: "gece-lambasi", name: "Keçe Gece Lambası Kendin Yap Kiti", category: "kendin-yap-setleri", price: 400, compareAt: 480, stock: 15, flags: { featured: true, giftProduct: true }, age: [7, 13], difficulty: "medium", type: "DIY Kiti", art: [["lilac", "star"], ["sun", "rocket"]] },
  { key: "haftanin-gunleri", name: "Haftanın Günleri Eğitici Keçe Kiti", category: "egitici-aktivite-kitleri", price: 900, stock: 6, age: [4, 8], difficulty: "easy", type: "Eğitici Kit", art: [["sun", "heart"], ["sky", "star"]] },
  { key: "kalp-canta", name: "Kalp Figürlü Keçe Çanta Kiti", category: "kece-canta-dikis-kitleri", price: 200, stock: 3, flags: { giftProduct: true }, age: [5, 10], difficulty: "easy", type: "Dikiş Kiti", art: [["berry", "heart"], ["coral", "bag"]] },
];

const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "storage", "uploads"));

async function renderImage(accent: Accent, motif: Motif, file: string): Promise<{ url: string; key: string; size: number }> {
  const art = renderToStaticMarkup(<FeltArt accent={accent} motif={motif} />).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1440" ');
  const label = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1440"><rect x="420" y="1300" width="360" height="84" rx="42" fill="#5f4fb5"/><text x="600" y="1356" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="700" fill="#fff" text-anchor="middle" letter-spacing="6">DEMO ÜRÜN</text></svg>`;
  const buf = await sharp(Buffer.from(art))
    .resize(1200, 1440)
    .composite([{ input: Buffer.from(label) }])
    .webp({ quality: 88 })
    .toBuffer();
  const key = `demo/${file}.webp`;
  const full = path.join(UPLOAD_ROOT, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buf);
  return { url: `/uploads/${key}`, key, size: buf.length };
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  const { products, productImages, categories, media } = schema;

  const cats = await db.select({ id: categories.id, slug: categories.slug, name: categories.name }).from(categories);
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));
  if (!cats.length) throw new Error("Önce `npm run db:seed` çalıştırın (kategoriler yok).");

  let i = 0;
  for (const d of DEMOS) {
    i++;
    const name = `DEMO PRODUCT · ${d.name}`;
    const slug = `demo-${d.key}`;
    const sku = `DEMO-${String(i).padStart(3, "0")}`;
    const cat = catBySlug.get(d.category) ?? null;
    const exists = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
    if (exists.length) continue;

    const [p] = await db
      .insert(products)
      .values({
        name,
        slug,
        sku,
        shortDescription: "Tasarım testi için eklenmiş örnek (DEMO) ürün. Gerçek ürün bilgisi değildir; yayın öncesi silinecektir.",
        description:
          "<p><strong>Bu bir DEMO PRODUCT kaydıdır.</strong> Ürün kartı, galeri, sepet ve ödeme akışını test etmek için eklenmiştir. Fiyat, stok ve içerik bilgileri örnektir.</p><p>Gerçek ürünler Admin › Ürünler bölümünden eklendiğinde bu kayıt <code>npm run demo:clear</code> komutuyla silinebilir.</p>",
        price: d.price,
        compareAtPrice: d.compareAt ?? null,
        stock: d.stock,
        trackStock: true,
        status: "active",
        featured: d.flags?.featured ?? false,
        bestseller: d.flags?.bestseller ?? false,
        newProduct: d.flags?.newProduct ?? false,
        giftProduct: d.flags?.giftProduct ?? false,
        categoryId: cat?.id ?? null,
        productType: d.type,
        ageMin: d.age[0],
        ageMax: d.age[1],
        difficulty: d.difficulty,
        material: "Örnek veri (demo)",
        contents: "Örnek içerik satırı 1 (demo)\nÖrnek içerik satırı 2 (demo)\nÖrnek içerik satırı 3 (demo)",
        usageInformation: "Örnek kullanım bilgisi (demo). Gerçek ürün eklendiğinde adım adım kullanım talimatı buraya yazılır.",
        safetyInformation: "Örnek güvenlik bilgisi (demo). Gerçek ürünün yaş ve güvenlik uyarıları buraya yazılır.",
        isDemo: true,
        sortOrder: i,
        publishedAt: new Date(Date.now() - i * 86_400_000),
        searchText: buildSearchText({ name, sku, productType: d.type }, cat?.name),
      })
      .returning({ id: products.id });

    let n = 0;
    for (const [accent, motif] of d.art) {
      n++;
      const img = await renderImage(accent, motif, `${slug}-${n}`);
      const alt = `${name} — örnek görsel ${n}`;
      await db
        .insert(media)
        .values({ url: img.url, storageKey: img.key, filename: path.basename(img.key), originalName: path.basename(img.key), mimeType: "image/webp", size: img.size, width: 1200, height: 1440, alt })
        .onConflictDoNothing();
      await db.insert(productImages).values({ productId: p!.id, imageUrl: img.url, alt, title: name, width: 1200, height: 1440, sortOrder: n, isPrimary: n === 1 });
    }
    console.log(`✓ ${name}`);
  }
  const count = await db.select({ id: products.id }).from(products).where(inArray(products.slug, DEMOS.map((d) => `demo-${d.key}`)));
  console.log(`Demo ürün sayısı: ${count.length}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
