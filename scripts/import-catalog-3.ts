import "./env";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import sharp from "sharp";
import * as schema from "../src/lib/db/schema";
import { buildSearchText } from "../src/lib/catalog/search-text";
import { slugify } from "../src/lib/slug";
import { collage, normalizeShot, plainWebp } from "./lib/product-shot";

/**
 * Katalog içe aktarma (3. parti): önceki sitede satışta olan, yeni katalogda henüz bulunmayan 11 ürün.
 * - Fiyat, içerik ve ölçüler önceki sitedeki ürün sayfalarından alınmıştır.
 * - Slug, eski ürün adresinden türetilir → /product-page/<eski-slug> istekleri lib/legacy.ts ile 301'lenir.
 * - Stok adedi bilinmediği için trackStock=false (admin'den stok girilince açılmalı).
 * Kullanım: npx tsx scripts/import-catalog-3.ts <kaynak-klasör>
 */
const SRC = process.argv[2];
if (!SRC) throw new Error("Kaynak klasör verilmedi.");
const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR ?? path.join(process.cwd(), "storage", "uploads"));

/** file: açık zeminliyse stüdyo, değilse olduğu gibi | collage: stüdyo kolaj | portrait: 4:5'e kırp (anchor 0=üst … 1=alt) */
type Img = { file: string } | { collage: string[]; cols: number } | { portrait: string; anchor?: number; box?: [number, number, number, number] };
type Item = {
  legacy: string;
  name: string;
  category: string;
  type: string;
  images: Img[];
  short: string;
  description: string;
  contents: string;
  material: string;
  ageMin?: number;
  price: number;
  compareAt: number;
  flags?: Partial<Record<"giftProduct" | "featured" | "newProduct", boolean>>;
};

const f = (file: string): Img => ({ file });
const KIT_SAFETY = "Plastik iğne çocuklar için güvenlidir. Küçük parçalar içerdiğinden 3 yaş altındaki çocuklardan uzak tutun; küçük yaşlarda bir yetişkin eşliğinde yapılması önerilir.";
const PAINT_USAGE = "Figürleri gazete serilmiş bir masaya yerleştirin, fırçayla istediğiniz renklere boyayın ve boyanın kurumasını bekleyin.";

const ITEMS: Item[] = [
  {
    legacy: "4-lü-keçe-puch-örgü-set-i",
    name: "4’lü Keçe Punch Örgü Seti",
    category: "punch-orgu-setleri",
    type: "Punch Seti",
    images: [{ collage: ["src2/punch/01.jpg", "src2/punch/02.jpg", "src2/punch/08.jpg", "src2/punch/04.jpg"], cols: 2 }, f("old/img/p01-1.jpg"), f("src2/punch/09.jpg"), f("src2/punch/14.jpg")],
    short: "4 farklı punch tasarımı: panda, ayı, civciv ve pati. Peluş örgü ipiyle kabarık dokulu tablolar.",
    description:
      "<p>Keçe tablaya açılmış deliklerden peluş örgü ipini geçirerek kabarık, yumuşak dokulu tablolar ortaya çıkar. Sette <strong>panda, ayı, civciv ve pati</strong> olmak üzere 4 tasarım bulunur.</p><p>Desen noktalarla işaretlidir; çocuk noktaları takip ederek ilerler. Bitmiş tablolar oda süsü olarak kullanılabilir.</p>",
    contents: "4 adet 3 mm keçe punch tablası (panda, ayı, civciv, pati)\nKeçe aksesuarlar\nHer tasarım için 5 metre peluş örgü ipi\nPlastik zararsız iğne",
    material: "Keçe, peluş örgü ipi",
    price: 400,
    compareAt: 600,
    flags: { giftProduct: true },
  },
  {
    legacy: "4-lü-ahşap-unicorn-boyama-set-i",
    name: "4’lü Ahşap Unicorn Boyama Seti",
    category: "ahsap-boyama-setleri",
    type: "Boyama Seti",
    images: [f("old/img/p02-3.jpg"), f("old/img/p02-2.jpg"), f("old/img/p02-1.jpg")],
    short: "Unicorn, çiçek, gökkuşağı ve deniz kızı kuyruğu: 4 ahşap figür, 6 renk akrilik boya ve fırça.",
    description:
      "<p>Çizgileri işlenmiş <strong>4 ahşap figür</strong> (unicorn, çiçek, gökkuşağı, deniz kızı kuyruğu), 6 farklı renk akrilik boya ve bir boyama fırçasından oluşan set.</p><p>İşlenmiş çizgiler boyamayı kolaylaştırır; boyanan figürler süs ya da oyuncak olarak kullanılabilir.</p>",
    contents: "4 adet ahşap figür (unicorn, çiçek, gökkuşağı, deniz kızı kuyruğu)\n6 farklı renk akrilik boya seti\n1 adet boyama fırçası",
    material: "Ahşap figürler, akrilik boya, fırça",
    price: 139.99,
    compareAt: 220,
  },
  {
    legacy: "6-li-ahşap-hayvan-boyama-set-i",
    name: "6’lı Ahşap Orman Hayvanları Boyama Seti",
    category: "ahsap-boyama-setleri",
    type: "Boyama Seti",
    images: [f("old/img/p03-3.jpg"), f("old/img/p03-2.jpg"), f("old/img/p03-1.jpg")],
    short: "6 ahşap hayvan figürü, 6 renk boya ve fırça: rengarenk orman hayvanları boyama seti.",
    description:
      "<p>Çizgileri işlenmiş <strong>6 ahşap hayvan figürü</strong>, 6 farklı renk boya ve bir fırçadan oluşan boyama seti. Çocuk her hayvanı dilediği renge boyar.</p><p>Boyanan figürler süs, oyuncak ya da hikâye anlatma kartı olarak kullanılabilir.</p>",
    contents: "6 adet ahşap hayvan figürü\n6 farklı renk boya\n1 adet fırça",
    material: "Ahşap figürler, boya, fırça",
    price: 195,
    compareAt: 250,
  },
  {
    legacy: "10-lu-türk-bayraği-keçe-eği̇ti̇ci̇-ki̇t",
    name: "10’lu Türk Bayrağı Elyaf Dolgulu Eğitici Keçe Kiti",
    category: "egitici-aktivite-kitleri",
    type: "Eğitici Kit",
    images: [{ portrait: "old/img/p04-1.jpg", box: [88, 450, 1024, 1280] }, f("old/img/p04-2.jpg")],
    short: "10 adet elyaf dolgulu keçe Türk bayrağı dikiş kiti: sınıf etkinlikleri ve milli bayramlar için.",
    description:
      "<p>Her kitte delikli keçe bayrak parçaları, elyaf dolgu, ip ve plastik iğne bulunur; çocuk bayrağı diker ve içini elyafla doldurur. Paket <strong>10 kit</strong> içerir; sınıf etkinlikleri ve milli bayram hazırlıkları için uygundur.</p><p>Ana malzeme 3 mm, aksesuarlar 1 mm birinci kalite keçedir; dikiş delikleri 3 mm çapındadır, iğne ve ip rahatça geçer.</p>",
    contents: "10 adet keçe Türk bayrağı dikiş kiti\nHer kitte: delikli keçe parçalar, boncuk elyaf dolgu, ip, plastik iğne",
    material: "Keçe (3 mm ana malzeme, 1 mm aksesuar), boncuk elyaf",
    ageMin: 3,
    price: 749.99,
    compareAt: 800,
  },
  {
    legacy: "keçe-kendi-gece-lambanı-kendin-yap-etiğici-kit",
    name: "Keçe Gece Lambası Kendin Yap Kiti",
    category: "kendin-yap-setleri",
    type: "DIY Kiti",
    images: [{ portrait: "old/img/p05-6.jpg", anchor: 0.35 }, f("old/img/p05-1.jpg"), f("old/img/p05-2.jpg"), { portrait: "old/img/p05-4.jpg", anchor: 0.4 }, { portrait: "old/img/p05-5.jpg", anchor: 0.4 }],
    short: "Bulut şeklinde keçe gece lambası: çocuk diker, elyafla doldurur, LED ışıkla yakar. Pil dahil.",
    description:
      "<p>Bulut şeklindeki keçe gövdeyi çocuk kendi diker, yunus, yengeç ve deniz yıldızı süslerini yerleştirir, içini elyafla doldurur. Gövdenin içine yerleştirilen <strong>1,5 metrelik LED ışık</strong> pille çalışır (pil dahildir) ve bulutu yumuşak bir gece lambasına dönüştürür.</p><p>Çocuk odasında duvara ya da beşiğin üstüne asılabilir; motor becerileri, el-göz koordinasyonunu ve yaratıcılığı destekleyen bir etkinlik.</p>",
    contents: "1 mm keçe ana gövde\n1 mm keçe aksesuarlar\nBoncuk elyaf\nPlastik zararsız iğne\nİplik\n1,5 metre LED ışık (pil ile çalışır, pil dahil)",
    material: "Keçe, boncuk elyaf, LED ışık",
    ageMin: 3,
    price: 400,
    compareAt: 525,
    flags: { giftProduct: true, featured: true },
  },
  {
    legacy: "4-lü-keçe-kara-hayvanlari-fi̇gürlü-elyaf-dolgulu-oyuncak-ki̇t-leri̇",
    name: "4’lü Keçe Kara Hayvanları Figürlü Elyaf Dolgulu Oyuncak Kitleri",
    category: "kece-oyuncak-dikis-kitleri",
    type: "Oyuncak Kiti",
    images: [{ collage: ["src2/kara/02.jpg", "src2/kara/01.jpg", "src2/kara/04.jpg", "src2/kara/07.jpg"], cols: 2 }, f("old/img/p06-1.jpg"), f("old/img/p06-2.jpg")],
    short: "4 kara hayvanı figürü bir arada: inek, zürafa, maymun ve panda. 3 yaş ve üzeri.",
    description:
      "<p>Dört sevimli kara hayvanı tek sette: <strong>inek, zürafa, maymun ve panda</strong>. Her figür delikli keçe parçalar, yüz süslemeleri ve elyaf dolguyla gelir; çocuk diker, doldurur ve kendi oyuncaklarını oluşturur.</p><p>Ana malzeme 3 mm, aksesuarlar 1 mm birinci kalite keçedir; dikiş delikleri 3 mm çapındadır, iğne ve ip rahatça geçer.</p>",
    contents: "4 figür için delikli keçe parçalar (inek, zürafa, maymun, panda)\nKeçe yüz süslemeleri\nBoncuk elyaf dolgu\nPlastik güvenli iğne\nİp",
    material: "Keçe (3 mm ana malzeme, 1 mm aksesuar), boncuk elyaf",
    ageMin: 3,
    price: 400,
    compareAt: 600,
    flags: { giftProduct: true },
  },
  {
    legacy: "4-lü-keçe-deni̇z-hayvanlari-fi̇gürlü-elyaf-dolgulu-oyuncak-ki̇t-leri̇",
    name: "4’lü Keçe Deniz Hayvanları Figürlü Elyaf Dolgulu Oyuncak Kitleri",
    category: "kece-oyuncak-dikis-kitleri",
    type: "Oyuncak Kiti",
    images: [{ collage: ["src2/deniz/04.jpg", "src2/deniz/01.jpg", "kapak/yengec.webp", "src2/deniz/06.jpg"], cols: 2 }, f("old/img/p07-1.jpg"), f("old/img/p07-2.jpg")],
    short: "4 deniz canlısı figürü bir arada: balık, deniz yıldızı, yengeç ve kaplumbağa. 3 yaş ve üzeri.",
    description:
      "<p>Dört deniz canlısı tek sette: <strong>balık, deniz yıldızı, yengeç ve kaplumbağa</strong>. Her figür delikli keçe parçalar, yüz süslemeleri ve elyaf dolguyla gelir; çocuk diker, doldurur ve kendi deniz koleksiyonunu oluşturur.</p><p>Ana malzeme 3 mm, aksesuarlar 1 mm birinci kalite keçedir; dikiş delikleri 3 mm çapındadır.</p>",
    contents: "4 figür için delikli keçe parçalar (balık, deniz yıldızı, yengeç, kaplumbağa)\nKeçe yüz süslemeleri\nBoncuk elyaf dolgu\nPlastik güvenli iğne\nİp",
    material: "Keçe (3 mm ana malzeme, 1 mm aksesuar), boncuk elyaf",
    ageMin: 3,
    price: 400,
    compareAt: 600,
    flags: { giftProduct: true },
  },
  {
    legacy: "haftanın-günleri",
    name: "Haftanın Günleri Keçe Eğitim Seti",
    category: "egitici-aktivite-kitleri",
    type: "Eğitici Kit",
    images: [{ portrait: "old/img/p08-2.jpg", anchor: 0.5 }, f("old/img/p08-1.jpg")],
    short: "Duvara asılan keçe haftanın günleri panosu: dün, bugün ve yarın kartlarıyla günleri öğrenmek eğlenceli. 98 × 41,5 cm.",
    description:
      "<p>Pazartesiden pazara haftanın günlerinin yazılı olduğu keçe pano; çocuk <strong>dün, bugün ve yarın</strong> kartlarını her sabah doğru güne taşır. Günleri ve sırasını oyunla öğrenmenin kolay bir yolu.</p><p>Çocuk odasına, sınıfa ya da anaokulu panosuna asılabilir. Ölçüler: 98 cm boy, 41,5 cm en.</p>",
    contents: "1 adet keçe haftanın günleri panosu (98 × 41,5 cm)\nDün / bugün / yarın kartları",
    material: "Keçe",
    price: 950,
    compareAt: 1250,
  },
  {
    legacy: "i̇ngilizce-haftanın-günleri",
    name: "İngilizce Haftanın Günleri Keçe Eğitim Seti",
    category: "egitici-aktivite-kitleri",
    type: "Eğitici Kit",
    images: [{ portrait: "old/img/p09-2.jpg", anchor: 0.5 }, f("old/img/p09-1.jpg")],
    short: "Days of the week: İngilizce haftanın günleri keçe panosu, yesterday / today / tomorrow kartlarıyla. 98 × 41,5 cm.",
    description:
      "<p>Monday'den Sunday'e İngilizce haftanın günlerinin yazılı olduğu keçe pano; çocuk <strong>yesterday, today ve tomorrow</strong> kartlarını her gün doğru yere taşır. İngilizce gün adlarını ve zaman kavramını oyunla pekiştirir.</p><p>Çocuk odasına, sınıfa ya da anaokulu panosuna asılabilir. Ölçüler: 98 cm boy, 41,5 cm en.</p>",
    contents: "1 adet İngilizce keçe haftanın günleri panosu (98 × 41,5 cm)\nYesterday / today / tomorrow kartları",
    material: "Keçe",
    price: 950,
    compareAt: 1250,
  },
  {
    legacy: "3-lü-keçe-eğitim-dikiş-set-i",
    name: "3’lü Keçe Çanta Eğitim Dikiş Seti",
    category: "egitim-dikis-setleri",
    type: "Eğitim Seti",
    images: [{ collage: ["src2/canta/02.jpg", "src2/canta/03.jpg", "src2/canta/08.jpg"], cols: 2 }, f("old/img/p10-1.jpg"), f("old/img/p10-2.jpg")],
    short: "3 figürlü keçe çanta kiti bir arada: araba, fil ve çiçek. Dikişe adım adım alışmak için.",
    description:
      "<p>Üç farklı keçe çanta kiti tek sette: <strong>araba, fil ve çiçek</strong>. Çocuk her çantayı kendi diker; her yeni çanta dikiş becerisini bir adım ileri taşır.</p><p>Her kit 3 mm keçe çanta parçaları, 1 mm keçe aksesuarlar, plastik güvenli iğne ve iplikle gelir.</p>",
    contents: "3 çanta kiti (araba, fil, çiçek)\nHer kitte: 3 mm keçe çanta parçaları, 1 mm keçe aksesuarlar, plastik güvenli iğne, iplik",
    material: "Keçe (3 mm ana malzeme, 1 mm aksesuar)",
    ageMin: 3,
    price: 450,
    compareAt: 600,
    flags: { giftProduct: true },
  },
  {
    legacy: "6-lı-keçe-çanta-eğitim-dikiş-set-i",
    name: "6’lı Keçe Çanta Eğitim Dikiş Seti",
    category: "egitim-dikis-setleri",
    type: "Eğitim Seti",
    images: [{ collage: ["src2/canta/02.jpg", "kapak/roket.webp", "src2/canta/14.jpg", "src2/canta/05.jpg", "src2/canta/03.jpg", "src2/canta/08.jpg"], cols: 3 }, f("old/img/p11-1.png"), f("old/img/p11-2.png")],
    short: "6 figürlü keçe çanta kiti bir arada: araba, roket, köpek, avokado, fil ve çiçek.",
    description:
      "<p>Altı farklı keçe çanta kiti tek sette: <strong>araba, roket, köpek, avokado, fil ve çiçek</strong>. Atölyeler, sınıf etkinlikleri ve kardeşler için ideal; her çocuk kendi çantasını diker.</p><p>Her kit 3 mm keçe çanta parçaları, 1 mm keçe aksesuarlar, plastik güvenli iğne ve iplikle gelir.</p>",
    contents: "6 çanta kiti (araba, roket, köpek, avokado, fil, çiçek)\nHer kitte: 3 mm keçe çanta parçaları, 1 mm keçe aksesuarlar, plastik güvenli iğne, iplik",
    material: "Keçe (3 mm ana malzeme, 1 mm aksesuar)",
    ageMin: 3,
    price: 900,
    compareAt: 1200,
    flags: { giftProduct: true },
  },
];

/** Kaynak dosyayı uzantıdan bağımsız bulur (.jpg/.jpeg/.png/.webp). */
async function load(rel: string): Promise<Buffer> {
  const base = path.join(SRC, rel).replace(/\.(jpe?g|png|webp)$/i, "");
  for (const ext of [path.extname(rel), ".jpg", ".jpeg", ".png", ".webp"]) {
    const buf = await readFile(base + ext).catch(() => null);
    if (buf) return buf;
  }
  throw new Error(`Kaynak görsel bulunamadı: ${rel}`);
}

async function render(img: Img): Promise<Buffer> {
  if ("file" in img) {
    const buf = await load(img.file);
    return (await normalizeShot(buf)) ?? plainWebp(buf);
  }
  if ("collage" in img) return collage(await Promise.all(img.collage.map((x) => load(x))), img.cols);
  // 4:5 dikey kırpım (yaşam tarzı fotoğrafları, afişler)
  const src = sharp(await load(img.portrait)).rotate();
  if (img.box) {
    const [left, top, width, height] = img.box;
    return src.extract({ left, top, width, height }).resize(1200, 1500, { fit: "cover" }).webp({ quality: 84 }).toBuffer();
  }
  const { width = 0, height = 0 } = await src.metadata();
  const target = 4 / 5;
  let w = width, h = height, left = 0, top = 0;
  if (width / height > target) {
    w = Math.round(height * target);
    left = Math.round((width - w) / 2);
  } else {
    h = Math.round(width / target);
    top = Math.round((height - h) * (img.anchor ?? 0.5));
  }
  return src.extract({ left, top, width: w, height: h }).resize(1200, 1500, { fit: "cover" }).webp({ quality: 84 }).toBuffer();
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  const { products, productImages, categories, media } = schema;
  const cats = new Map((await db.select({ id: categories.id, slug: categories.slug, name: categories.name }).from(categories)).map((c) => [c.slug, c]));

  let order = 300;
  for (const it of ITEMS) {
    order++;
    const slug = slugify(it.legacy.normalize("NFC"));
    const [found] = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).limit(1);
    if (found) {
      console.log(`= atlandı (var): ${slug}`);
      continue;
    }
    const cat = cats.get(it.category) ?? null;
    if (!cat) throw new Error(`Kategori yok: ${it.category}`);
    const [p] = await db
      .insert(products)
      .values({
        name: it.name,
        slug,
        shortDescription: it.short,
        description: it.description,
        price: it.price,
        compareAtPrice: it.compareAt,
        stock: 0,
        trackStock: false,
        status: "active",
        publishedAt: new Date(),
        giftProduct: it.flags?.giftProduct ?? false,
        featured: it.flags?.featured ?? false,
        newProduct: it.flags?.newProduct ?? false,
        categoryId: cat.id,
        productType: it.type,
        ageMin: it.ageMin ?? null,
        material: it.material,
        contents: it.contents,
        safetyInformation: it.type === "Boyama Seti" ? null : KIT_SAFETY,
        usageInformation: it.type === "Boyama Seti" ? PAINT_USAGE : null,
        sortOrder: order,
        searchText: buildSearchText({ name: it.name, productType: it.type, shortDescription: it.short }, cat.name),
      })
      .returning({ id: products.id });

    let n = 0;
    for (const img of it.images) {
      n++;
      const buf = await render(img);
      const key = `products/${slug}-${n}.webp`;
      const full = path.join(UPLOAD_ROOT, key);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, buf);
      const m = await sharp(buf).metadata();
      const url = `/uploads/${key}`;
      const alt = n === 1 ? it.name : `${it.name} – görsel ${n}`;
      await db
        .insert(media)
        .values({ url, storageKey: key, filename: path.basename(key), originalName: path.basename(key), mimeType: "image/webp", size: buf.length, width: m.width!, height: m.height!, alt })
        .onConflictDoNothing();
      await db.insert(productImages).values({ productId: p!.id, imageUrl: url, alt, title: it.name, width: m.width!, height: m.height!, sortOrder: n, isPrimary: n === 1 });
    }
    console.log(`+ ${it.name} (${it.images.length} görsel) → /urun/${slug}`);
  }
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
