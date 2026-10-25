import { pgEnum } from "drizzle-orm/pg-core";

export const productStatus = pgEnum("product_status", ["draft", "active", "archived"]);
export const visibilityStatus = pgEnum("visibility_status", ["active", "hidden"]);
export const publishStatus = pgEnum("publish_status", ["draft", "published"]);
export const difficulty = pgEnum("difficulty", ["easy", "medium", "hard"]);

export const orderStatus = pgEnum("order_status", [
  "pending", // oluşturuldu, ödeme bekleniyor
  "confirmed", // ödeme alındı / onaylandı
  "processing", // hazırlanıyor
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
]);

export const paymentStatus = pgEnum("payment_status", ["pending", "awaiting_transfer", "paid", "failed", "refunded", "partially_refunded", "cancelled"]);

export const couponType = pgEnum("coupon_type", ["percent", "fixed", "free_shipping"]);
export const reviewStatus = pgEnum("review_status", ["pending", "approved", "rejected"]);
export const adminRole = pgEnum("admin_role", ["editor", "admin", "owner"]);

export const homepageSectionType = pgEnum("homepage_section_type", [
  "hero",
  "usp_strip",
  "category_discovery",
  "product_grid",
  "video",
  "editorial",
  "why_us",
  "reviews",
  "blog",
  "newsletter",
  "seo_content",
]);

export const bannerPlacement = pgEnum("banner_placement", ["hero", "promo", "category_top"]);
export const newsletterStatus = pgEnum("newsletter_status", ["subscribed", "unsubscribed"]);
export const pageKind = pgEnum("page_kind", ["legal", "info"]);
