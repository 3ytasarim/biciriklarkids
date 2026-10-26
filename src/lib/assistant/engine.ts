import "server-only";
import { and, desc, eq, gt, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getProductCards } from "@/lib/catalog/queries";
import { getSiteSettings, type SiteSettings } from "@/lib/settings";
import { activeCarriers } from "@/lib/commerce/carriers";
import { formatPrice } from "@/lib/commerce/money";
import { enabledPaymentMethods } from "@/lib/payments/registry";
import { iyzicoConfig } from "@/lib/payments/iyzico/client";
import { BRAND_FAQ } from "@/lib/content/brand-faq";
import { normalizeSearch } from "@/lib/utils";

/**
 * BıcırıklarBot — kural tabanlı mağaza asistanı. Cevaplar YALNIZCA sitenin gerçek verisinden kurulur
 * (ürünler, fiyatlar, kargo/ödeme ayarları, iade süresi, SSS); bilgi yoksa uydurmaz, ilgili sayfaya yönlendirir.
 */
export type BotProduct = { slug: string; name: string; price: number; compareAtPrice: number | null; image: string | null; category: string | null; age: string | null };
export type BotReply = { text: string; products?: BotProduct[]; links?: { label: string; href: string }[]; quick?: string[] };

const QUICK_DEFAULT = ["Boyama setleri", "Kargo ücreti ne kadar?", "3 yaş için ne önerirsin?", "Hediye önerisi", "Siparişim nerede?"];

/** Sohbet dolgusu: ürün aramasında anlam taşımayan kelimeler (normalize edilmiş). */
const STOP = new Set(
  "ben benim bana bir bu su o ve ile icin gibi cok daha en mi mu mi misiniz var mi yok ne neler nasil hangi kac olan olarak de da ki ama veya ya cocugum cocuguma cocugu cocuk cocuklar cocuklara oglum ogluma kizim kizima yegenim yegenime arkadasim ariyorum aradim istiyorum istiyoruz isterim lazim onerir onerin oner onerisi oneri tavsiye bakiyorum bakmak goster gosterir gosterin bul bulur bulabilir urun urunler urunu setler seti sey seyler alabilir alirim almak almak icin merhaba selam lutfen tesekkurler sizde sizin elinizde neyiniz hangileri tum tumu bana fiyat fiyati fiyatlari kac tl ucret ucreti ne kadar setleri setler kit kiti kitleri takim takimi model modeller cesit cesitleri onerirsin onerir onerebilir onerebilirsin oneriniz alayim almaliyim alsam olur uygun guzel tas yas yasinda yaslarinda yasindaki".split(" "),
);

/** Eş anlamlılar → katalogdaki arama metnine uyan anahtarlar. */
const SYNONYMS: [RegExp, string[]][] = [
  [/boya|resim|renklendir/, ["boyama"]],
  [/dikis|dikmek|ign|iplik/, ["dikis"]],
  [/canta/, ["canta"]],
  [/oyuncak|pelus|figur/, ["oyuncak"]],
  [/punch|orgu|nakis/, ["punch"]],
  [/ahsap|tahta/, ["ahsap"]],
  [/alci/, ["alci"]],
  [/seccade|namaz/, ["seccade"]],
  [/karne/, ["karne"]],
  [/takvim|gunleri|hafta/, ["takvim", "gunleri"]],
  [/egitici|egitim|ogren|okul/, ["egitici", "egitim"]],
  [/unicorn|tek boynuz/, ["unicorn"]],
  [/hayvan/, ["hayvan"]],
  [/deniz/, ["deniz"]],
  [/lamba|gece/, ["lamba"]],
];

/** Genel istekler (ör. "etkinlik") düşük ağırlıklı geniş anahtarlara açılır; açıkça yazılan kelime önce gelir. */
const BROAD: [RegExp, string[]][] = [[/etkinlik|aktivite|kendin yap|diy|el isi|el sanat|oyalan|vakit gecir|sikil/, ["boyama", "egitici", "dikis"]]];

const has = (n: string, re: RegExp) => re.test(n);

async function toBotProducts(ids: string[]): Promise<BotProduct[]> {
  if (!ids.length) return [];
  const cards = await getProductCards({ ids }, "onerilen", ids.length);
  const order = new Map(ids.map((id, i) => [id, i]));
  return cards
    .sort((a, b) => order.get(a.id)! - order.get(b.id)!)
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      price: c.price,
      compareAtPrice: c.compareAtPrice,
      image: c.image?.url ?? null,
      category: c.category?.name ?? null,
      age: c.ageMin != null ? `${c.ageMin}+ yaş` : null,
    }));
}

/** Anahtarlardan herhangi biriyle eşleşen ürünler; daha çok anahtar eşleşen, fiyatlı ve çok satan önce. */
type Key = { k: string; w: number };
async function findProducts(keys: Key[], extra: SQL[] = [], limit = 6): Promise<BotProduct[]> {
  const byKey = new Map<string, number>();
  for (const { k, w } of keys) {
    const c = k.replace(/[%_]/g, "");
    if (c.length >= 3) byKey.set(c, Math.max(byKey.get(c) ?? 0, w));
  }
  const weighted = [...byKey].slice(0, 8);
  const match = weighted.length ? or(...weighted.map(([k]) => ilike(products.searchText, `%${k}%`))) : undefined;
  const score = weighted.length ? sql.join(weighted.map(([k, w]) => sql`(case when ${products.searchText} ilike ${`%${k}%`} then ${w} else 0 end)`), sql` + `) : null;
  const rows = await db
    .select({ id: products.id })
    .from(products)
    .where(and(eq(products.status, "active"), eq(products.isDemo, false), ...(match ? [match] : []), ...extra))
    // Anahtar yoksa puan sıralaması atlanır (sabit "0" PostgreSQL'de sütun numarası sanılır)
    .orderBy(...(score ? [desc(score)] : []), desc(sql`(${products.price} > 0)`), desc(products.bestseller), desc(products.salesCount))
    .limit(limit);
  return toBotProducts(rows.map((r) => r.id));
}

function shippingText(s: SiteSettings): string {
  const carriers = activeCarriers(s.shipping);
  const lines: string[] = [];
  if (carriers.length) {
    lines.push("Ödeme adımında kargo firmanızı seçebilirsiniz:");
    for (const c of carriers) {
      const free = c.freeThreshold ?? s.shipping.freeThreshold;
      lines.push(`• ${c.name}: ${c.fee > 0 ? formatPrice(c.fee) : "ücretsiz"}${free != null && c.fee > 0 ? ` (${formatPrice(free)} ve üzeri ücretsiz)` : ""}`);
    }
  } else if (s.shipping.flatFee != null) {
    lines.push(`Kargo ücreti ${formatPrice(s.shipping.flatFee)}.`);
  } else {
    lines.push("Kargo ücreti sipariş özetinde, adresinize göre gösterilir.");
  }
  if (!carriers.length && s.shipping.freeThreshold != null) lines.push(`${formatPrice(s.shipping.freeThreshold)} ve üzeri alışverişlerde kargo ücretsiz.`);
  if (s.shipping.dispatchTime) lines.push(`Siparişler ${s.shipping.dispatchTime} içinde kargoya verilir.`);
  return lines.join("\n");
}

function faqAnswer(n: string): BotReply | null {
  for (const f of BRAND_FAQ) {
    const q = normalizeSearch(f.question);
    const words = q.split(" ").filter((w) => w.length >= 4 && !STOP.has(w));
    const hits = words.filter((w) => n.includes(w)).length;
    if (words.length && hits >= Math.min(2, words.length)) return { text: f.answer, links: [{ label: "Sık sorulan sorular", href: "/sss" }] };
  }
  return null;
}

export async function answer(message: string): Promise<BotReply> {
  const n = normalizeSearch(message).replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const s = await getSiteSettings();
  if (!n) return { text: "Size nasıl yardımcı olabilirim?", quick: QUICK_DEFAULT };

  // Selamlama / teşekkür
  if (/^(merhaba|selam|selamlar|iyi gunler|gunaydin|hey|mrb|slm)\b/.test(n) && n.split(" ").length <= 3) {
    return { text: `Merhaba! Ben BıcırıklarBot 👋 Ürünler, fiyatlar, kargo ve siparişlerle ilgili sorularınızı yanıtlayabilirim. Örneğin “boyama seti arıyorum” yazabilirsiniz.`, quick: QUICK_DEFAULT };
  }
  if (/^(tesekkur|sagol|sag ol|eyvallah|cok iyi|harika|super)/.test(n)) return { text: "Rica ederim! Başka bir konuda yardımcı olabilirsem buradayım. 😊", quick: QUICK_DEFAULT };

  // Sipariş takibi
  if (has(n, /siparis(im)? (nerede|ne zaman|durum|takip)|kargom|kargo takip|takip no|siparis takip|siparisim/)) {
    return { text: "Siparişinizin durumunu sipariş numaranız ve e-posta adresinizle “Sipariş Takibi” sayfasından görebilirsiniz. Kargoya verildiğinde takip numarası da orada ve e-postanızda yer alır.", links: [{ label: "Sipariş takibi", href: "/siparis-takibi" }] };
  }
  // İade / değişim
  if (has(n, /iade|degisim|degistir|cayma|geri gonder/)) {
    return { text: `Teslimden itibaren ${s.commerce.returnDays} gün içinde cayma hakkınızı kullanabilirsiniz. Süreç ve koşullar İade ve Değişim sayfasında anlatılıyor.`, links: [{ label: "İade politikası", href: "/iade-politikasi" }] };
  }
  // Kargo / teslimat
  if (has(n, /kargo|teslimat|gonderi|kac gunde|ne zaman gelir|ucretsiz kargo/)) {
    return { text: shippingText(s), links: [{ label: "Kargo ve teslimat", href: "/kargo-ve-teslimat" }] };
  }
  // Ödeme / taksit
  if (has(n, /odeme|taksit|kredi kart|banka kart|havale|eft|kapida/)) {
    const methods = enabledPaymentMethods(s).filter((m) => m.id !== "dev_test");
    const inst = iyzicoConfig(s)?.installments.filter((x) => x > 1) ?? [];
    const lines = [methods.length ? `Ödeme yöntemleri: ${methods.map((m) => m.label).join(", ")}.` : "Ödeme yöntemleri ödeme adımında listelenir."];
    if (inst.length) lines.push(`Kartla ödemede ${inst.join(", ")} taksit seçenekleri ödeme ekranında gösterilir (bankanıza göre değişebilir).`);
    if (has(n, /kapida/)) lines.push("Kapıda ödeme seçeneğimiz bulunmuyor.");
    lines.push("Kart bilgileriniz sitemizde saklanmaz; ödeme iyzico güvencesiyle alınır.");
    return { text: lines.join("\n") };
  }
  // İletişim
  if (has(n, /iletisim|telefon|numara|whatsapp|mail|e posta|eposta|adres|ulas|musteri hizmet/)) {
    const c = s.contact;
    const lines = [c.phone && `Telefon: ${c.phone}`, c.whatsapp && `WhatsApp: ${c.whatsapp}`, c.email && `E-posta: ${c.email}`, c.workingHours && `Çalışma saatleri: ${c.workingHours}`].filter(Boolean) as string[];
    return { text: lines.length ? lines.join("\n") : "İletişim sayfamızdan bize yazabilirsiniz.", links: [{ label: "İletişim", href: "/iletisim" }] };
  }

  // Yaş: "3 yas", "5 yasinda"
  const age = n.match(/(\d{1,2}) ?(yas|yasinda|yasindaki|yaslarinda)/);
  // Ürün anahtarları
  // Ağırlık: eş anlamlı eşleşme 3, yazılan diğer kelime 2, genel istek ("etkinlik") açılımı 1
  const keyList: Key[] = [];
  for (const [re, ks] of SYNONYMS) if (re.test(n)) ks.forEach((k) => keyList.push({ k, w: 3 }));
  for (const [re, ks] of BROAD) if (re.test(n)) ks.forEach((k) => keyList.push({ k, w: 1 }));
  for (const w of n.split(" ")) if (w.length >= 3 && !STOP.has(w) && !/^\d+$/.test(w) && !BROAD.some(([re]) => re.test(w))) keyList.push({ k: w, w: 2 });
  const keys = new Set(keyList.map((x) => x.k));
  const wantsGift = has(n, /hediye|dogum gunu|yilbasi|bayram|karne hediye|sevindir/);
  const wantsPrice = has(n, /fiyat|kac tl|kac lira|ne kadar|ucret|ucuz|pahali/);
  const wantsSale = has(n, /indirim|kampanya|firsat/);

  const extra: SQL[] = [];
  if (age) {
    const a = Number(age[1]);
    extra.push(sql`(${products.ageMin} is null or ${products.ageMin} <= ${a})`, sql`(${products.ageMax} is null or ${products.ageMax} >= ${a})`);
  }
  if (wantsGift) extra.push(eq(products.giftProduct, true));
  if (wantsSale) extra.push(sql`${products.compareAtPrice} > ${products.price}`, gt(products.price, 0));

  // Belirli bir kelime yoksa: yaş/hediye/indirim için çok satanlar
  // Sıra: tüm anahtarlar+filtre → yalnız bilinen (eş anlamlı/genel) anahtarlar+filtre → yalnız filtre → filtresiz anahtarlar.
  // Böylece bilinmeyen bir kelime ("önerirsin" vb.) aramayı boşa düşürmez.
  const known = keyList.filter((x) => x.w !== 2);
  let list = keyList.length ? await findProducts(keyList, extra) : [];
  if (!list.length && known.length) list = await findProducts(known, extra);
  if (!list.length && extra.length) list = await findProducts([], extra);
  if (!list.length && keyList.length && extra.length) list = await findProducts(keyList);

  if (list.length) {
    const asked = [...keys].join(" ");
    const missingTas = has(n, /\btas\b/) && list.every((p) => !normalizeSearch(p.name).includes("tas "));
    const intro = missingTas
      ? "Taş boyama setimiz şu an yok, ama çocuğunuzun seveceği boyama setlerimiz var:"
      : age
        ? `${age[1]} yaş için önerebileceğim ürünler:`
        : wantsGift
          ? "Hediye için güzel seçenekler:"
          : wantsSale
            ? "İndirimdeki ürünlerimiz:"
            : wantsPrice
              ? "Fiyatlarıyla birlikte ilgili ürünler:"
              : `${asked ? "İşte bulduklarım" : "Önerilerim"}:`;
    const unpriced = list.some((p) => p.price <= 0);
    return {
      text: intro + (unpriced ? "\n(“Fiyat yakında” yazan ürünler henüz satışta değil.)" : ""),
      products: list,
      links: [{ label: "Tüm ürünler", href: "/urunler" }],
    };
  }

  const faq = faqAnswer(n);
  if (faq) return faq;

  return {
    text: "Bunu tam anlayamadım ya da bununla ilgili bir ürünümüz yok. 🙈 Ürün adı veya “boyama”, “çanta”, “oyuncak”, “3 yaş” gibi bir şey yazabilirsiniz. Dilerseniz bize doğrudan da ulaşabilirsiniz.",
    links: [
      { label: "Tüm ürünler", href: "/urunler" },
      { label: "İletişim", href: "/iletisim" },
    ],
    quick: QUICK_DEFAULT,
  };
}

export const ASSISTANT_QUICK = QUICK_DEFAULT;
