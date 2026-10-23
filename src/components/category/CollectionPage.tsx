import type { Metadata } from "next";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { STATIC_PAGES, type StaticPageKey } from "@/lib/seo/static-pages";
import { parseListingParams, type RawParams } from "@/lib/catalog/listing-params";
import { descendantIds, getCategoryTree } from "@/lib/catalog/queries";
import type { ListingFilters } from "@/lib/catalog/types";
import { breadcrumbSchema, graph } from "@/lib/schema/json-ld";
import { JsonLd } from "@/components/seo/JsonLd";
import { ProductListing } from "./ProductListing";

/** Koleksiyon sayfaları (tüm ürünler, çok satanlar, yeni, hediyelik, indirimli) için ortak metadata + sayfa. */
export async function collectionMetadata(key: StaticPageKey, searchParams: Promise<RawParams>): Promise<Metadata> {
  const parsed = parseListingParams(await searchParams);
  // Filtreli/sıralı/sayfalı varyasyonlar indekslenmez; canonical her zaman temel sayfa.
  return buildStaticPageMetadata(key, parsed.hasFilters || parsed.page > 1 ? { index: false } : undefined);
}

export async function CollectionPage({
  pageKey,
  title,
  eyebrow,
  description,
  baseFilters,
  searchParams,
  withCategoryFilter = true,
}: {
  pageKey: StaticPageKey;
  title: string;
  eyebrow?: string;
  description: string;
  baseFilters: ListingFilters;
  searchParams: RawParams;
  withCategoryFilter?: boolean;
}) {
  const parsed = parseListingParams(searchParams);
  const path = STATIC_PAGES[pageKey].path;
  const tree = withCategoryFilter ? await getCategoryTree() : null;
  const categoryFacets = tree?.roots.filter((c) => c.productCount > 0).map((c) => ({ slug: c.slug, name: c.name, count: c.productCount, ids: descendantIds(c) }));
  const crumbs = [
    { name: "Ana Sayfa", path: "/" },
    { name: title, path },
  ];
  return (
    <>
      <JsonLd data={graph(breadcrumbSchema(crumbs))} />
      <ProductListing
        title={title}
        eyebrow={eyebrow}
        description={description}
        basePath={path}
        crumbs={crumbs}
        baseFilters={baseFilters}
        parsed={parsed}
        searchParams={searchParams}
        categoryFacets={categoryFacets}
        listId={`collection-${pageKey}`}
      />
    </>
  );
}
