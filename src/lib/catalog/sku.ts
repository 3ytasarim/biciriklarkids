import { and, eq, like } from "drizzle-orm";
import { categories, products } from "@/lib/db/schema";
import type { db as Db } from "@/lib/db";

/**
 * Otomatik ürün kodu (SKU): BK-<GRUP>-<SIRA>, ör. BK-CNT-001.
 * Grup kodu ürünün kategorisinden gelir; sıra o grupta kullanılan en büyük numaranın bir fazlasıdır.
 * Admin'de SKU boş bırakılan ürüne kayıtta atanır; elle girilen SKU'ya dokunulmaz.
 */
export const SKU_PREFIX = "BK";

/** Kategori slug'ı → 3 harfli grup kodu. Listede olmayan kategori slug'ından türetilir. */
export const CATEGORY_SKU_CODES: Record<string, string> = {
  "kece-canta-dikis-kitleri": "CNT",
  "kece-oyuncak-dikis-kitleri": "OYN",
  "egitim-dikis-setleri": "EGT",
  "punch-orgu-setleri": "PNC",
  "ahsap-boyama-setleri": "AHS",
  "egitici-aktivite-kitleri": "AKT",
  "kendin-yap-setleri": "DIY",
  "alci-boyama-setleri": "ALC",
  "kece-cocuk-seccadeleri": "SCD",
  "kece-karne-dosyalari": "KRN",
};

export function skuGroupCode(categorySlug: string | null | undefined): string {
  if (!categorySlug) return "GNL";
  const known = CATEGORY_SKU_CODES[categorySlug];
  if (known) return known;
  // Bilinmeyen kategori: slug kelimelerinin baş harfleri (en az 3 harf)
  const letters = categorySlug
    .split("-")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  return (letters + "XXX").slice(0, 3);
}

export const formatSku = (group: string, n: number) => `${SKU_PREFIX}-${group}-${String(n).padStart(3, "0")}`;

type Tx = Pick<typeof Db, "select">;

/** Kategorideki bir sonraki boş SKU. */
export async function nextSku(tx: Tx, categoryId: string | null | undefined): Promise<string> {
  const [cat] = categoryId ? await tx.select({ slug: categories.slug }).from(categories).where(eq(categories.id, categoryId)).limit(1) : [];
  const group = skuGroupCode(cat?.slug);
  const prefix = `${SKU_PREFIX}-${group}-`;
  const rows = await tx.select({ sku: products.sku }).from(products).where(and(like(products.sku, `${prefix}%`)));
  const max = rows.reduce((m, r) => Math.max(m, Number(r.sku?.slice(prefix.length)) || 0), 0);
  return formatSku(group, max + 1);
}
