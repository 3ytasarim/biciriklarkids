import type { MetadataRoute } from "next";
import { and, asc, desc, eq, inArray, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogCategories, blogPosts, categories, pages, productImages, products } from "@/lib/db/schema";
import { absoluteUrl } from "@/lib/seo/site";
import { STATIC_PAGES } from "@/lib/seo/static-pages";

export const revalidate = 3600;

/**
 * Dinamik XML sitemap — yalnızca indekslenebilir, aktif içerik: ana sayfa + statik sayfalar, kategoriler,
 * ürünler (görselleriyle → image sitemap), blog, içerik sayfaları. Demo ürünler ve noindex kayıtlar hariç.
 * lastModified gerçek updatedAt'ten. Ürün sayısı ~45.000'i aşarsa generateSitemaps ile parçalanmalı.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cats, prods, posts, blogCats, cmsPages] = await Promise.all([
    db.select({ slug: categories.slug, updatedAt: categories.updatedAt }).from(categories).where(and(eq(categories.status, "active"), eq(categories.noIndex, false))).orderBy(asc(categories.sortOrder)),
    db
      .select({ id: products.id, slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(and(eq(products.status, "active"), eq(products.isDemo, false), eq(products.noIndex, false)))
      .orderBy(desc(products.updatedAt))
      .limit(45000),
    db
      .select({ slug: blogPosts.slug, updatedAt: blogPosts.updatedAt })
      .from(blogPosts)
      .where(and(eq(blogPosts.status, "published"), lte(blogPosts.publishedAt, new Date()), eq(blogPosts.noIndex, false))),
    db.select({ slug: blogCategories.slug, updatedAt: blogCategories.updatedAt }).from(blogCategories).where(eq(blogCategories.noIndex, false)),
    db.select({ slug: pages.slug, updatedAt: pages.updatedAt }).from(pages).where(and(eq(pages.isActive, true), eq(pages.noIndex, false))),
  ]);

  const imgs = prods.length
    ? await db
        .select({ productId: productImages.productId, url: productImages.imageUrl })
        .from(productImages)
        .where(inArray(productImages.productId, prods.map((p) => p.id)))
        .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder))
    : [];
  const imagesBy = new Map<string, string[]>();
  for (const i of imgs) imagesBy.set(i.productId, [...(imagesBy.get(i.productId) ?? []), absoluteUrl(i.url)].slice(0, 10));

  const newest = (dates: Date[]) => (dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : undefined);
  const catalogUpdated = newest([...prods.map((p) => p.updatedAt), ...cats.map((c) => c.updatedAt)]);

  const staticEntries: MetadataRoute.Sitemap = Object.values(STATIC_PAGES).map((p) => ({
    url: absoluteUrl(p.path),
    lastModified: p.path === "/blog" ? newest(posts.map((x) => x.updatedAt)) : catalogUpdated,
    changeFrequency: p.path === "/" ? "daily" : "weekly",
    priority: p.path === "/" ? 1 : 0.7,
  }));

  return [
    ...staticEntries,
    ...cats.map((c) => ({ url: absoluteUrl(`/kategori/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...prods.map((p) => ({ url: absoluteUrl(`/urun/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "weekly" as const, priority: 0.9, images: imagesBy.get(p.id) })),
    ...blogCats.map((c) => ({ url: absoluteUrl(`/blog/kategori/${c.slug}`), lastModified: c.updatedAt, changeFrequency: "weekly" as const, priority: 0.4 })),
    ...posts.map((p) => ({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "monthly" as const, priority: 0.6 })),
    ...cmsPages.map((p) => ({ url: absoluteUrl(`/${p.slug}`), lastModified: p.updatedAt, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
