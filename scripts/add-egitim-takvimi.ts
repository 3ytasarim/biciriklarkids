import "./env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import sharp from "sharp";
import * as schema from "../src/lib/db/schema";
import { buildSearchText } from "../src/lib/catalog/search-text";
import { nextSku } from "../src/lib/catalog/sku";
import { normalizeShot, plainWebp } from "./lib/product-shot";

/**
 * "Türkçe Renkli Keçe Eğitim Takvimi" ürününü Eğitici Aktivite Kitleri kategorisine ekler.
 * Kullanım: npx tsx scripts/add-egitim-takvimi.ts <stüdyo.png> <afiş.jpg> <foto1.jpg> <foto2.jpg> <foto3.jpg>
 * Ürün zaten varsa (slug) hiçbir şey yapmaz.
 */
const [studio, poster, ...photos] = process.argv.slice(2);
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "storage", "uploads"));
const SLUG = "turkce-renkli-kece-egitim-takvimi";
const NAME = "Türkçe Renkli Keçe Eğitim Takvimi";

/** 4:5 dikey kırpım (detay fotoğrafları) */
const portrait = async (buf: Buffer) => {
  const src = sharp(buf).rotate();
  const { width = 0, height = 0 } = await src.metadata();
  const h = Math.min(height, Math.round(width / 0.8));
  const w = Math.min(width, Math.round(h * 0.8));
  return src
    .extract({ left: Math.round((width - w) / 2), top: Math.round((height - h) / 2), width: w, height: h })
    .resize(1200, 1500, { fit: "cover" })
    .webp({ quality: 84 })
    .toBuffer();
};

async function main() {
  if (!studio || !poster || photos.length === 0) throw new Error("Kullanım: <stüdyo> <afiş> <foto...>");
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  const { products, productImages, categories, media } = schema;

  const [exists] = await db.select({ id: products.id }).from(products).where(eq(products.slug, SLUG)).limit(1);
  if (exists) {
    console.log("= zaten var:", SLUG);
    return pool.end();
  }
  const [cat] = await db.select({ id: categories.id, name: categories.name }).from(categories).where(eq(categories.slug, "egitici-aktivite-kitleri")).limit(1);
  if (!cat) throw new Error("Kategori yok: egitici-aktivite-kitleri");

  const short = "Duvara asılan 95 × 75 cm keçe takvim: ay, gün, yıl, tarih, mevsim ve hava durumu parçalarıyla her sabah “bugün”ü birlikte kurun.";
  const description =
    "<p>Kırmızı keçe zemin üzerinde <strong>ay, gün, yıl, tarih, mevsim ve hava durumu</strong> bölümleri olan renkli eğitim takvimi. Çocuk her sabah ortadaki <strong>“Bugün”</strong> alanına doğru ayı, günü, tarihi, mevsimi ve hava durumunu yerleştirir; zaman kavramları günlük bir rutinle, dokunarak öğrenilir.</p>" +
    "<p>Tüm yazılar Türkçedir. Ay ve gün kartları renk gruplarına ayrılmıştır; hava durumu ve mevsim kartlarında keçe figürler bulunur.</p>" +
    "<p>Üst kenarındaki askılarla çocuk odasına, sınıfa ya da anaokulu panosuna asılabilir. Ölçüler: 95 × 75 cm.</p>";
  const contents = [
    "1 adet keçe takvim panosu (95 × 75 cm)",
    "12 ay kartı (Ocak – Aralık)",
    "7 gün kartı (Pazartesi – Pazar)",
    "6 yıl kartı (2026 – 2031)",
    "12 rakam kartı (tarih için)",
    "4 mevsim kartı (İlkbahar, Yaz, Sonbahar, Kış)",
    "8 hava durumu kartı (Sağanak, Güneşli, Rüzgârlı, Yağmurlu, Bulutlu, Parçalı Bulutlu, Karlı, Sulu Kar)",
  ].join("\n");

  const sku = await nextSku(db as never, cat.id);
  const [p] = await db
    .insert(products)
    .values({
      name: NAME,
      slug: SLUG,
      sku,
      shortDescription: short,
      description,
      price: 1500,
      stock: 0,
      trackStock: false,
      status: "active",
      publishedAt: new Date(),
      newProduct: true,
      giftProduct: true,
      categoryId: cat.id,
      productType: "Eğitici Kit",
      material: "Keçe",
      contents,
      safetyInformation: "Küçük parçalar içerdiğinden 3 yaş altındaki çocuklardan uzak tutun; küçük yaşlarda bir yetişkin eşliğinde kullanılması önerilir.",
      usageInformation: "Takvimi çocuğun boyuna uygun bir yüksekliğe asın. Her sabah birlikte ayı, günü, tarihi, mevsimi ve hava durumunu seçip “Bugün” alanına yerleştirin.",
      sortOrder: 40,
      searchText: buildSearchText({ name: NAME, productType: "Eğitici Kit", shortDescription: short }, cat.name),
    })
    .returning({ id: products.id });

  const shots: { buf: Buffer; alt: string }[] = [
    { buf: (await normalizeShot(await readFile(studio))) ?? (await plainWebp(await readFile(studio))), alt: NAME },
    { buf: await plainWebp(await readFile(poster)), alt: `${NAME} – 95 × 75 cm, çocuklarla birlikte` },
    ...(await Promise.all(photos.map(async (f, i) => ({ buf: await portrait(await readFile(f)), alt: `${NAME} – keçe kart detayı ${i + 1}` })))),
  ];
  let n = 0;
  for (const s of shots) {
    n++;
    const key = `products/${SLUG}-${n}.webp`;
    const full = path.join(UPLOAD_ROOT, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, s.buf, { flag: "wx" });
    const m = await sharp(s.buf).metadata();
    const url = `/uploads/${key}`;
    await db.insert(media).values({ url, storageKey: key, filename: path.basename(key), originalName: path.basename(key), mimeType: "image/webp", size: s.buf.length, width: m.width!, height: m.height!, alt: s.alt }).onConflictDoNothing();
    await db.insert(productImages).values({ productId: p!.id, imageUrl: url, alt: s.alt, title: NAME, width: m.width!, height: m.height!, sortOrder: n, isPrimary: n === 1 });
  }
  console.log(`+ ${NAME} (${sku}, ${shots.length} görsel) → /urun/${SLUG}`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
