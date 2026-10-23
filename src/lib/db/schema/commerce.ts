import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { categories, products, productVariants } from "./catalog";
import { createdAt, money, updatedAt } from "./columns";
import { couponType, orderStatus, paymentStatus, reviewStatus } from "./enums";

// ─────────────────────────── Müşteriler ───────────────────────────

export const customers = pgTable(
  "customers",
  {
    id: uuid().defaultRandom().primaryKey(),
    email: varchar({ length: 160 }).notNull(),
    /** Misafir siparişlerinde null; üyelik oluşturulunca dolar. */
    passwordHash: text(),
    firstName: varchar({ length: 80 }),
    lastName: varchar({ length: 80 }),
    phone: varchar({ length: 32 }),
    marketingConsent: boolean().default(false).notNull(),
    marketingConsentAt: timestamp({ withTimezone: true }),
    isActive: boolean().default(true).notNull(),
    lastLoginAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("customers_email_uq").on(t.email)],
);

export const customerSessions = pgTable(
  "customer_sessions",
  {
    id: uuid().defaultRandom().primaryKey(),
    customerId: uuid()
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    tokenHash: varchar({ length: 64 }).notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("customer_sessions_token_uq").on(t.tokenHash)],
);

export type AddressSnapshot = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  postalCode?: string | null;
  addressLine: string;
};

export type BillingSnapshot = AddressSnapshot & {
  invoiceType: "individual" | "corporate";
  companyName?: string | null;
  taxOffice?: string | null;
  taxNumber?: string | null;
};

export const addresses = pgTable(
  "addresses",
  {
    id: uuid().defaultRandom().primaryKey(),
    customerId: uuid()
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    title: varchar({ length: 60 }).default("Adresim").notNull(),
    firstName: varchar({ length: 80 }).notNull(),
    lastName: varchar({ length: 80 }).notNull(),
    phone: varchar({ length: 32 }).notNull(),
    city: varchar({ length: 60 }).notNull(),
    district: varchar({ length: 80 }).notNull(),
    postalCode: varchar({ length: 10 }),
    addressLine: text().notNull(),
    invoiceType: varchar({ length: 20 }).default("individual").notNull(),
    companyName: varchar({ length: 160 }),
    taxOffice: varchar({ length: 80 }),
    taxNumber: varchar({ length: 20 }),
    isDefault: boolean().default(false).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("addresses_customer_idx").on(t.customerId)],
);

// ─────────────────────────── Sepet ───────────────────────────

/** Sunucu tarafı sepet: httpOnly ziyaretçi çerezindeki token ile eşleşir. Fiyat sepette TUTULMAZ, her okumada DB'den gelir. */
export const carts = pgTable(
  "carts",
  {
    id: uuid().defaultRandom().primaryKey(),
    tokenHash: varchar({ length: 64 }).notNull(),
    customerId: uuid().references(() => customers.id, { onDelete: "set null" }),
    couponCode: varchar({ length: 40 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("carts_token_uq").on(t.tokenHash), index("carts_updated_idx").on(t.updatedAt)],
);

export const cartItems = pgTable(
  "cart_items",
  {
    id: uuid().defaultRandom().primaryKey(),
    cartId: uuid()
      .notNull()
      .references(() => carts.id, { onDelete: "cascade" }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    variantId: uuid().references(() => productVariants.id, { onDelete: "cascade" }),
    quantity: integer().notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique("cart_items_line_uq").on(t.cartId, t.productId, t.variantId).nullsNotDistinct()],
);

// ─────────────────────────── Siparişler ───────────────────────────

export const orders = pgTable(
  "orders",
  {
    id: uuid().defaultRandom().primaryKey(),
    /** İnsan okunur sipariş no: BK-260001 (sequence). */
    orderNumber: varchar({ length: 24 }).notNull(),
    seq: serial().notNull(),
    /** Misafir sipariş görüntüleme anahtarının SHA-256 özeti (onay sayfası / sipariş takibi). */
    accessTokenHash: varchar({ length: 64 }).notNull(),
    customerId: uuid().references(() => customers.id, { onDelete: "set null" }),
    email: varchar({ length: 160 }).notNull(),
    phone: varchar({ length: 32 }).notNull(),
    firstName: varchar({ length: 80 }).notNull(),
    lastName: varchar({ length: 80 }).notNull(),
    shippingAddress: jsonb().$type<AddressSnapshot>().notNull(),
    billingAddress: jsonb().$type<BillingSnapshot>().notNull(),
    note: text(),
    status: orderStatus().default("pending").notNull(),
    paymentStatus: paymentStatus().default("pending").notNull(),
    paymentProvider: varchar({ length: 40 }).notNull(),
    currency: varchar({ length: 3 }).default("TRY").notNull(),
    subtotal: money().notNull(),
    discountTotal: money().default(0).notNull(),
    shippingTotal: money().default(0).notNull(),
    grandTotal: money().notNull(),
    couponId: uuid().references(() => coupons.id, { onDelete: "set null" }),
    couponCode: varchar({ length: 40 }),
    /** Kargo firması ve takip no admin tarafından elle girilir (entegrasyon yok). */
    carrier: varchar({ length: 60 }),
    trackingNumber: varchar({ length: 80 }),
    termsAcceptedAt: timestamp({ withTimezone: true }).notNull(),
    ipHash: varchar({ length: 32 }),
    paidAt: timestamp({ withTimezone: true }),
    shippedAt: timestamp({ withTimezone: true }),
    deliveredAt: timestamp({ withTimezone: true }),
    cancelledAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("orders_number_uq").on(t.orderNumber),
    index("orders_customer_idx").on(t.customerId),
    index("orders_status_idx").on(t.status),
    index("orders_created_idx").on(t.createdAt),
    index("orders_email_idx").on(t.email),
  ],
);

export const orderItems = pgTable(
  "order_items",
  {
    id: uuid().defaultRandom().primaryKey(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: uuid().references(() => products.id, { onDelete: "set null" }),
    variantId: uuid().references(() => productVariants.id, { onDelete: "set null" }),
    /** Sipariş anındaki ürün bilgisi (ürün sonradan değişse/silinse de sipariş doğru kalır). */
    name: varchar({ length: 200 }).notNull(),
    variantLabel: varchar({ length: 200 }),
    sku: varchar({ length: 64 }),
    slug: varchar({ length: 140 }),
    imageUrl: varchar({ length: 500 }),
    categoryName: varchar({ length: 160 }),
    unitPrice: money().notNull(),
    compareAtPrice: money(),
    quantity: integer().notNull(),
    lineTotal: money().notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

/** Sipariş zaman çizelgesi (durum değişiklikleri, notlar, ödeme olayları). */
export const orderEvents = pgTable(
  "order_events",
  {
    id: uuid().defaultRandom().primaryKey(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    type: varchar({ length: 30 }).notNull(), // created | status | payment | note | shipment
    fromStatus: varchar({ length: 30 }),
    toStatus: varchar({ length: 30 }),
    message: text(),
    /** Görünür mü (müşteri sipariş takibinde)? İç notlar false. */
    isPublic: boolean().default(false).notNull(),
    actor: varchar({ length: 120 }).default("Sistem").notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("order_events_order_idx").on(t.orderId, t.createdAt)],
);

/** Sağlayıcıdan bağımsız ödeme kayıtları (iyzico / PayTR / sanal POS / havale). */
export const paymentTransactions = pgTable(
  "payment_transactions",
  {
    id: uuid().defaultRandom().primaryKey(),
    orderId: uuid()
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    provider: varchar({ length: 40 }).notNull(),
    providerReference: varchar({ length: 160 }),
    amount: money().notNull(),
    currency: varchar({ length: 3 }).default("TRY").notNull(),
    status: paymentStatus().notNull(),
    /** Sağlayıcı yanıtı (kart verisi ASLA saklanmaz). */
    raw: jsonb(),
    createdAt: createdAt(),
  },
  (t) => [index("payment_tx_order_idx").on(t.orderId)],
);

// ─────────────────────────── Kupon ───────────────────────────

export const coupons = pgTable(
  "coupons",
  {
    id: uuid().defaultRandom().primaryKey(),
    code: varchar({ length: 40 }).notNull(),
    description: varchar({ length: 250 }),
    type: couponType().notNull(),
    value: money().default(0).notNull(),
    minOrderAmount: money(),
    maxDiscountAmount: money(),
    /** Yalnızca bu kategorideki ürünlere uygulanır (boşsa tüm sepet). */
    categoryId: uuid().references(() => categories.id, { onDelete: "set null" }),
    startsAt: timestamp({ withTimezone: true }),
    endsAt: timestamp({ withTimezone: true }),
    usageLimit: integer(),
    usagePerCustomer: integer(),
    usedCount: integer().default(0).notNull(),
    isActive: boolean().default(true).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("coupons_code_uq").on(t.code)],
);

// ─────────────────────────── Yorumlar ───────────────────────────

/** Yalnızca onaylı (approved) gerçek yorumlar sitede ve şemada (Review / AggregateRating) görünür. */
export const reviews = pgTable(
  "reviews",
  {
    id: uuid().defaultRandom().primaryKey(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    customerId: uuid().references(() => customers.id, { onDelete: "set null" }),
    orderId: uuid().references(() => orders.id, { onDelete: "set null" }),
    authorName: varchar({ length: 80 }).notNull(),
    authorEmail: varchar({ length: 160 }),
    rating: integer().notNull(),
    title: varchar({ length: 140 }),
    body: text().notNull(),
    status: reviewStatus().default("pending").notNull(),
    verifiedPurchase: boolean().default(false).notNull(),
    adminReply: text(),
    ipHash: varchar({ length: 32 }),
    approvedAt: timestamp({ withTimezone: true }),
    createdAt: createdAt(),
  },
  (t) => [index("reviews_product_idx").on(t.productId, t.status)],
);

// ─────────────────────────── Favoriler ───────────────────────────

export const wishlists = pgTable(
  "wishlists",
  {
    id: uuid().defaultRandom().primaryKey(),
    tokenHash: varchar({ length: 64 }).notNull(),
    customerId: uuid().references(() => customers.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("wishlists_token_uq").on(t.tokenHash)],
);

export const wishlistItems = pgTable(
  "wishlist_items",
  {
    id: uuid().defaultRandom().primaryKey(),
    wishlistId: uuid()
      .notNull()
      .references(() => wishlists.id, { onDelete: "cascade" }),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [unique("wishlist_items_uq").on(t.wishlistId, t.productId)],
);
