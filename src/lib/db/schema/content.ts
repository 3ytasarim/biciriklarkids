import { boolean, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, varchar } from "drizzle-orm/pg-core";
import { products } from "./catalog";
import { createdAt, type FaqItem, seoColumns, updatedAt } from "./columns";
import { bannerPlacement, homepageSectionType, newsletterStatus, pageKind, publishStatus } from "./enums";

// ─────────────────────────── Ana sayfa ───────────────────────────

export const banners = pgTable(
  "banners",
  {
    id: uuid().defaultRandom().primaryKey(),
    placement: bannerPlacement().default("hero").notNull(),
    eyebrow: varchar({ length: 80 }),
    title: varchar({ length: 160 }).notNull(),
    subtitle: varchar({ length: 400 }),
    ctaLabel: varchar({ length: 60 }),
    ctaUrl: varchar({ length: 500 }),
    secondaryCtaLabel: varchar({ length: 60 }),
    secondaryCtaUrl: varchar({ length: 500 }),
    imageUrl: varchar({ length: 500 }),
    imageAlt: varchar({ length: 250 }),
    mobileImageUrl: varchar({ length: 500 }),
    isActive: boolean().default(true).notNull(),
    sortOrder: integer().default(0).notNull(),
    startsAt: timestamp({ withTimezone: true }),
    endsAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("banners_placement_idx").on(t.placement, t.isActive)],
);

/**
 * Ana sayfa bölümleri: sıra, başlık, aktiflik ve kaynak admin'den yönetilir.
 * config örn. product_grid → { source: "bestseller" | "new" | "gift" | "featured" | "discounted" | "manual" | "category", categoryId?, limit, ctaLabel, ctaUrl }
 *              video → { slot: "home-lifestyle" }
 */
export type HomepageSectionConfig = {
  source?: "bestseller" | "new" | "gift" | "featured" | "discounted" | "manual" | "category";
  categoryId?: string | null;
  limit?: number;
  ctaLabel?: string | null;
  ctaUrl?: string | null;
  slot?: string | null;
  /** reels: dikey (9:16) videoların yatay kaydırmalı şeridi; videolar `<slot>-1 … <slot>-8` slotlarından okunur. */
  tone?: "plain" | "tinted" | "reels";
};

export const homepageSections = pgTable(
  "homepage_sections",
  {
    id: uuid().defaultRandom().primaryKey(),
    key: varchar({ length: 60 }).notNull(),
    type: homepageSectionType().notNull(),
    eyebrow: varchar({ length: 80 }),
    title: varchar({ length: 160 }),
    subtitle: text(),
    config: jsonb().$type<HomepageSectionConfig>().default({}).notNull(),
    isActive: boolean().default(true).notNull(),
    sortOrder: integer().default(0).notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("homepage_sections_key_uq").on(t.key)],
);

export const homepageSectionProducts = pgTable(
  "homepage_section_products",
  {
    sectionId: uuid()
      .notNull()
      .references(() => homepageSections.id, { onDelete: "cascade" }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    sortOrder: integer().default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.sectionId, t.productId] })],
);

/**
 * Video alanları. `slot` sayfadaki yeri tanımlar (home-lifestyle, home-howto, home-brand, product:<id> …).
 * URL boşsa sayfada aynı ölçüde "VideoTest" yer tutucusu gösterilir — gerçek video eklenince layout değişmez.
 */
export const videos = pgTable(
  "videos",
  {
    id: uuid().defaultRandom().primaryKey(),
    slot: varchar({ length: 80 }).notNull(),
    title: varchar({ length: 160 }).notNull(),
    description: text(),
    desktopUrl: varchar({ length: 500 }),
    mobileUrl: varchar({ length: 500 }),
    posterUrl: varchar({ length: 500 }),
    mobilePosterUrl: varchar({ length: 500 }),
    aspectRatio: varchar({ length: 12 }).default("16/9").notNull(),
    mobileAspectRatio: varchar({ length: 12 }).default("4/5").notNull(),
    autoplay: boolean().default(true).notNull(),
    loop: boolean().default(true).notNull(),
    /** Saniye — VideoObject şeması için. */
    durationSeconds: integer(),
    productId: uuid().references(() => products.id, { onDelete: "cascade" }),
    isActive: boolean().default(true).notNull(),
    sortOrder: integer().default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("videos_slot_uq").on(t.slot)],
);

// ─────────────────────────── SEO & Ayarlar ───────────────────────────

/** Statik sayfaların (ana sayfa, listeler, blog arşivi…) SEO override'ları. key: lib/seo/static-pages.ts */
export const seoSettings = pgTable("seo_settings", {
  key: varchar({ length: 60 }).primaryKey(),
  title: varchar({ length: 160 }),
  description: varchar({ length: 320 }),
  keywords: varchar({ length: 300 }),
  canonicalUrl: varchar({ length: 500 }),
  ogTitle: varchar({ length: 160 }),
  ogDescription: varchar({ length: 320 }),
  ogImage: varchar({ length: 500 }),
  robotsIndex: boolean().default(true).notNull(),
  robotsFollow: boolean().default(true).notNull(),
  updatedAt: updatedAt(),
});

/** Anahtar/değer site ayarları (iletişim, sosyal, duyuru çubuğu, kargo, analytics ID'leri…). Şema: lib/settings.ts */
export const siteSettings = pgTable("site_settings", {
  key: varchar({ length: 60 }).primaryKey(),
  value: jsonb().notNull(),
  updatedAt: updatedAt(),
});

// ─────────────────────────── Blog ───────────────────────────

export const blogCategories = pgTable(
  "blog_categories",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: varchar({ length: 120 }).notNull(),
    slug: varchar({ length: 120 }).notNull(),
    description: text(),
    sortOrder: integer().default(0).notNull(),
    ...seoColumns(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("blog_categories_slug_uq").on(t.slug)],
);

export const blogPosts = pgTable(
  "blog_posts",
  {
    id: uuid().defaultRandom().primaryKey(),
    title: varchar({ length: 200 }).notNull(),
    slug: varchar({ length: 140 }).notNull(),
    excerpt: varchar({ length: 500 }),
    content: text().default("").notNull(),
    coverImage: varchar({ length: 500 }),
    coverImageAlt: varchar({ length: 250 }),
    tags: text().array().default([]).notNull(),
    categoryId: uuid().references(() => blogCategories.id, { onDelete: "set null" }),
    authorName: varchar({ length: 120 }),
    authorBio: varchar({ length: 400 }),
    status: publishStatus().default("draft").notNull(),
    publishedAt: timestamp({ withTimezone: true }),
    readingMinutes: integer(),
    ...seoColumns(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("blog_posts_slug_uq").on(t.slug), index("blog_posts_published_idx").on(t.status, t.publishedAt)],
);

// ─────────────────────────── Sayfalar (yasal + bilgi) ───────────────────────────

export const pages = pgTable(
  "pages",
  {
    id: uuid().defaultRandom().primaryKey(),
    kind: pageKind().default("info").notNull(),
    title: varchar({ length: 200 }).notNull(),
    slug: varchar({ length: 140 }).notNull(),
    excerpt: varchar({ length: 400 }),
    content: text().default("").notNull(),
    /** Sayfada görünen SSS (FAQPage şeması yalnızca bu doluysa). */
    faq: jsonb().$type<FaqItem[]>().default([]).notNull(),
    isActive: boolean().default(true).notNull(),
    showInFooter: boolean().default(true).notNull(),
    sortOrder: integer().default(0).notNull(),
    ...seoColumns(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("pages_slug_uq").on(t.slug)],
);

// ─────────────────────────── Yönlendirme, Medya, Bülten ───────────────────────────

export const redirects = pgTable(
  "redirects",
  {
    id: uuid().defaultRandom().primaryKey(),
    sourcePath: varchar({ length: 500 }).notNull(),
    destinationPath: varchar({ length: 500 }).notNull(),
    statusCode: integer().default(301).notNull(),
    isActive: boolean().default(true).notNull(),
    note: varchar({ length: 250 }),
    hits: integer().default(0).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("redirects_source_uq").on(t.sourcePath)],
);

export const media = pgTable(
  "media",
  {
    id: uuid().defaultRandom().primaryKey(),
    url: varchar({ length: 500 }).notNull(),
    storageKey: varchar({ length: 500 }).notNull(),
    filename: varchar({ length: 255 }).notNull(),
    originalName: varchar({ length: 255 }),
    mimeType: varchar({ length: 80 }).notNull(),
    size: integer().notNull(),
    width: integer(),
    height: integer(),
    alt: varchar({ length: 250 }),
    title: varchar({ length: 250 }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("media_url_uq").on(t.url)],
);

export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: uuid().defaultRandom().primaryKey(),
    email: varchar({ length: 160 }).notNull(),
    status: newsletterStatus().default("subscribed").notNull(),
    source: varchar({ length: 40 }),
    consentAt: timestamp({ withTimezone: true }).notNull(),
    ipHash: varchar({ length: 32 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("newsletter_email_uq").on(t.email)],
);

export const contactMessages = pgTable("contact_messages", {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 120 }).notNull(),
  email: varchar({ length: 160 }).notNull(),
  phone: varchar({ length: 32 }),
  subject: varchar({ length: 160 }),
  message: text().notNull(),
  isRead: boolean().default(false).notNull(),
  ipHash: varchar({ length: 32 }),
  createdAt: createdAt(),
});
