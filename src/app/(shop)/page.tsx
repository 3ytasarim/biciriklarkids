import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, reviews } from "@/lib/db/schema";
import { getSiteSettings } from "@/lib/settings";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { faqSchema, graph, organizationSchema, websiteSchema } from "@/lib/schema/json-ld";
import { getCategoryTree, getProductCards, getProductCardsByIds } from "@/lib/catalog/queries";
import type { ListingFilters, ProductCardData } from "@/lib/catalog/types";
import { getActiveBanners, getHomepageSections, getVideosBySlots, listPosts, type HomepageSection } from "@/lib/content/queries";
import { DEFAULT_HOMEPAGE_SECTIONS } from "@/lib/content/homepage-defaults";
import { BRAND_FAQ } from "@/lib/content/brand-faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { DEFAULT_HERO, Hero, type HeroContent } from "@/components/homepage/Hero";
import { UspStrip } from "@/components/homepage/UspStrip";
import { CategoryDiscovery } from "@/components/homepage/CategoryDiscovery";
import { ProductRailSection } from "@/components/homepage/ProductRailSection";
import { VideoFeature } from "@/components/homepage/VideoFeature";
import { VideoReels } from "@/components/homepage/VideoReels";
import { Editorial } from "@/components/homepage/Editorial";
import { WhyUs } from "@/components/homepage/WhyUs";
import { BlogTeaser, NewsletterSection, ReviewsSection, SeoContent, type HomeReview } from "@/components/homepage/MoreSections";

export const revalidate = 300;

export function generateMetadata() {
  return buildStaticPageMetadata("home");
}

type Section = Pick<HomepageSection, "key" | "type" | "eyebrow" | "title" | "subtitle" | "config"> & { productIds: string[] };

async function loadSections(): Promise<Section[]> {
  const rows = await getHomepageSections().catch(() => []);
  if (rows.length) return rows;
  return DEFAULT_HOMEPAGE_SECTIONS.filter((s) => s.isActive !== false).map((s) => ({ ...s, eyebrow: s.eyebrow ?? null, title: s.title ?? null, subtitle: s.subtitle ?? null, productIds: [] }));
}

function filtersFor(s: Section): ListingFilters | null {
  switch (s.config.source) {
    case "bestseller":
      return { bestseller: true };
    case "new":
      return { isNew: true };
    case "gift":
      return { gift: true };
    case "featured":
      return { featured: true };
    case "discounted":
      return { onSale: true };
    case "category":
      return s.config.categoryId ? { categoryIds: [s.config.categoryId] } : null;
    default:
      return null;
  }
}

export default async function HomePage() {
  const [settings, sections, tree, heroBanners] = await Promise.all([getSiteSettings(), loadSections(), getCategoryTree(), getActiveBanners("hero")]);

  // Bölümlerin ihtiyaç duyduğu veriler paralel yüklenir.
  const REEL_MAX = 8;
  const reelSlots = (slot: string) => Array.from({ length: REEL_MAX }, (_, i) => `${slot}-${i + 1}`);
  const slots = sections
    .filter((s) => s.type === "video" && s.config.slot)
    .flatMap((s) => (s.config.tone === "reels" ? reelSlots(s.config.slot!) : [s.config.slot!]))
    .concat(sections.some((s) => s.type === "editorial") ? ["home-editorial"] : []);
  const productSections = sections.filter((s) => s.type === "product_grid");
  const [videos, productLists, homeReviews, posts] = await Promise.all([
    getVideosBySlots(slots),
    Promise.all(
      productSections.map(async (s): Promise<[string, ProductCardData[]]> => {
        if (s.config.source === "manual") return [s.key, await getProductCardsByIds(s.productIds)];
        const f = filtersFor(s);
        if (!f) return [s.key, []];
        // Kategori bölümü alt kategorileri de kapsar.
        if (f.categoryIds?.length) {
          const node = tree.byId.get(f.categoryIds[0]!);
          if (node) f.categoryIds = [node.id, ...node.children.map((c) => c.id)];
        }
        return [s.key, await getProductCards(f, s.config.source === "new" ? "yeni" : "onerilen", s.config.limit ?? 8)];
      }),
    ).then((entries) => new Map(entries)),
    sections.some((s) => s.type === "reviews") ? loadHomeReviews(6) : Promise.resolve([]),
    sections.some((s) => s.type === "blog") ? listPosts({ limit: 3 }).then((r) => r.items) : Promise.resolve([]),
  ]);

  const banner = heroBanners[0];
  const hero: HeroContent = banner
    ? {
        eyebrow: banner.eyebrow || DEFAULT_HERO.eyebrow,
        title: banner.title,
        highlight: null,
        subtitle: banner.subtitle || DEFAULT_HERO.subtitle,
        primary: { label: banner.ctaLabel || DEFAULT_HERO.primary.label, href: banner.ctaUrl || DEFAULT_HERO.primary.href },
        secondary: { label: banner.secondaryCtaLabel || DEFAULT_HERO.secondary.label, href: banner.secondaryCtaUrl || DEFAULT_HERO.secondary.href },
        image: banner.imageUrl ? { url: banner.imageUrl, alt: banner.imageAlt || banner.title, mobileUrl: banner.mobileImageUrl } : null,
      }
    : DEFAULT_HERO;

  const hasSeoBlock = sections.some((s) => s.type === "seo_content");

  return (
    <>
      <JsonLd data={graph(organizationSchema(settings), websiteSchema(settings), hasSeoBlock ? faqSchema(BRAND_FAQ) : null)} />
      {sections.map((s) => {
        const title = s.title ?? "";
        const link = s.config.ctaUrl ? { href: s.config.ctaUrl, label: s.config.ctaLabel || "Tümünü gör" } : null;
        switch (s.type) {
          case "hero":
            return <Hero key={s.key} content={hero} />;
          case "usp_strip":
            return <UspStrip key={s.key} settings={settings} />;
          case "category_discovery":
            return <CategoryDiscovery key={s.key} categories={tree.roots} eyebrow={s.eyebrow} title={title || "Kategoriler"} subtitle={s.subtitle} limit={s.config.limit ?? 6} />;
          case "product_grid":
            return <ProductRailSection key={s.key} id={`home-${s.key}`} eyebrow={s.eyebrow} title={title} subtitle={s.subtitle} products={productLists.get(s.key) ?? []} link={link} />;
          case "video":
            if (s.config.tone === "reels") {
              const reels = reelSlots(s.config.slot ?? s.key)
                .map((k) => videos.get(k))
                .filter((v): v is NonNullable<typeof v> => Boolean(v?.desktopUrl));
              return <VideoReels key={s.key} id={`home-${s.key}`} videos={reels} eyebrow={s.eyebrow} title={title} subtitle={s.subtitle} />;
            }
            return (
              <VideoFeature
                key={s.key}
                id={`home-${s.key}`}
                slot={s.config.slot ?? s.key}
                video={videos.get(s.config.slot ?? "")}
                eyebrow={s.eyebrow}
                title={title}
                subtitle={s.subtitle}
                variant={s.config.tone === "tinted" ? "steps" : "wide"}
              />
            );
          case "editorial":
            return <Editorial key={s.key} eyebrow={s.eyebrow} title={title || "Minik Eller İçin Büyük Hayaller"} video={videos.get("home-editorial")} />;
          case "why_us":
            return <WhyUs key={s.key} eyebrow={s.eyebrow} title={title} />;
          case "reviews":
            return <ReviewsSection key={s.key} eyebrow={s.eyebrow} title={title} reviews={homeReviews} />;
          case "blog":
            return <BlogTeaser key={s.key} eyebrow={s.eyebrow} title={title} posts={posts} link={link} />;
          case "newsletter":
            return <NewsletterSection key={s.key} title={title} subtitle={s.subtitle} />;
          case "seo_content":
            return <SeoContent key={s.key} title={title} faq={BRAND_FAQ} />;
          default:
            return null;
        }
      })}
    </>
  );
}

async function loadHomeReviews(limit: number): Promise<HomeReview[]> {
  return db
    .select({
      id: reviews.id,
      authorName: reviews.authorName,
      rating: reviews.rating,
      title: reviews.title,
      body: reviews.body,
      verifiedPurchase: reviews.verifiedPurchase,
      createdAt: reviews.createdAt,
      productName: products.name,
      productSlug: products.slug,
    })
    .from(reviews)
    .innerJoin(products, eq(reviews.productId, products.id))
    .where(and(eq(reviews.status, "approved"), eq(products.status, "active")))
    .orderBy(desc(reviews.rating), desc(reviews.createdAt))
    .limit(limit);
}
