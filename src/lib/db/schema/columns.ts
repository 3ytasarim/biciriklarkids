import { boolean, numeric, timestamp, varchar } from "drizzle-orm/pg-core";

/** Para: numeric(12,2) — JS tarafında number; toplamlar kuruş üzerinden hesaplanır (lib/commerce/money). */
export const money = () => numeric({ precision: 12, scale: 2, mode: "number" });
export const createdAt = () => timestamp({ withTimezone: true }).defaultNow().notNull();
export const updatedAt = () =>
  timestamp({ withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date());

export type FaqItem = { question: string; answer: string };

/** Ortak SEO alanları — veritabanından metadata override (title/description/keywords/canonical/OG/robots). */
export const seoColumns = () => ({
  seoTitle: varchar({ length: 160 }),
  seoDescription: varchar({ length: 320 }),
  seoKeywords: varchar({ length: 300 }),
  canonicalUrl: varchar({ length: 500 }),
  ogTitle: varchar({ length: 160 }),
  ogDescription: varchar({ length: 320 }),
  ogImage: varchar({ length: 500 }),
  noIndex: boolean().default(false).notNull(),
});
