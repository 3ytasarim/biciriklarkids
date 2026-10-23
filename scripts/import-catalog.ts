import "./env";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import sharp from "sharp";
import * as schema from "../src/lib/db/schema";
import { buildSearchText } from "../src/lib/catalog/search-text";

/**
 * Ürün fotoğraflarından katalog kaydı oluşturur (1. parti).
 * - Ürünler TASLAK (draft) olarak eklenir: fiyat admin'den girilir (price=0).
 *   Admin › Ürünler'de fiyat girilip durum "Aktif" yapılınca yayına çıkar.
 * - Açıklamalar yalnızca fotoğraflarda/afişlerde yazan bilgilerden üretilmiştir.
 * - İdempotent: aynı slug varsa ürün atlanır.
 * Kullanım: npx tsx scripts/import-catalog.ts <kaynak-görsel-klasörü>
 */
const SRC = process.argv[2];
if (!SRC) throw new Error("Kaynak görsel klasörü verilmedi.");
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "storage", "uploads"));

type NewCategory = { name: string; slug: string; accent: string; sortOrder: number; description: string; image: string; imageAlt: string };
type Item = {
  slug: string;
  name: string;
  category: string;
  type: string;
  images: string[]; // kaynak dosya adları; ilki kapak
  short: string;
  description: string;
  contents?: string;
  material?: string;
  usage?: string;
  safety?: string;
  ageMin?: number;
  flags?: Partial<Record<"newProduct" | "giftProduct" | "featured", boolean>>;
};

const NEW_CATEGORIES: NewCategory[] = [
  {
    name: "Alçı Boyama Setleri",
    slug: "alci-boyama-setleri",
    accent: "lilac",
    sortOrder: 8,
    description: "Boyanmaya hazır alçı figürler, 6 renk boya ve fırçadan oluşan boyama setleri: taşıtlar, tatlılar, prensesler, uzay, deniz canlıları ve daha fazlası.",
    image: "p03.png",
    imageAlt: "Alçı boyama seti: dondurma, makaron ve cupcake figürleri, 6 renk boya ve fırça",
  },
  {
    name: "Keçe Çocuk Seccadeleri",
    slug: "kece-cocuk-seccadeleri",
    accent: "berry",
    sortOrder: 9,
    description: "Çocuklar için keçeden, cami ve “Mutluluk Namazda” yazısıyla süslenmiş renkli seccadeler.",
    image: "c-seccade-erkek.jpg",
    imageAlt: "Mavi keçe çocuk seccadesi ve seccadede namaz kılan çocuk",
  },
  {
    name: "Keçe Karne Dosyaları",
    slug: "kece-karne-dosyalari",
    accent: "sky",
    sortOrder: 10,
    description: "A4 belgeler için keçeden karnelik dosyalar: roket ve pati temalı, hafif ve taşıması kolay.",
    image: "c-roket.jpg",
    imageAlt: "Lacivert keçe karne dosyası, roket figürlü",
  },
];

/** ["Prenses","Prenses","Fil"] → [[Prenses,2],[Fil,1]] (sıra korunur) */
const group = (figures: string[]) => [...figures.reduce((m, f) => m.set(f, (m.get(f) ?? 0) + 1), new Map<string, number>())];
const figureList = (figures: string[]) => group(figures).map(([f, n]) => (n > 1 ? `${n} ${f}` : f).toLocaleLowerCase("tr-TR")).join(", ");
const PAINT_CONTENTS = (figures: string[]) => [...group(figures).map(([f, n]) => `${n} adet ${f.toLocaleLowerCase("tr-TR")} figürü`), "6 renk boya", "1 adet fırça"].join("\n");
const PAINT_USAGE = "Figürleri gazete serilmiş bir masaya yerleştirin, fırçayla istediğiniz renklere boyayın ve boyanın kurumasını bekleyin. Renk geçişlerinde bir rengin kurumasını beklemek daha temiz sonuç verir.";
const PAINT_SAFETY = "Küçük çocuklar boyama yaparken bir yetişkin eşlik etmelidir. Boyalar yutulmamalı, kullanım sonrası eller yıkanmalıdır.";

function plaster(slug: string, name: string, img: string, figures: string[], theme: string): Item {
  return {
    slug,
    name,
    category: "alci-boyama-setleri",
    type: "Boyama Seti",
    images: [img],
    short: `${figures.length} alçı figür, 6 renk boya ve fırça: ${theme} temalı boyama seti.`,
    description: `<p>${theme} temalı bu sette boyanmaya hazır <strong>${figures.length} alçı figür</strong> (${figureList(figures)}), 6 renk boya ve bir fırça bulunur.</p><p>Çocuk figürleri dilediği renklere boyar; boyası kuruyan figürler raf, masa ya da oyun köşesinde sergilenebilir.</p>`,
    contents: PAINT_CONTENTS(figures),
    material: "Alçı figürler, boya, fırça",
    usage: PAINT_USAGE,
    safety: PAINT_SAFETY,
    flags: { newProduct: true },
  };
}

function wooden(slug: string, name: string, img: string, figures: string[], theme: string): Item {
  return {
    ...plaster(slug, name, img, figures, theme),
    category: "ahsap-boyama-setleri",
    short: `${figures.length} ahşap figür, 6 renk boya ve fırça: ${theme} temalı ahşap boyama seti.`,
    description: `<p>${theme} temalı bu sette, çizgileri işlenmiş <strong>${figures.length} ahşap figür</strong> (${figureList(figures)}), 6 renk boya ve bir fırça bulunur.</p><p>İşlenmiş çizgiler boyamayı kolaylaştırır; boyanan figürler süs ya da oyuncak olarak kullanılabilir.</p>`,
    material: "Ahşap figürler, boya, fırça",
  };
}

const ITEMS: Item[] = [
  {
    slug: "kece-cocuk-seccadesi-pembe",
    name: "Kız Çocukları İçin Keçe Seccade – Pembe",
    category: "kece-cocuk-seccadeleri",
    type: "Seccade",
    images: ["c-seccade-kiz.jpg", "wa0.jpeg"],
    short: "45 × 85 cm, keçeden, cami ve “Mutluluk Namazda” yazılı pembe çocuk seccadesi. 3 yaş ve üzeri.",
    description:
      "<p>Kız çocukları için özel olarak tasarlanan bu seccade; cami figürü, çiçek detayları ve <strong>“Mutluluk Namazda”</strong> yazısıyla ibadeti daha keyifli ve anlamlı hale getirmek için üretildi.</p><p>Alt kısımdaki ayak izi figürü, çocuğun seccadede nerede duracağını gösterir. Yumuşak keçe yüzeyi rahat kullanım sağlar; doğum günü, Ramazan Bayramı ve özel günler için anlamlı bir hediye seçeneğidir.</p>",
    contents: "1 adet keçe seccade (45 × 85 cm)",
    material: "Keçe",
    ageMin: 3,
    flags: { newProduct: true, giftProduct: true },
  },
  {
    slug: "kece-cocuk-seccadesi-mavi",
    name: "Erkek Çocukları İçin Keçe Seccade – Mavi",
    category: "kece-cocuk-seccadeleri",
    type: "Seccade",
    images: ["c-seccade-erkek.jpg", "wa4.jpeg"],
    short: "Keçeden, cami ve “Mutluluk Namazda” yazılı mavi çocuk seccadesi; hafif ve taşınabilir.",
    description:
      "<p>Mavi tonlarındaki bu keçe seccade; cami figürü ve <strong>“Mutluluk Namazda”</strong> yazısıyla çocukları namaza sevgiyle davet eder.</p><p>Ayak izi figürü doğru duruş alanını gösterir. Hafif yapısı sayesinde kolayca katlanıp taşınabilir.</p>",
    contents: "1 adet keçe seccade",
    material: "Keçe",
    flags: { newProduct: true, giftProduct: true },
  },
  {
    slug: "kece-karne-dosyasi-roket",
    name: "Keçe Karne Dosyası – Roket",
    category: "kece-karne-dosyalari",
    type: "Karne Dosyası",
    images: ["c-roket.jpg", "wa2.jpeg"],
    short: "Lacivert keçe, roket figürlü karnelik dosya. A4 belgeler için ideal boyut.",
    description:
      "<p>Okulda, kurslarda ve evde önemli belgeler artık güvende ve düzenli. Lacivert keçe üzerine roket ve yıldız figürleriyle hazırlanan bu karnelik dosya, <strong>A4 belgeler</strong> ve daha fazlası için ideal boyuttadır.</p><p>Hafif yapısıyla çocuklar kolayca taşır; karne günü için anlamlı bir hediyedir.</p>",
    contents: "1 adet keçe karne dosyası",
    material: "Keçe",
    flags: { newProduct: true, giftProduct: true },
  },
  {
    slug: "kece-karne-dosyasi-pati",
    name: "Keçe Karne Dosyası – Pati",
    category: "kece-karne-dosyalari",
    type: "Karne Dosyası",
    images: ["c-pati.jpg", "wa3.jpeg"],
    short: "Pembe keçe, pati figürlü karnelik dosya. A4 belgeler için ideal boyut.",
    description:
      "<p>Pembe tonlarında, sevimli pati figürlü bu keçe karnelik dosya ile başarılar daha renkli. <strong>A4 belgeler</strong> ve daha fazlası için ideal boyuttadır.</p><p>Hafif ve kullanışlı yapısıyla çocukların kolayca taşıyabileceği şekilde tasarlandı; karne günü için özel bir hediye.</p>",
    contents: "1 adet keçe karne dosyası",
    material: "Keçe",
    flags: { newProduct: true, giftProduct: true },
  },
  {
    slug: "kece-carpim-tablosu",
    name: "Keçe Çarpım Tablosu",
    category: "egitici-aktivite-kitleri",
    type: "Eğitici Kit",
    images: ["carpim.jpeg"],
    short: "1’lerden 10’lara kadar her sütunu ayrı renkte, duvara asılabilen keçe çarpım tablosu.",
    description:
      "<p>1’lerden 10’lara kadar tüm çarpım işlemlerinin yer aldığı bu keçe çarpım tablosunda <strong>her sütun ayrı bir renktedir</strong>; renkler, çocuğun hangi sayının çarpımına baktığını kolayca ayırt etmesine yardımcı olur.</p><p>Üst kenarındaki asma halkalarıyla çocuk odasının ya da çalışma köşesinin duvarına asılabilir.</p>",
    contents: "1 adet keçe çarpım tablosu",
    material: "Keçe",
    flags: { newProduct: true },
  },
  plaster("alci-boyama-seti-tasitlar", "Taşıtlar Alçı Boyama Seti", "p01.png", ["Spor araba", "Yarış arabası", "Formula arabası", "Tren"], "Taşıtlar"),
  plaster("alci-boyama-seti-lezzetler", "Lezzetler Alçı Boyama Seti", "p02.png", ["Donut", "Bardak tatlı", "Pizza dilimi", "Kruvasan"], "Lezzetler"),
  plaster("alci-boyama-seti-tatlilar", "Tatlılar Alçı Boyama Seti", "p03.png", ["Cupcake", "Güllü cupcake", "Dondurma külahı", "Top dondurma", "Makaron"], "Tatlılar"),
  plaster("alci-boyama-seti-prensesler", "Prensesler Alçı Boyama Seti", "p04.png", ["Prenses", "Prenses", "Prenses"], "Prensesler"),
  plaster("alci-boyama-seti-uzay", "Uzay Alçı Boyama Seti", "p05.png", ["Gezegen", "Roket", "Astronot"], "Uzay"),
  plaster("alci-boyama-seti-masal-prensesleri", "Masal Prensesleri Alçı Boyama Seti", "p06.png", ["Prenses", "Prenses", "Prenses"], "Masal prensesleri"),
  plaster("alci-boyama-seti-deniz-canlilari", "Deniz Canlıları Alçı Boyama Seti", "p08.png", ["Yunus", "Denizatı", "Balık"], "Deniz canlıları"),
  plaster("alci-boyama-seti-doga-dostlari", "Doğa Dostları Alçı Boyama Seti", "p09.png", ["Balık", "Uğur böceği", "Kelebek"], "Doğa dostları"),
  plaster("alci-boyama-seti-donutlar", "Donutlar Alçı Boyama Seti", "p10.png", ["Donut", "Donut", "Donut"], "Donut"),
  plaster("alci-boyama-seti-cicekli-donutlar", "Çiçekli Donutlar Alçı Boyama Seti", "p11.png", ["Çiçek donut", "Donut", "Donut"], "Çiçekli donut"),
  plaster("alci-boyama-seti-sevimli-dostlar", "Sevimli Dostlar Alçı Boyama Seti", "p12.png", ["Fil", "Zencefilli kurabiye adam", "Tavşan"], "Sevimli dostlar"),
  plaster("alci-boyama-seti-yilbasi", "Yılbaşı Alçı Boyama Seti", "p13.png", ["Yılbaşı çorabı", "Donut", "Çan"], "Yılbaşı"),
  plaster("alci-boyama-seti-meyveler", "Meyveler Alçı Boyama Seti", "p14.png", ["Karpuz dilimi", "Portakal dilimi", "Ananas", "Yaprak", "Çilek"], "Meyveler"),
  wooden("ahsap-boyama-seti-unicorn-gokkusagi", "Unicorn ve Gökkuşağı Ahşap Boyama Seti", "p15.png", ["Çiçek", "Unicorn", "Gökkuşağı"], "Unicorn ve gökkuşağı"),
  wooden("ahsap-boyama-seti-safari", "Safari Hayvanları Ahşap Boyama Seti", "p16.png", ["Aslan", "Fil", "Kaplan"], "Safari hayvanları"),
  wooden("ahsap-boyama-seti-orman", "Orman Dostları Ahşap Boyama Seti", "p17.png", ["Tilki", "Zebra", "Maymun"], "Orman dostları"),
];

/** Kaynağı en fazla 1400 px uzun kenara küçültüp WebP olarak uploads/products altına yazar. */
async function storeImage(file: string, key: string) {
  const buf = await sharp(path.join(SRC, file)).rotate().resize(1400, 1400, { fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
  const meta = await sharp(buf).metadata();
  const full = path.join(UPLOAD_ROOT, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, buf);
  return { url: `/uploads/${key}`, key, size: buf.length, width: meta.width!, height: meta.height! };
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  const { products, productImages, categories, media } = schema;

  const registerMedia = async (img: Awaited<ReturnType<typeof storeImage>>, alt: string) =>
    db
      .insert(media)
      .values({ url: img.url, storageKey: img.key, filename: path.basename(img.key), originalName: path.basename(img.key), mimeType: "image/webp", size: img.size, width: img.width, height: img.height, alt })
      .onConflictDoNothing();

  for (const c of NEW_CATEGORIES) {
    const exists = await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, c.slug)).limit(1);
    if (exists.length) continue;
    const img = await storeImage(c.image, `categories/${c.slug}.webp`);
    await registerMedia(img, c.imageAlt);
    await db.insert(categories).values({ name: c.name, slug: c.slug, accent: c.accent, sortOrder: c.sortOrder, description: c.description, image: img.url, imageAlt: c.imageAlt });
    console.log(`+ kategori ${c.name}`);
  }

  // Mevcut kategorilere gerçek fotoğraf (yalnızca görseli boşsa)
  const catImages: Record<string, [string, string]> = {
    "ahsap-boyama-setleri": ["p16.png", "Ahşap safari hayvanları boyama seti: aslan, fil ve kaplan figürleri"],
    "egitici-aktivite-kitleri": ["carpim.jpeg", "Renkli sütunlu keçe çarpım tablosu"],
  };
  for (const [slug, [file, alt]] of Object.entries(catImages)) {
    const [row] = await db.select({ id: categories.id, image: categories.image }).from(categories).where(eq(categories.slug, slug)).limit(1);
    if (!row || row.image) continue;
    const img = await storeImage(file, `categories/${slug}.webp`);
    await registerMedia(img, alt);
    await db.update(categories).set({ image: img.url, imageAlt: alt }).where(eq(categories.id, row.id));
    console.log(`~ kategori görseli ${slug}`);
  }

  const cats = await db.select({ id: categories.id, slug: categories.slug, name: categories.name }).from(categories);
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));

  let order = 100;
  for (const it of ITEMS) {
    order++;
    const exists = await db.select({ id: products.id }).from(products).where(eq(products.slug, it.slug)).limit(1);
    if (exists.length) continue;
    const cat = catBySlug.get(it.category) ?? null;
    const [p] = await db
      .insert(products)
      .values({
        name: it.name,
        slug: it.slug,
        shortDescription: it.short,
        description: it.description,
        price: 0,
        stock: 0,
        trackStock: true,
        status: "draft",
        newProduct: it.flags?.newProduct ?? false,
        giftProduct: it.flags?.giftProduct ?? false,
        featured: it.flags?.featured ?? false,
        categoryId: cat?.id ?? null,
        productType: it.type,
        ageMin: it.ageMin ?? null,
        material: it.material ?? null,
        contents: it.contents ?? null,
        usageInformation: it.usage ?? null,
        safetyInformation: it.safety ?? null,
        sortOrder: order,
        searchText: buildSearchText({ name: it.name, productType: it.type, shortDescription: it.short }, cat?.name),
      })
      .returning({ id: products.id });

    let n = 0;
    for (const file of it.images) {
      n++;
      const img = await storeImage(file, `products/${it.slug}-${n}.webp`);
      const alt = n === 1 ? it.name : `${it.name} – ürün bilgi görseli`;
      await registerMedia(img, alt);
      await db.insert(productImages).values({ productId: p!.id, imageUrl: img.url, alt, title: it.name, width: img.width, height: img.height, sortOrder: n, isPrimary: n === 1 });
    }
    console.log(`+ ${it.name} (${it.images.length} görsel)`);
  }
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
