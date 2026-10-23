import "./env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { and, eq, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import sharp from "sharp";
import * as schema from "../src/lib/db/schema";
import { buildSearchText } from "../src/lib/catalog/search-text";
import { slugify } from "../src/lib/slug";
import { collage, normalizeShot, plainWebp } from "./lib/product-shot";

/**
 * Katalog içe aktarma (2. parti): çantalar, elyaf dolgulu kara/deniz oyuncakları, punch kitleri, Kur'an çantaları.
 * - Fiyatlar eski siteden (biciriklar.com.tr) alınan GERÇEK fiyatlardır; fiyatı bilinmeyen ürün taslak kalır.
 * - Slug, eski Wix ürün adından türetilir → /product-page/<eski-slug> istekleri lib/legacy.ts ile 301'lenir.
 * - Stok adedi bilinmediği için trackStock=false (admin'den stok girilince açılmalı).
 * - Ayrıca: storage/uploads/products altındaki tüm açık zeminli görselleri stüdyo formatına normalleştirir.
 * Kullanım: npx tsx scripts/import-catalog-2.ts <kaynak-klasör (canta/kara/deniz/punch/kuran alt klasörleri)>
 */
const SRC = process.argv[2];
if (!SRC) throw new Error("Kaynak klasör verilmedi.");
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "storage", "uploads"));

type Img = { file: string } | { collage: string[]; cols: number } | { crop: string; box: [number, number, number, number] };
type Item = {
  name: string;
  /** Eski sitedeki ad/slug kaynağı (yönlendirme eşleşmesi için). */
  legacy?: string;
  category: string;
  type: string;
  images: Img[];
  short: string;
  description: string;
  contents: string;
  ageMin?: number;
  price?: number;
  compareAt?: number;
  flags?: Partial<Record<"bestseller" | "newProduct" | "giftProduct" | "featured", boolean>>;
};

const f = (file: string): Img => ({ file });

// ── İçerik şablonları (yalnızca fotoğraflarda/afişlerde ve eski sitede yazan bilgiler) ──
const BAG_CONTENTS = "3 mm keçe çanta parçaları\n1 mm keçe aksesuarlar\nPlastik güvenli iğne\nİplik";
const TOY_CONTENTS = "Delikli keçe figür parçaları (ön ve arka yüz)\nKeçe yüz süslemeleri\nElyaf dolgu\nPlastik güvenli iğne\nİplik";
const PUNCH_CONTENTS_ONE = "3 mm keçe punch tablası\nKeçe aksesuarlar\n5 metre peluş örgü ipi\nPlastik zararsız iğne";

function bag(fig: string, legacyName: string, finished: string | null, kit: string | null, extra: string[] = []): Item {
  const imgs = [finished, kit, ...extra].filter(Boolean).map((x) => f(x!));
  return {
    name: legacyName,
    category: "kece-canta-dikis-kitleri",
    type: "Dikiş Kiti",
    images: imgs,
    short: `${fig} figürlü keçe çantayı çocuk kendi diker: hazır delikli keçe parçalar, plastik güvenli iğne ve iplik kutuda.`,
    description: `<p>Bu kitle çocuk, ön yüzünde <strong>${fig.toLocaleLowerCase("tr-TR")}</strong> figürü olan keçe çantasını kendi elleriyle diker. Parçalar dikiş delikleri açılmış olarak gelir; figür ön yüze dikilir, ardından kenarlar ve sap birleştirilir.</p><p>Çanta parçaları 3 mm, aksesuar parçaları 1 mm kalınlığında keçeden hazırlanır. Tamamlanan çanta günlük kullanıma uygundur.</p>`,
    contents: BAG_CONTENTS,
    price: 200,
    compareAt: 250,
    flags: { giftProduct: true },
  };
}

function toy(fig: string, group: "kara" | "deniz", finished: string, kit: string, primaryKit = false): Item {
  const name = `${fig} Figürlü Elyaf Dolgu Keçe Oyuncak Dikiş Kiti`;
  return {
    name,
    category: "kece-oyuncak-dikis-kitleri",
    type: "Oyuncak Kiti",
    images: primaryKit ? [f(`${group}/${kit}`), f(`${group}/${finished}`)] : [f(`${group}/${finished}`), f(`${group}/${kit}`)],
    short: `${fig} figürlü keçe oyuncağı çocuk kendi diker ve elyafla doldurur. 3 yaş ve üzeri.`,
    description: `<p>Delikli keçe parçalar üst üste getirilip kenarları dikilir, içi elyafla doldurulur ve açıklık kapatılır: ortaya çocuğun kendi yaptığı yumuşak bir <strong>${fig.toLocaleLowerCase("tr-TR")}</strong> oyuncak çıkar.</p><p>Yüz detayları keçe süslemelerle hazır gelir. İnce motor becerilerini ve el-göz koordinasyonunu çalıştıran, ekrandan uzak bir üretim etkinliği.</p>`,
    contents: TOY_CONTENTS,
    ageMin: 3,
    price: 200,
    compareAt: 250,
  };
}

const KARA: [string, string, string][] = [
  ["Zürafa", "01.jpg", "11.jpg"],
  ["İnek", "02.jpg", "13.jpg"],
  ["Tavşan", "03.jpg", "12.jpg"],
  ["Maymun", "04.jpg", "14.jpg"],
  ["Kurbağa", "05.jpg", "15.jpg"],
  ["Kedi", "06.jpg", "16.jpg"],
  ["Panda", "07.jpg", "10.jpg"],
  ["Fil", "08.jpg", "09.jpg"],
];
const DENIZ: [string, string, string][] = [
  ["Deniz Yıldızı", "01.jpg", "13.jpg"],
  ["Yunus", "02.jpg", "11.jpg"],
  ["Denizanası", "03.jpg", "16.jpg"],
  ["Balık", "04.jpg", "09.jpg"],
  ["İstiridye", "05.jpg", "14.jpg"],
  ["Kaplumbağa", "06.jpg", "12.jpg"],
  ["Yengeç", "07.jpg", "10.jpg"], // bitmiş fotoğraf gri fonlu → kapak kit görseli
  ["Denizatı", "08.jpg", "15.jpg"],
];
const PUNCH_FINISHED = ["01", "02", "03", "04", "05", "06", "07", "08"].map((n) => `punch/${n}.jpg`);
const BAG_FINISHED = ["02", "03", "04", "05", "06", "07", "08", "10", "14"].map((n) => `canta/${n}.jpg`);

const ITEMS: Item[] = [
  bag("Araba", "Araba Figürlü Keçe Çanta Dikiş Kiti", "canta/02.jpg", "canta/15.jpg"),
  bag("Fil", "Fil Figürlü Keçe Çanta Dikiş Kiti", "canta/03.jpg", "canta/13.jpg", ["canta/01.jpg"]),
  bag("Kedi", "Kedi Figürlü Keçe Çanta Dikiş Kiti", "canta/04.jpg", "canta/20.jpg", ["canta/01.jpg"]),
  bag("Avokado", "Avokado Figürlü Keçe Çanta Dikiş Kiti", "canta/05.jpg", "canta/18.jpg", ["canta/01.jpg"]),
  bag("Ayı", "Ayı Figürlü Keçe Çanta Dikiş Kiti", "canta/06.jpg", "canta/21.jpg", ["canta/01.jpg"]),
  bag("Pati", "Pati Figürlü Keçe Çanta Dikiş Kiti", "canta/07.jpg", "canta/19.jpg"),
  bag("Çiçek", "Çiçek Desenli Keçe Çanta Dikiş Kiti", "canta/08.jpg", "canta/17.jpg"),
  bag("Donat", "Donat Figürlü Keçe Çanta Dikiş Kiti", "canta/10.jpg", "canta/16.jpg", ["canta/01.jpg"]),
  bag("Roket", "Roket Figürlü Keçe Çanta Dikiş Kiti", null, "canta/11.jpg"),
  bag("Köpek", "Köpek Figürlü Keçe Çanta Dikiş Kiti", "canta/14.jpg", "canta/12.jpg"),
  ...KARA.map(([n, a, b]) => toy(n, "kara", a, b)),
  ...DENIZ.map(([n, a, b]) => toy(n, "deniz", a, b, n === "Yengeç")),
  {
    name: "8’li Keçe Kara Hayvanları Figürlü Elyaf Dolgulu Oyuncak Kit’leri",
    legacy: "8-li-keçe-kara-hayvanları-figürlü-elyaf-dolgulu-oyuncak-kit-leri",
    category: "kece-oyuncak-dikis-kitleri",
    type: "Oyuncak Kiti",
    images: [{ collage: KARA.map(([, a]) => `kara/${a}`), cols: 3 }, f("kara/11.jpg"), f("kara/10.jpg")],
    short: "8 kara hayvanı figürü bir arada: zürafa, inek, tavşan, maymun, kurbağa, kedi, panda ve fil. 3 yaş ve üzeri.",
    description:
      "<p>Kara hayvanları serisinin tamamı tek sette: <strong>zürafa, inek, tavşan, maymun, kurbağa, kedi, panda ve fil</strong>. Her figür delikli keçe parçalar, yüz süslemeleri ve elyaf dolguyla gelir; çocuk diker, doldurur ve kendi oyuncak koleksiyonunu oluşturur.</p><p>Kardeşler ya da arkadaşlarla birlikte yapılabilecek, uzun süre keyifle uğraşılacak bir hediye seti.</p>",
    contents: "8 figür için delikli keçe parçalar (zürafa, inek, tavşan, maymun, kurbağa, kedi, panda, fil)\nKeçe yüz süslemeleri\nElyaf dolgu\nPlastik güvenli iğne\nİplik",
    ageMin: 3,
    price: 800,
    compareAt: 1200,
    flags: { giftProduct: true, featured: true },
  },
  {
    name: "8’li Keçe Deniz Hayvanları Figürlü Elyaf Dolgulu Oyuncak Kit’leri",
    legacy: "8-li-keçe-deniz-hayvanları-figürlü-elyaf-dolgulu-oyuncak-kit-leri",
    category: "kece-oyuncak-dikis-kitleri",
    type: "Oyuncak Kiti",
    images: [{ collage: DENIZ.filter(([n]) => n !== "Yengeç").map(([, a]) => `deniz/${a}`).concat("deniz/10.jpg"), cols: 3 }, f("deniz/13.jpg"), f("deniz/12.jpg")],
    short: "8 deniz canlısı figürü bir arada: deniz yıldızı, yunus, denizanası, balık, istiridye, kaplumbağa, yengeç ve denizatı.",
    description:
      "<p>Deniz hayvanları serisinin tamamı tek sette: <strong>deniz yıldızı, yunus, denizanası, balık, istiridye, kaplumbağa, yengeç ve denizatı</strong>. Her figür delikli keçe parçalar, yüz süslemeleri ve elyaf dolguyla gelir.</p><p>Dikip doldurdukça büyüyen bir deniz koleksiyonu; hediye için ideal.</p>",
    contents: "8 figür için delikli keçe parçalar (deniz yıldızı, yunus, denizanası, balık, istiridye, kaplumbağa, yengeç, denizatı)\nKeçe yüz süslemeleri\nElyaf dolgu\nPlastik güvenli iğne\nİplik",
    ageMin: 3,
    price: 800,
    compareAt: 1200,
    flags: { giftProduct: true, featured: true },
  },
  {
    name: "8’li Keçe Punch Örgü Seti",
    legacy: "8-li̇-keçe-punch-örgü-seti̇",
    category: "punch-orgu-setleri",
    type: "Punch Seti",
    images: [{ collage: PUNCH_FINISHED, cols: 3 }, f("punch/09.jpg"), f("punch/11.jpg"), f("punch/12.jpg"), f("punch/14.jpg")],
    short: "8 farklı punch tasarımı: panda, ayı, kedi, pati, tavşan, avokado, kurbağa ve civciv. Her tasarım için 5 metre peluş ip.",
    description:
      "<p>Keçe tablaya açılmış deliklerden peluş örgü ipini geçirerek kabarık, yumuşak dokulu tablolar ortaya çıkar. Sette <strong>panda, ayı, kedi, pati, tavşan, avokado, kurbağa ve civciv</strong> olmak üzere 8 tasarım bulunur.</p><p>Desen noktalarla işaretlidir; çocuk noktaları takip ederek ilerler. Bitmiş tablolar oda süsü olarak kullanılabilir.</p>",
    contents: "8 adet 3 mm keçe punch tablası (panda, ayı, kedi, pati, tavşan, avokado, kurbağa, civciv)\nKeçe aksesuarlar\nHer tasarım için 5 metre peluş örgü ipi\nPlastik zararsız iğne",
    price: 700,
    compareAt: 800,
    flags: { giftProduct: true, featured: true },
  },
  {
    name: "10’lu Keçe Çanta Eğitim Dikiş Seti",
    legacy: "10-lu-keçe-çanta-eğitim-dikiş-set-i",
    category: "egitim-dikis-setleri",
    type: "Eğitim Seti",
    images: [{ collage: BAG_FINISHED, cols: 3 }, f("canta/01.jpg"), f("canta/11.jpg")],
    short: "10 farklı figürlü keçe çanta kiti bir arada: araba, fil, kedi, avokado, ayı, pati, çiçek, donat, roket ve köpek.",
    description:
      "<p>Keçe çanta serisinin tamamı tek sette: <strong>araba, fil, kedi, avokado, ayı, pati, çiçek, donat, roket ve köpek</strong>. Atölyeler, sınıf etkinlikleri ve kardeşler için ideal eğitim seti.</p><p>Her kit 3 mm keçe çanta parçaları, 1 mm keçe aksesuarlar, plastik güvenli iğne ve iplikle gelir.</p>",
    contents: "10 çanta kiti (araba, fil, kedi, avokado, ayı, pati, çiçek, donat, roket, köpek)\nHer kitte: 3 mm keçe çanta parçaları, 1 mm keçe aksesuarlar, plastik güvenli iğne, iplik",
    price: 1500,
    compareAt: 2000,
    flags: { giftProduct: true },
  },
  // Kur'an çantaları — fiyat bilinmiyor → taslak
  {
    name: "Kız Çocukları İçin Keçe Kur’an Çantası – Pembe",
    category: "kece-cocuk-seccadeleri",
    type: "Kur’an Çantası",
    images: [{ crop: "kuran/02.jpg", box: [520, 240, 545, 700] }, f("kuran/02.jpg")],
    short: "Kur’an kursları için tasarlanan, “Huzur Kur’anda” yazılı pembe keçe çanta. Hafif ve taşımaya uygun.",
    description:
      "<p>Kur’an kursları için özel olarak tasarlanan bu keçe çanta, üzerindeki <strong>“Huzur Kur’anda”</strong> yazısıyla kız çocuklarına özel. Kur’an-ı Kerim için ideal boyuttadır.</p><p>Hafif yapısıyla kolay taşınır; dikişli, sağlam ve şık bir tasarım. Toplu alımlar için uygundur.</p>",
    contents: "1 adet keçe Kur’an çantası",
    flags: { giftProduct: true, newProduct: true },
  },
  {
    name: "Erkek Çocukları İçin Keçe Kur’an Çantası – Lacivert",
    category: "kece-cocuk-seccadeleri",
    type: "Kur’an Çantası",
    images: [{ crop: "kuran/03.jpg", box: [520, 250, 580, 685] }, f("kuran/03.jpg")],
    short: "Kur’an kursları için tasarlanan, “Huzur Kur’anda” yazılı lacivert keçe çanta. Hafif ve taşımaya uygun.",
    description:
      "<p>Kur’an kursları için özel olarak tasarlanan bu lacivert keçe çanta, üzerindeki <strong>“Huzur Kur’anda”</strong> yazısıyla erkek çocuklarına özel. Kur’an-ı Kerim için ideal boyuttadır.</p><p>Hafif yapısıyla kolay taşınır; dikişli, sağlam ve şık bir tasarım. Toplu alımlar için uygundur.</p>",
    contents: "1 adet keçe Kur’an çantası",
    flags: { giftProduct: true, newProduct: true },
  },
];

async function render(img: Img): Promise<Buffer> {
  if ("file" in img) {
    const buf = await readFile(path.join(SRC, img.file));
    return (await normalizeShot(buf)) ?? plainWebp(buf);
  }
  if ("collage" in img) return collage(await Promise.all(img.collage.map((x) => readFile(path.join(SRC, x)))), img.cols);
  const [left, top, width, height] = img.box;
  return sharp(await readFile(path.join(SRC, img.crop))).extract({ left, top, width, height }).resize(1000).webp({ quality: 86 }).toBuffer();
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  const { products, productImages, categories, media } = schema;

  const save = async (buf: Buffer, key: string, alt: string) => {
    const full = path.join(UPLOAD_ROOT, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, buf);
    const m = await sharp(buf).metadata();
    const url = `/uploads/${key}`;
    await db
      .insert(media)
      .values({ url, storageKey: key, filename: path.basename(key), originalName: path.basename(key), mimeType: "image/webp", size: buf.length, width: m.width!, height: m.height!, alt })
      .onConflictDoUpdate({ target: media.url, set: { size: buf.length, width: m.width!, height: m.height! } });
    return { url, width: m.width!, height: m.height! };
  };

  // 1) Mevcut ürün görsellerini stüdyo formatına getir (açık zeminliler; afişler atlanır)
  const existing = await db.select().from(productImages).where(like(productImages.imageUrl, "/uploads/products/%"));
  let normalized = 0;
  for (const row of existing) {
    const key = row.imageUrl.replace(/^\/uploads\//, "");
    const buf = await readFile(path.join(UPLOAD_ROOT, key)).catch(() => null);
    if (!buf) continue;
    const out = await normalizeShot(buf);
    if (!out) continue;
    const s = await save(out, key, row.alt);
    await db.update(productImages).set({ width: s.width, height: s.height }).where(eq(productImages.id, row.id));
    normalized++;
  }
  console.log(`~ ${normalized} mevcut görsel normalleştirildi`);

  const cats = await db.select({ id: categories.id, slug: categories.slug, name: categories.name, image: categories.image }).from(categories);
  const catBySlug = new Map(cats.map((c) => [c.slug, c]));

  let order = 200;
  const firstImageOf = new Map<string, string>();
  for (const it of ITEMS) {
    order++;
    const slug = slugify((it.legacy ?? it.name).normalize("NFC"));
    const [found] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
    if (found) {
      console.log(`= atlandı (var): ${slug}`);
      continue;
    }
    const cat = catBySlug.get(it.category) ?? null;
    const active = it.price != null;
    const [p] = await db
      .insert(products)
      .values({
        name: it.name,
        slug,
        shortDescription: it.short,
        description: it.description,
        price: it.price ?? 0,
        compareAtPrice: it.compareAt ?? null,
        stock: 0,
        trackStock: false,
        status: active ? "active" : "draft",
        publishedAt: active ? new Date() : null,
        newProduct: it.flags?.newProduct ?? false,
        giftProduct: it.flags?.giftProduct ?? false,
        featured: it.flags?.featured ?? false,
        bestseller: it.flags?.bestseller ?? false,
        categoryId: cat?.id ?? null,
        productType: it.type,
        ageMin: it.ageMin ?? null,
        material: "Keçe",
        contents: it.contents,
        sortOrder: order,
        searchText: buildSearchText({ name: it.name, productType: it.type, shortDescription: it.short }, cat?.name),
      })
      .returning({ id: products.id });

    let n = 0;
    for (const img of it.images) {
      n++;
      const s = await save(await render(img), `products/${slug}-${n}.webp`, n === 1 ? it.name : `${it.name} – görsel ${n}`);
      if (n === 1) firstImageOf.set(it.category, firstImageOf.get(it.category) ?? s.url);
      await db.insert(productImages).values({ productId: p!.id, imageUrl: s.url, alt: n === 1 ? it.name : `${it.name} – görsel ${n}`, title: it.name, width: s.width, height: s.height, sortOrder: n, isPrimary: n === 1 });
    }
    console.log(`+ ${active ? "AKTİF" : "taslak"} ${it.name} (${it.images.length} görsel)`);
  }

  // 2) Görseli olmayan kategorilere set kolajı/ilk ürün görseli
  const catPick: Record<string, string> = {
    "kece-canta-dikis-kitleri": "products/" + slugify("Avokado Figürlü Keçe Çanta Dikiş Kiti") + "-1.webp",
    "kece-oyuncak-dikis-kitleri": "products/" + slugify("8-li-keçe-kara-hayvanları-figürlü-elyaf-dolgulu-oyuncak-kit-leri") + "-1.webp",
    "punch-orgu-setleri": "products/" + slugify("8-li̇-keçe-punch-örgü-seti̇".normalize("NFC")) + "-1.webp",
    "egitim-dikis-setleri": "products/" + slugify("10-lu-keçe-çanta-eğitim-dikiş-set-i") + "-1.webp",
  };
  for (const [slug, key] of Object.entries(catPick)) {
    const c = catBySlug.get(slug);
    if (!c || c.image) continue;
    await db.update(categories).set({ image: `/uploads/${key}`, imageAlt: c.name }).where(and(eq(categories.id, c.id)));
    console.log(`~ kategori görseli ${slug}`);
  }

  // 3) Erkek seccadesi: resmi ürün afişi eklendi (45×85 cm, 3+ yaş bilgisi afişte)
  const [erkek] = await db.select({ id: products.id }).from(products).where(eq(products.slug, "kece-cocuk-seccadesi-mavi")).limit(1);
  if (erkek) {
    const has = await db.select({ id: productImages.id }).from(productImages).where(eq(productImages.imageUrl, "/uploads/products/kece-cocuk-seccadesi-mavi-3.webp")).limit(1);
    if (!has.length) {
      const s = await save(await plainWebp(await readFile(path.join(SRC, "kuran/01.jpg"))), "products/kece-cocuk-seccadesi-mavi-3.webp", "Erkek çocuk seccadesi ürün bilgi görseli");
      await db.insert(productImages).values({ productId: erkek.id, imageUrl: s.url, alt: "Erkek çocuk seccadesi ürün bilgi görseli", width: s.width, height: s.height, sortOrder: 3, isPrimary: false });
    }
    await db
      .update(products)
      .set({ ageMin: 3, contents: "1 adet keçe seccade (45 × 85 cm)", shortDescription: "45 × 85 cm, keçeden, cami ve “Mutluluk Namazda” yazılı mavi çocuk seccadesi. 3 yaş ve üzeri." })
      .where(eq(products.id, erkek.id));
  }

  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
