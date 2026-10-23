import { normalizeSearch } from "@/lib/utils";

/** Ürünün arama metni: ad + SKU + barkod + kategori + tür + anahtar kelimeler (normalize). Admin kayıtta güncellenir. */
export function buildSearchText(
  p: { name: string; sku?: string | null; barcode?: string | null; productType?: string | null; seoKeywords?: string | null; shortDescription?: string | null },
  categoryName?: string | null,
): string {
  return normalizeSearch([p.name, p.sku, p.barcode, categoryName, p.productType, p.seoKeywords, p.shortDescription].filter(Boolean).join(" ")).slice(0, 2000);
}
