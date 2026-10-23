import "server-only";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { and, asc, avg, count, desc, eq, gt, gte, inArray, isNull, lte, ne, notInArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, productImages, products, reviews } from "@/lib/db/schema";
import { AGE_GROUPS, type CardImage, type CategoryNode, type ListingFilters, type ProductCardData, type SortKey } from "./types";

/**
 * Katalog önbelleği: kategori/ürün listesi sorguları 5 dk sunucuda tutulur (filtreli sayfalar her istekte
 * DB'ye gitmesin). Admin'de kayıt sonrası revalidateSite() bu etiketi anında temizler (lib/admin/revalidate.ts).
 * Sepet/sipariş/ödeme bu önbelleği KULLANMAZ (fiyat/stok her zaman DB'den).
 */
export const CATALOG_TAG = "catalog";
function catalogCache<A extends unknown[], R>(fn: (...args: A) => Promise<R>, key: string) {
  return unstable_cache(fn, [key], { revalidate: 300, tags: [CATALOG_TAG] });
}

// ─────────────────────────── Kategoriler ───────────────────────────

/** Aktif kategori ağacı + her kategoride (alt kategoriler dahil) aktif ürün sayısı. İstek başına bir kez. */
const loadCategoryRows = catalogCache(async () => {
  const [rows, counts] = await Promise.all([
    db
      .select({
        id: categories.id,
        parentId: categories.parentId,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        image: categories.image,
        imageAlt: categories.imageAlt,
        accent: categories.accent,
        showInMenu: categories.showInMenu,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .where(eq(categories.status, "active"))
      .orderBy(asc(categories.sortOrder), asc(categories.name)),
    db
      .select({ categoryId: products.categoryId, n: count() })
      .from(products)
      .where(eq(products.status, "active"))
      .groupBy(products.categoryId),
  ]);
  return { rows, counts: counts.map((c) => ({ categoryId: c.categoryId, n: Number(c.n) })) };
}, "category-tree");

export const getCategoryTree = cache(async (): Promise<{ roots: CategoryNode[]; byId: Map<string, CategoryNode>; bySlug: Map<string, CategoryNode> }> => {
  const { rows, counts } = await loadCategoryRows();

  const direct = new Map(counts.map((c) => [c.categoryId, Number(c.n)]));
  const byId = new Map<string, CategoryNode>();
  for (const r of rows) byId.set(r.id, { ...r, productCount: direct.get(r.id) ?? 0, children: [] });

  const roots: CategoryNode[] = [];
  for (const node of byId.values()) {
    const parent = node.parentId ? byId.get(node.parentId) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  // Alt kategorilerdeki ürünleri üst kategoriye ekle (derinlik öncelikli toplam).
  const total = (n: CategoryNode): number => {
    n.productCount += n.children.reduce((s, c) => s + total(c), 0);
    return n.productCount;
  };
  roots.forEach(total);

  const bySlug = new Map([...byId.values()].map((n) => [n.slug, n]));
  return { roots, byId, bySlug };
});

/** Kategori + tüm alt kategorilerinin id'leri (filtre için). */
export function descendantIds(node: CategoryNode): string[] {
  return [node.id, ...node.children.flatMap(descendantIds)];
}

/** Kökten kategoriye giden yol (breadcrumb). */
export function categoryTrail(node: CategoryNode, byId: Map<string, CategoryNode>): CategoryNode[] {
  const trail: CategoryNode[] = [];
  let cur: CategoryNode | undefined = node;
  const seen = new Set<string>();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    trail.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return trail;
}

const loadCategoryBySlug = catalogCache(async (slug: string) => {
  const [row] = await db
    .select()
    .from(categories)
    .where(and(eq(categories.slug, slug), eq(categories.status, "active")))
    .limit(1);
  return row ?? null;
}, "category-by-slug");

export async function getCategoryBySlug(slug: string) {
  const row = await loadCategoryBySlug(slug);
  // Önbellek JSON'dan döner: tarih alanlarını Date'e geri çevir
  return row ? { ...row, createdAt: new Date(row.createdAt), updatedAt: new Date(row.updatedAt) } : null;
}

// ─────────────────────────── Ürün listeleri ───────────────────────────

const ACTIVE = eq(products.status, "active");
const IN_STOCK = or(eq(products.trackStock, false), gt(products.stock, 0))!;

function buildWhere(f: ListingFilters): SQL {
  const parts: (SQL | undefined)[] = [ACTIVE];
  if (f.categoryIds?.length) parts.push(inArray(products.categoryId, f.categoryIds));
  if (f.minPrice != null) parts.push(gte(products.price, f.minPrice));
  if (f.maxPrice != null) parts.push(lte(products.price, f.maxPrice));
  if (f.types?.length) parts.push(inArray(products.productType, f.types));
  if (f.inStock) parts.push(IN_STOCK);
  if (f.isNew) parts.push(eq(products.newProduct, true));
  if (f.bestseller) parts.push(eq(products.bestseller, true));
  if (f.gift) parts.push(eq(products.giftProduct, true));
  if (f.featured) parts.push(eq(products.featured, true));
  if (f.onSale) parts.push(sql`${products.compareAtPrice} > ${products.price}`);
  if (f.ids) parts.push(f.ids.length ? inArray(products.id, f.ids) : sql`false`);
  if (f.excludeIds?.length) parts.push(notInArray(products.id, f.excludeIds));
  if (f.ages?.length) {
    const groups = AGE_GROUPS.filter((g) => f.ages!.includes(g.value));
    if (groups.length) {
      parts.push(
        or(
          ...groups.map((g) =>
            and(or(isNull(products.ageMin), lte(products.ageMin, g.max)), or(isNull(products.ageMax), gte(products.ageMax, g.min)), or(sql`${products.ageMin} is not null`, sql`${products.ageMax} is not null`)),
          ),
        ),
      );
    }
  }
  return and(...parts.filter(Boolean))!;
}

function buildOrder(sort: SortKey): SQL[] {
  switch (sort) {
    case "yeni":
      return [desc(sql`coalesce(${products.publishedAt}, ${products.createdAt})`)];
    case "fiyat-artan":
      return [asc(products.price), asc(products.name)];
    case "fiyat-azalan":
      return [desc(products.price), asc(products.name)];
    case "cok-satan":
      return [desc(products.salesCount), desc(products.bestseller), asc(products.sortOrder)];
    default:
      // Önerilen: stokta olanlar önce, sonra öne çıkanlar, admin sırası, yeniler.
      return [desc(sql`(${IN_STOCK})`), desc(products.featured), asc(products.sortOrder), desc(products.createdAt)];
  }
}

const cardColumns = {
  id: products.id,
  slug: products.slug,
  name: products.name,
  sku: products.sku,
  price: products.price,
  compareAtPrice: products.compareAtPrice,
  stock: products.stock,
  trackStock: products.trackStock,
  lowStockThreshold: products.lowStockThreshold,
  newProduct: products.newProduct,
  bestseller: products.bestseller,
  giftProduct: products.giftProduct,
  isDemo: products.isDemo,
  ageMin: products.ageMin,
  ageMax: products.ageMax,
  categoryName: categories.name,
  categorySlug: categories.slug,
};

const cardsQuery = () => db.select(cardColumns).from(products).leftJoin(categories, eq(products.categoryId, categories.id));
type CardRow = Awaited<ReturnType<typeof cardsQuery>>[number];

async function hydrateCards(rows: CardRow[]): Promise<ProductCardData[]> {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);
  const [imgs, ratings] = await Promise.all([
    db
      .select({ productId: productImages.productId, url: productImages.imageUrl, alt: productImages.alt, width: productImages.width, height: productImages.height })
      .from(productImages)
      .where(inArray(productImages.productId, ids))
      .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder)),
    db
      .select({ productId: reviews.productId, average: avg(reviews.rating), n: count() })
      .from(reviews)
      .where(and(inArray(reviews.productId, ids), eq(reviews.status, "approved")))
      .groupBy(reviews.productId),
  ]);
  const imageMap = new Map<string, CardImage[]>();
  for (const i of imgs) {
    const list = imageMap.get(i.productId) ?? [];
    if (list.length < 2) list.push({ url: i.url, alt: i.alt, width: i.width, height: i.height });
    imageMap.set(i.productId, list);
  }
  const ratingMap = new Map(ratings.map((r) => [r.productId, { average: Math.round(Number(r.average) * 10) / 10, count: Number(r.n) }]));

  return rows.map((r) => {
    const inStock = !r.trackStock || r.stock > 0;
    const list = imageMap.get(r.id) ?? [];
    return {
      id: r.id,
      slug: r.slug,
      name: r.name,
      sku: r.sku,
      price: r.price,
      compareAtPrice: r.compareAtPrice,
      inStock,
      lowStock: r.trackStock && inStock && r.stock <= r.lowStockThreshold ? r.stock : null,
      newProduct: r.newProduct,
      bestseller: r.bestseller,
      giftProduct: r.giftProduct,
      isDemo: r.isDemo,
      ageMin: r.ageMin,
      ageMax: r.ageMax,
      category: r.categoryName && r.categorySlug ? { name: r.categoryName, slug: r.categorySlug } : null,
      image: list[0] ?? null,
      hoverImage: list[1] ?? null,
      rating: ratingMap.get(r.id) ?? null,
    };
  });
}

export const listProducts = catalogCache(listProductsRaw, "list-products");
async function listProductsRaw(opts: { filters?: ListingFilters; sort?: SortKey; limit?: number; offset?: number }): Promise<{ items: ProductCardData[]; total: number }> {
  const where = buildWhere(opts.filters ?? {});
  const [rows, [{ total }]] = await Promise.all([
    cardsQuery()
      .where(where)
      .orderBy(...buildOrder(opts.sort ?? "onerilen"))
      .limit(opts.limit ?? 24)
      .offset(opts.offset ?? 0),
    db.select({ total: count() }).from(products).where(where),
  ]);
  return { items: await hydrateCards(rows), total: Number(total) };
}

/** Kısa liste (ana sayfa bölümleri, ilgili ürünler) — toplam sayım yapılmaz. */
export const getProductCards = catalogCache(getProductCardsRaw, "product-cards");
async function getProductCardsRaw(filters: ListingFilters, sort: SortKey = "onerilen", limit = 8): Promise<ProductCardData[]> {
  const rows = await cardsQuery()
    .where(buildWhere(filters))
    .orderBy(...buildOrder(sort))
    .limit(limit);
  return hydrateCards(rows);
}

/** Verilen id sırasını koruyarak kartlar (manuel ana sayfa seçimi, son görüntülenenler, favoriler). */
export async function getProductCardsByIds(ids: string[]): Promise<ProductCardData[]> {
  const unique = [...new Set(ids)].filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 48);
  if (!unique.length) return [];
  const cards = await getProductCards({ ids: unique }, "onerilen", unique.length);
  const order = new Map(unique.map((id, i) => [id, i]));
  return cards.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

/** Filtre panelinde gösterilecek gerçek değerler (yalnızca var olan ürün türleri ve fiyat aralığı). */
export async function getFacetValues(categoryIds?: string[]) {
  const where = and(ACTIVE, categoryIds?.length ? inArray(products.categoryId, categoryIds) : undefined);
  const [types, [range]] = await Promise.all([
    db
      .selectDistinct({ type: products.productType })
      .from(products)
      .where(and(where, sql`${products.productType} is not null`, ne(products.productType, "")))
      .orderBy(asc(products.productType)),
    db.select({ min: sql<number>`coalesce(min(${products.price}), 0)::float`, max: sql<number>`coalesce(max(${products.price}), 0)::float` }).from(products).where(where),
  ]);
  return { types: types.map((t) => t.type!).filter(Boolean), priceRange: { min: Math.floor(range?.min ?? 0), max: Math.ceil(range?.max ?? 0) } };
}

// ─────────────────────────── Ürün detayı ───────────────────────────

export const getProductBySlug = cache(async (slug: string) => {
  const product = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), eq(products.status, "active")),
    with: {
      category: true,
      images: { orderBy: (t, { asc: a, desc: d }) => [d(t.isPrimary), a(t.sortOrder)] },
      variants: { orderBy: (t, { asc: a }) => [a(t.sortOrder)] },
      videos: { where: (t, { eq: e }) => e(t.isActive, true), orderBy: (t, { asc: a }) => [a(t.sortOrder)] },
    },
  });
  return product ?? null;
});

export type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

export async function getApprovedReviews(productId: string, limit = 20) {
  const [list, [agg]] = await Promise.all([
    db
      .select({
        id: reviews.id,
        authorName: reviews.authorName,
        rating: reviews.rating,
        title: reviews.title,
        body: reviews.body,
        verifiedPurchase: reviews.verifiedPurchase,
        adminReply: reviews.adminReply,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved")))
      .orderBy(desc(reviews.createdAt))
      .limit(limit),
    db
      .select({ average: avg(reviews.rating), n: count() })
      .from(reviews)
      .where(and(eq(reviews.productId, productId), eq(reviews.status, "approved"))),
  ]);
  const total = Number(agg?.n ?? 0);
  return { list, summary: total ? { average: Math.round(Number(agg!.average) * 10) / 10, count: total } : null };
}

/** Benzer ürünler: aynı kategori (yoksa önerilen). */
export async function getRelatedProducts(productId: string, categoryId: string | null, limit = 8) {
  const same = categoryId ? await getProductCards({ categoryIds: [categoryId], excludeIds: [productId] }, "onerilen", limit) : [];
  if (same.length >= 4) return same;
  const more = await getProductCards({ excludeIds: [productId, ...same.map((p) => p.id)] }, "cok-satan", limit - same.length);
  return [...same, ...more];
}
