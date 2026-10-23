import { AGE_GROUPS, SORT_OPTIONS, type ListingFilters, type SortKey } from "./types";

export type RawParams = Record<string, string | string[] | undefined>;
export const PAGE_SIZE = 24;

const list = (v: string | string[] | undefined): string[] =>
  (Array.isArray(v) ? v : v ? v.split(",") : [])
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20);
const num = (v: string | string[] | undefined): number | null => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const flag = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) === "1";

export type ParsedListing = {
  filters: ListingFilters;
  categorySlugs: string[];
  sort: SortKey;
  page: number;
  /** URL'de herhangi bir filtre/sıralama var mı (→ noindex, canonical temel sayfa). */
  hasFilters: boolean;
  raw: { yas: string[]; tur: string[]; kategori: string[]; min: number | null; max: number | null; stok: boolean; yeni: boolean; indirim: boolean; siralama: SortKey };
};

/** URL parametreleri (Türkçe, okunur) → sorgu filtreleri. Geçersiz değerler sessizce yok sayılır. */
export function parseListingParams(sp: RawParams): ParsedListing {
  const sortRaw = (Array.isArray(sp.siralama) ? sp.siralama[0] : sp.siralama) as SortKey | undefined;
  const sort: SortKey = SORT_OPTIONS.some((o) => o.value === sortRaw) ? sortRaw! : "onerilen";
  const yas = list(sp.yas).filter((v) => AGE_GROUPS.some((g) => g.value === v));
  const tur = list(sp.tur);
  const kategori = list(sp.kategori).filter((s) => /^[a-z0-9-]+$/.test(s));
  const min = num(sp["fiyat-min"]);
  const max = num(sp["fiyat-max"]);
  const stok = flag(sp.stok);
  const yeni = flag(sp.yeni);
  const indirim = flag(sp.indirim);
  const pageN = Math.floor(num(sp.sayfa) ?? 1);
  const page = pageN >= 1 && pageN <= 500 ? pageN : 1;

  return {
    filters: { ages: yas, types: tur, minPrice: min, maxPrice: max, inStock: stok, isNew: yeni, onSale: indirim },
    categorySlugs: kategori,
    sort,
    page,
    hasFilters: Boolean(yas.length || tur.length || kategori.length || min != null || max != null || stok || yeni || indirim || sort !== "onerilen"),
    raw: { yas, tur, kategori, min, max, stok, yeni, indirim, siralama: sort },
  };
}

/** Mevcut parametrelerle yeni URL üretir (sayfalama, filtre kaldırma). */
export function listingHref(basePath: string, sp: RawParams, patch: Record<string, string | null>): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v == null) continue;
    params.set(k, Array.isArray(v) ? v.join(",") : v);
  }
  for (const [k, v] of Object.entries(patch)) {
    if (v == null || v === "") params.delete(k);
    else params.set(k, v);
  }
  if (!("sayfa" in patch)) params.delete("sayfa");
  const s = params.toString();
  return s ? `${basePath}?${s}` : basePath;
}
