import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { createdAt, type FaqItem, money, seoColumns, updatedAt } from "./columns";
import { difficulty, productStatus, visibilityStatus } from "./enums";

export const categories = pgTable(
  "categories",
  {
    id: uuid().defaultRandom().primaryKey(),
    parentId: uuid().references((): AnyPgColumn => categories.id, { onDelete: "set null" }),
    name: varchar({ length: 160 }).notNull(),
    slug: varchar({ length: 120 }).notNull(),
    /** Kısa tanıtım (liste başlığı altında, meta description fallback). */
    description: text(),
    /** Uzun, GEO odaklı kategori içeriği (HTML, sanitize edilmiş) — sayfanın alt bölümünde. */
    content: text(),
    /** Kullanıcıya görünen SSS → FAQPage şeması yalnızca bu doluysa. */
    faq: jsonb().$type<FaqItem[]>().default([]).notNull(),
    image: varchar({ length: 500 }),
    imageAlt: varchar({ length: 250 }),
    /** Tasarım vurgusu (tokens: coral | sun | leaf | sky | berry | lilac). */
    accent: varchar({ length: 20 }).default("coral").notNull(),
    showInMenu: boolean().default(true).notNull(),
    sortOrder: integer().default(0).notNull(),
    status: visibilityStatus().default("active").notNull(),
    ...seoColumns(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("categories_slug_uq").on(t.slug), index("categories_parent_idx").on(t.parentId)],
);

export const products = pgTable(
  "products",
  {
    id: uuid().defaultRandom().primaryKey(),
    name: varchar({ length: 200 }).notNull(),
    slug: varchar({ length: 140 }).notNull(),
    sku: varchar({ length: 64 }),
    /** GTIN / EAN-13 barkod (Merchant Center `gtin`). */
    barcode: varchar({ length: 32 }),
    /** Üretici parça numarası; boşsa feed'de SKU kullanılır. */
    mpn: varchar({ length: 64 }),
    shortDescription: varchar({ length: 400 }),
    description: text(),
    price: money().notNull(),
    compareAtPrice: money(),
    costPrice: money(),
    stock: integer().default(0).notNull(),
    trackStock: boolean().default(true).notNull(),
    lowStockThreshold: integer().default(3).notNull(),
    status: productStatus().default("draft").notNull(),
    featured: boolean().default(false).notNull(),
    bestseller: boolean().default(false).notNull(),
    newProduct: boolean().default(false).notNull(),
    giftProduct: boolean().default(false).notNull(),
    categoryId: uuid().references(() => categories.id, { onDelete: "set null" }),
    brand: varchar({ length: 120 }).default("Bıcırıklar Kids").notNull(),
    /** Filtrede "Ürün türü" (ör. Dikiş Kiti, Boyama Seti, Punch Seti). */
    productType: varchar({ length: 80 }),
    ageMin: integer(),
    ageMax: integer(),
    difficulty: difficulty(),
    material: text(),
    /** Paket içeriği — her satır bir kalem. */
    contents: text(),
    safetyInformation: text(),
    usageInformation: text(),
    faq: jsonb().$type<FaqItem[]>().default([]).notNull(),
    weightGrams: integer(),
    condition: varchar({ length: 20 }).default("new").notNull(),
    /** Google ürün kategorisi (ID veya tam yol). */
    googleProductCategory: varchar({ length: 255 }),
    ...seoColumns(),
    /** Arama için normalize edilmiş metin (ad + SKU + kategori + anahtar kelimeler; Türkçe karakterler sadeleştirilmiş). */
    searchText: text().default("").notNull(),
    /** Gerçek sipariş adedi (çok satanlar sıralaması). Siparişlerle artar. */
    salesCount: integer().default(0).notNull(),
    sortOrder: integer().default(0).notNull(),
    /** Tasarım testi için eklenen örnek ürün — `npm run demo:clear` ile silinir, feed/sitemap'e girmez. */
    isDemo: boolean().default(false).notNull(),
    publishedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("products_slug_uq").on(t.slug),
    uniqueIndex("products_sku_uq").on(t.sku).where(sql`${t.sku} is not null`),
    index("products_category_idx").on(t.categoryId),
    index("products_status_idx").on(t.status),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id: uuid().defaultRandom().primaryKey(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    imageUrl: varchar({ length: 500 }).notNull(),
    alt: varchar({ length: 250 }).notNull().default(""),
    title: varchar({ length: 250 }),
    width: integer(),
    height: integer(),
    sortOrder: integer().default(0).notNull(),
    isPrimary: boolean().default(false).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("product_images_product_idx").on(t.productId, t.sortOrder)],
);

export const productVariants = pgTable(
  "product_variants",
  {
    id: uuid().defaultRandom().primaryKey(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    /** Seçenek adı (ör. "Renk"). */
    name: varchar({ length: 80 }).notNull(),
    /** Seçenek değeri (ör. "Pembe"). */
    value: varchar({ length: 120 }).notNull(),
    sku: varchar({ length: 64 }),
    priceAdjustment: money().default(0).notNull(),
    stock: integer().default(0).notNull(),
    sortOrder: integer().default(0).notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("product_variants_product_idx").on(t.productId)],
);
