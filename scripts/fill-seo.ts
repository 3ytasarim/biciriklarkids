import "./env";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/lib/db/schema";

/**
 * Ürün ve kategorilerin BOŞ SEO alanlarını ürünün kendi verisinden doldurur (elle girilmiş değerlere dokunmaz):
 * SEO başlığı, meta açıklama, anahtar kelimeler, paylaşım (OG) başlığı/açıklaması ve Google ürün kategorisi.
 * Canonical URL bilerek boş bırakılır: boşken her sayfa kendi adresini canonical verir (alan adı değişse de doğru kalır).
 * Kullanım: npx tsx scripts/fill-seo.ts [--dry]
 */
const dry = process.argv.includes("--dry");

/** Google ürün kategorisi (resmî taksonomi ID; tr-TR listesinden doğrulandı). */
const GPC: Record<string, string> = {
  "kece-canta-dikis-kitleri": "7096", // Sanat ve El İşi Setleri > Dikiş Setleri
  "egitim-dikis-setleri": "7096",
  "punch-orgu-setleri": "7096",
  "kece-oyuncak-dikis-kitleri": "4986", // Sanat ve El İşi Setleri > Oyuncak El İşi Kitleri
  "ahsap-boyama-setleri": "4778", // Sanat ve El İşi Setleri > Çizim ve Boyama Setleri
  "alci-boyama-setleri": "4778",
  "egitici-aktivite-kitleri": "1262", // Oyuncaklar > Eğitici Oyuncaklar
  "kendin-yap-setleri": "505370", // Sanatlar ve El İşleri > Sanat ve El İşi Setleri
  "kece-cocuk-seccadeleri": "598", // Ev ve Bahçe > Dekor > Halılar
  "kece-karne-dosyalari": "6884", // Ofis > Dosyalar ve Rapor Kapakları
};

/** Kategoriye göre başlık eki ve anahtar kelimeler (iddia içermeyen, aranan ifadeler). */
const CAT: Record<string, { suffix: string; keys: string[] }> = {
  "kece-canta-dikis-kitleri": { suffix: "Çocuklar İçin", keys: ["keçe çanta dikiş kiti", "çocuk dikiş seti", "keçe çanta yapımı", "kendin yap çanta"] },
  "kece-oyuncak-dikis-kitleri": { suffix: "Çocuk Dikiş Kiti", keys: ["keçe oyuncak dikiş kiti", "elyaf dolgulu keçe oyuncak", "çocuk dikiş seti", "keçe figür"] },
  "egitim-dikis-setleri": { suffix: "Atölye ve Sınıf İçin", keys: ["eğitim dikiş seti", "keçe dikiş seti toplu", "anaokulu etkinlik", "çocuk dikiş kiti"] },
  "punch-orgu-setleri": { suffix: "Çocuklar İçin", keys: ["punch nakış seti", "punch örgü seti", "çocuk punch", "keçe punch"] },
  "ahsap-boyama-setleri": { suffix: "Çocuk Etkinliği", keys: ["ahşap boyama seti", "çocuk boyama etkinliği", "ahşap figür boyama", "kendin boya"] },
  "alci-boyama-setleri": { suffix: "Çocuk Etkinliği", keys: ["taş boyama seti", "çocuk boyama etkinliği", "taş figür boyama", "kendin boya"] },
  "egitici-aktivite-kitleri": { suffix: "Eğitici Keçe Set", keys: ["eğitici keçe set", "okul öncesi etkinlik", "çocuk eğitici oyuncak", "keçe eğitim materyali"] },
  "kendin-yap-setleri": { suffix: "Kendin Yap Kiti", keys: ["kendin yap kiti", "çocuk el işi", "diy kit", "keçe etkinlik"] },
  "kece-cocuk-seccadeleri": { suffix: "Çocuklar İçin", keys: ["çocuk seccadesi", "keçe seccade", "çocuk namaz seti"] },
  "kece-karne-dosyalari": { suffix: "Karne Hediyesi", keys: ["keçe karne dosyası", "karne hediyesi", "karne kılıfı", "çocuk karne dosyası"] },
};

const clean = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
/** Cümle sınırında kısalt (en fazla max karakter). */
function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("; "));
  if (end > max * 0.55) return cut.slice(0, end + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:–-]$/, "") + "…";
}

function title(name: string, cat: string | null): string {
  const suffix = cat ? CAT[cat]?.suffix : null;
  const t = suffix && !/çocuk/i.test(name) && name.length + suffix.length + 3 <= 60 && !name.toLocaleLowerCase("tr").includes(suffix.toLocaleLowerCase("tr")) ? `${name} – ${suffix}` : name;
  return t.length <= 60 ? t : clip(name, 60);
}

function description(name: string, short: string | null, cat: string | null, catName: string | null): string {
  const base = clean(short || "") || `${name}.`;
  const tail = cat === "kece-cocuk-seccadeleri" || cat === "kece-karne-dosyalari" ? "Bıcırıklar Kids'te güvenli ödeme." : `${catName ?? "Ürün"} — Bıcırıklar Kids'te güvenli ödeme.`;
  let d = base.endsWith(".") || base.endsWith("!") ? base : `${base}.`;
  if (d.length + tail.length + 1 <= 158) d = `${d} ${tail}`;
  else if (d.length < 120 && d.length + 33 <= 158) d = `${d} Bıcırıklar Kids'te güvenli ödeme.`;
  return clip(d, 158);
}

function keywords(name: string, cat: string | null, type: string | null, ageMin: number | null, gift: boolean): string {
  const fig = name.match(/^(.+?) Figürlü/)?.[1];
  const ks = [
    name.toLocaleLowerCase("tr"),
    ...(cat ? (CAT[cat]?.keys ?? []) : []),
    fig ? `${fig.toLocaleLowerCase("tr")} figürlü keçe` : null,
    type ? type.toLocaleLowerCase("tr") : null,
    ageMin ? `${ageMin} yaş etkinlik` : null,
    gift ? "çocuk hediye" : null,
    /kur.?an/i.test(name) ? "çocuk kuran çantası" : null,
    "bıcırıklar kids",
  ].filter(Boolean) as string[];
  return [...new Set(ks)].join(", ").slice(0, 300);
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL, max: 1 });
  const db = drizzle(pool, { schema, casing: "snake_case" });
  const { products, categories } = schema;

  const cats = await db.select().from(categories);
  const catById = new Map(cats.map((c) => [c.id, c]));
  const rows = await db.select().from(products);
  let n = 0;
  for (const p of rows) {
    const c = p.categoryId ? catById.get(p.categoryId) : undefined;
    const patch: Partial<typeof products.$inferInsert> = {};
    if (!p.seoTitle) patch.seoTitle = title(p.name, c?.slug ?? null);
    if (!p.seoDescription) patch.seoDescription = description(p.name, p.shortDescription, c?.slug ?? null, c?.name ?? null);
    if (!p.seoKeywords) patch.seoKeywords = keywords(p.name, c?.slug ?? null, p.productType, p.ageMin, p.giftProduct);
    if (!p.ogTitle) patch.ogTitle = p.name.slice(0, 160);
    if (!p.ogDescription) patch.ogDescription = clip(clean(p.shortDescription || p.name), 200);
    if (!p.googleProductCategory && c && GPC[c.slug]) patch.googleProductCategory = GPC[c.slug];
    if (!Object.keys(patch).length) continue;
    n++;
    if (dry && n <= 12) console.log(`\n${p.name}\n  başlık (${(patch.seoTitle ?? p.seoTitle ?? "").length}): ${patch.seoTitle ?? "(var)"}\n  açıklama (${(patch.seoDescription ?? "").length}): ${patch.seoDescription ?? "(var)"}\n  anahtar: ${patch.seoKeywords ?? "(var)"}\n  GPC: ${patch.googleProductCategory ?? p.googleProductCategory ?? "-"}`);
    if (!dry) await db.update(products).set(patch).where(eq(products.id, p.id));
  }

  // Kategoriler: boş başlık/açıklama/anahtar
  let m = 0;
  for (const c of cats) {
    const meta = CAT[c.slug];
    const patch: Partial<typeof categories.$inferInsert> = {};
    if (!c.seoTitle) patch.seoTitle = clip(`${c.name} – Çocuklar İçin Etkinlik Setleri`, 60);
    if (!c.seoDescription) patch.seoDescription = clip(`${clean(c.description || "") || `${c.name}: çocukların kendi elleriyle üretebileceği setler.`} Bıcırıklar Kids'te güvenli ödeme.`, 158);
    if (!c.seoKeywords && meta) patch.seoKeywords = [...meta.keys, "bıcırıklar kids"].join(", ");
    if (!Object.keys(patch).length) continue;
    m++;
    if (dry) console.log(`\n[kategori] ${c.name}: ${patch.seoTitle ?? "(var)"} | ${patch.seoDescription ?? "(var)"}`);
    if (!dry) await db.update(categories).set(patch).where(eq(categories.id, c.id));
  }
  console.log(`\n${dry ? "(deneme) " : ""}${n} ürün, ${m} kategori ${dry ? "güncellenecek" : "güncellendi"}.`);
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
