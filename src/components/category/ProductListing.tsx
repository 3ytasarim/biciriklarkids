import Link from "next/link";
import { Suspense } from "react";
import { ChevronLeft, ChevronRight, PackageOpen, X } from "lucide-react";
import { getFacetValues, listProducts } from "@/lib/catalog/queries";
import { listingHref, PAGE_SIZE, type ParsedListing, type RawParams } from "@/lib/catalog/listing-params";
import { AGE_GROUPS, type ListingFilters, type ProductCardData } from "@/lib/catalog/types";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { FilterPanel, SortSelect, type FacetData } from "./FilterPanel";

/**
 * Liste sayfası iskeleti (kategori, tüm ürünler, koleksiyonlar, arama). Filtreleme/sıralama/sayfalama
 * sunucuda (URL parametreleri) yapılır; ilk HTML'de ürünler hazır gelir.
 */
export async function ProductListing({
  title,
  eyebrow,
  description,
  basePath,
  crumbs,
  baseFilters,
  parsed,
  searchParams,
  categoryFacets,
  listId,
  header,
  children,
}: {
  title: string;
  eyebrow?: string | null;
  description?: string | null;
  basePath: string;
  crumbs: Crumb[];
  baseFilters: ListingFilters;
  parsed: ParsedListing;
  searchParams: RawParams;
  categoryFacets?: { slug: string; name: string; count: number; ids: string[] }[];
  listId: string;
  header?: React.ReactNode;
  children?: React.ReactNode;
}) {
  // Kategori filtresi (yalnızca /urunler'de): seçilen kategori(ler)in alt ağaçları
  const selectedCatIds = categoryFacets?.filter((c) => parsed.categorySlugs.includes(c.slug)).flatMap((c) => c.ids);
  const filters: ListingFilters = { ...baseFilters, ...parsed.filters, ...(selectedCatIds?.length ? { categoryIds: selectedCatIds } : {}) };
  const [{ items, total }, facetValues] = await Promise.all([
    listProducts({ filters, sort: parsed.sort, limit: PAGE_SIZE, offset: (parsed.page - 1) * PAGE_SIZE }),
    getFacetValues(baseFilters.categoryIds),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const facets: FacetData = { ...facetValues, categories: categoryFacets?.map(({ slug, name, count }) => ({ slug, name, count })) };
  const chips = activeChips(parsed, categoryFacets);

  return (
    <div className="shell pt-4 pb-16 sm:pt-6">
      <Breadcrumbs items={crumbs} className="mb-6" />
      {header ?? (
        <header className="max-w-3xl">
          {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
          <h1 className="display-2">{title}</h1>
          {description ? <p className="lead mt-4">{description}</p> : null}
        </header>
      )}

      <div className="mt-10 grid gap-10 lg:grid-cols-[250px_1fr] xl:grid-cols-[270px_1fr] xl:gap-14">
        <aside aria-label="Filtreler" className="hidden lg:block">
          <div className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto pr-2 pb-6 no-scrollbar">
            <Suspense>
              <FilterPanel facets={facets} total={total} mode="desktop" />
            </Suspense>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <p className="text-sm font-bold text-ink-soft" aria-live="polite">
              {total} ürün
            </p>
            <div className="flex items-center gap-2">
              <div className="lg:hidden">
                <Suspense>
                  <FilterPanel facets={facets} total={total} mode="mobile" />
                </Suspense>
              </div>
              <Suspense>
                <SortSelect />
              </Suspense>
            </div>
          </div>

          {chips.length ? (
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="Uygulanan filtreler">
              {chips.map((c) => (
                <li key={c.label}>
                  <Link href={listingHref(basePath, searchParams, c.patch)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-ink px-3.5 text-sm font-bold text-white hover:bg-brand-ink" aria-label={`${c.label} filtresini kaldır`}>
                    {c.label} <X aria-hidden="true" className="h-3.5 w-3.5" />
                  </Link>
                </li>
              ))}
              <li>
                <Link href={basePath} className="inline-flex min-h-9 items-center px-2 text-sm font-bold text-ink-soft underline underline-offset-4 hover:text-ink">
                  Tümünü temizle
                </Link>
              </li>
            </ul>
          ) : null}

          {items.length ? (
            <>
              <h2 className="sr-only">Ürünler</h2>
              <ProductGrid products={items as ProductCardData[]} listId={listId} listName={title} priorityCount={4} className="mt-8" />
              {pages > 1 ? <Pagination page={parsed.page} pages={pages} hrefFor={(n) => listingHref(basePath, searchParams, { sayfa: n > 1 ? String(n) : null })} /> : null}
            </>
          ) : (
            <div className="mt-10 flex flex-col items-center rounded-lg bg-cream px-6 py-16 text-center">
              <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-brand-ink shadow-soft">
                <PackageOpen className="h-8 w-8" />
              </span>
              <p className="mt-5 font-display text-2xl font-extrabold">{parsed.hasFilters ? "Bu filtrelere uygun ürün bulunamadı" : "Bu bölümde henüz ürün yok"}</p>
              <p className="mt-2 max-w-md text-ink-soft">{parsed.hasFilters ? "Filtrelerden birkaçını kaldırmayı deneyin." : "Yeni ürünler çok yakında. Bu arada diğer kategorilere göz atabilirsiniz."}</p>
              <Link href={parsed.hasFilters ? basePath : "/urunler"} className="btn-dark mt-6">
                {parsed.hasFilters ? "Filtreleri temizle" : "Tüm ürünler"}
              </Link>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (n: number) => string }) {
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);
  return (
    <nav aria-label="Sayfalama" className="mt-14 flex items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} rel="prev" className="icon-btn border-[1.5px] border-line-strong" aria-label="Önceki sayfa">
          <ChevronLeft aria-hidden="true" className="h-5 w-5" />
        </Link>
      ) : null}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1]! > 1 ? <span aria-hidden="true" className="px-1 text-muted">…</span> : null}
          <Link href={hrefFor(n)} aria-current={n === page ? "page" : undefined} className={`flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-sm font-extrabold ${n === page ? "bg-ink text-white" : "hover:bg-cream"}`}>
            {n}
          </Link>
        </span>
      ))}
      {page < pages ? (
        <Link href={hrefFor(page + 1)} rel="next" className="icon-btn border-[1.5px] border-line-strong" aria-label="Sonraki sayfa">
          <ChevronRight aria-hidden="true" className="h-5 w-5" />
        </Link>
      ) : null}
    </nav>
  );
}

function activeChips(p: ParsedListing, cats?: { slug: string; name: string }[]): { label: string; patch: Record<string, string | null> }[] {
  const out: { label: string; patch: Record<string, string | null> }[] = [];
  const without = (arr: string[], v: string) => arr.filter((x) => x !== v).join(",") || null;
  for (const s of p.raw.kategori) out.push({ label: cats?.find((c) => c.slug === s)?.name ?? s, patch: { kategori: without(p.raw.kategori, s) } });
  for (const a of p.raw.yas) out.push({ label: AGE_GROUPS.find((g) => g.value === a)?.label ?? a, patch: { yas: without(p.raw.yas, a) } });
  for (const t of p.raw.tur) out.push({ label: t, patch: { tur: without(p.raw.tur, t) } });
  if (p.raw.min != null) out.push({ label: `En az ₺${p.raw.min}`, patch: { "fiyat-min": null } });
  if (p.raw.max != null) out.push({ label: `En çok ₺${p.raw.max}`, patch: { "fiyat-max": null } });
  if (p.raw.stok) out.push({ label: "Stoktakiler", patch: { stok: null } });
  if (p.raw.yeni) out.push({ label: "Yeni", patch: { yeni: null } });
  if (p.raw.indirim) out.push({ label: "İndirimli", patch: { indirim: null } });
  return out;
}
