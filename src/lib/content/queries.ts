import "server-only";
import { cache } from "react";
import { and, asc, count, desc, eq, gte, inArray, isNull, lte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { banners, blogCategories, blogPosts, homepageSectionProducts, homepageSections, pages, videos } from "@/lib/db/schema";

export type VideoSlot = typeof videos.$inferSelect;

/** Slot'a bağlı video kaydı. Kayıt yoksa veya URL boşsa çağıran taraf "VideoTest" yer tutucusu gösterir. */
export const getVideosBySlots = cache(async (slots: string[]): Promise<Map<string, VideoSlot>> => {
  if (!slots.length) return new Map();
  const rows = await db
    .select()
    .from(videos)
    .where(and(inArray(videos.slot, slots), eq(videos.isActive, true)));
  return new Map(rows.map((r) => [r.slot, r]));
});

export async function getActiveBanners(placement: "hero" | "promo" | "category_top") {
  const now = new Date();
  return db
    .select()
    .from(banners)
    .where(
      and(
        eq(banners.placement, placement),
        eq(banners.isActive, true),
        or(isNull(banners.startsAt), lte(banners.startsAt, now)),
        or(isNull(banners.endsAt), gte(banners.endsAt, now)),
      ),
    )
    .orderBy(asc(banners.sortOrder));
}

export const getHomepageSections = cache(async () => {
  const sections = await db.select().from(homepageSections).where(eq(homepageSections.isActive, true)).orderBy(asc(homepageSections.sortOrder));
  const manualIds = sections.filter((s) => s.config.source === "manual").map((s) => s.id);
  const picks = manualIds.length
    ? await db
        .select()
        .from(homepageSectionProducts)
        .where(inArray(homepageSectionProducts.sectionId, manualIds))
        .orderBy(asc(homepageSectionProducts.sortOrder))
    : [];
  return sections.map((s) => ({ ...s, productIds: picks.filter((p) => p.sectionId === s.id).map((p) => p.productId) }));
});

export type HomepageSection = Awaited<ReturnType<typeof getHomepageSections>>[number];

// ─────────────────────────── Sayfalar ───────────────────────────

export const getPageBySlug = cache(async (slug: string) => {
  const [row] = await db
    .select()
    .from(pages)
    .where(and(eq(pages.slug, slug), eq(pages.isActive, true)))
    .limit(1);
  return row ?? null;
});

export const getFooterPages = cache(async () =>
  db
    .select({ title: pages.title, slug: pages.slug, kind: pages.kind })
    .from(pages)
    .where(and(eq(pages.isActive, true), eq(pages.showInFooter, true)))
    .orderBy(asc(pages.sortOrder), asc(pages.title)),
);

// ─────────────────────────── Blog ───────────────────────────

const PUBLISHED = () => and(eq(blogPosts.status, "published"), lte(blogPosts.publishedAt, new Date()));

const postCardColumns = {
  id: blogPosts.id,
  title: blogPosts.title,
  slug: blogPosts.slug,
  excerpt: blogPosts.excerpt,
  coverImage: blogPosts.coverImage,
  coverImageAlt: blogPosts.coverImageAlt,
  publishedAt: blogPosts.publishedAt,
  readingMinutes: blogPosts.readingMinutes,
  categoryName: blogCategories.name,
  categorySlug: blogCategories.slug,
};

export async function listPosts(opts: { categoryId?: string; tag?: string; limit?: number; offset?: number } = {}) {
  const where = and(PUBLISHED(), opts.categoryId ? eq(blogPosts.categoryId, opts.categoryId) : undefined);
  const [items, [{ total }]] = await Promise.all([
    db
      .select(postCardColumns)
      .from(blogPosts)
      .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
      .where(where)
      .orderBy(desc(blogPosts.publishedAt))
      .limit(opts.limit ?? 12)
      .offset(opts.offset ?? 0),
    db.select({ total: count() }).from(blogPosts).where(where),
  ]);
  return { items, total: Number(total) };
}

export type PostCard = Awaited<ReturnType<typeof listPosts>>["items"][number];

export const getPostBySlug = cache(async (slug: string) => {
  const [row] = await db
    .select({ post: blogPosts, category: blogCategories })
    .from(blogPosts)
    .leftJoin(blogCategories, eq(blogPosts.categoryId, blogCategories.id))
    .where(and(eq(blogPosts.slug, slug), PUBLISHED()))
    .limit(1);
  return row ?? null;
});

export const getBlogCategories = cache(async () => db.select().from(blogCategories).orderBy(asc(blogCategories.sortOrder), asc(blogCategories.name)));
