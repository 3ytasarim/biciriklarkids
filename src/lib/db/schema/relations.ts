import { relations } from "drizzle-orm";
import { adminSessions, adminUsers } from "./auth";
import { categories, productImages, products, productVariants } from "./catalog";
import {
  addresses,
  cartItems,
  carts,
  coupons,
  customers,
  customerSessions,
  orderEvents,
  orderItems,
  orders,
  paymentTransactions,
  reviews,
  wishlistItems,
  wishlists,
} from "./commerce";
import { blogCategories, blogPosts, homepageSectionProducts, homepageSections, videos } from "./content";

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, { fields: [categories.parentId], references: [categories.id], relationName: "category_tree" }),
  children: many(categories, { relationName: "category_tree" }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  images: many(productImages),
  variants: many(productVariants),
  reviews: many(reviews),
  videos: many(videos),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, { fields: [productVariants.productId], references: [products.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  addresses: many(addresses),
  orders: many(orders),
  sessions: many(customerSessions),
}));

export const customerSessionsRelations = relations(customerSessions, ({ one }) => ({
  customer: one(customers, { fields: [customerSessions.customerId], references: [customers.id] }),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, { fields: [addresses.customerId], references: [customers.id] }),
}));

export const cartsRelations = relations(carts, ({ many }) => ({ items: many(cartItems) }));
export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  product: one(products, { fields: [cartItems.productId], references: [products.id] }),
  variant: one(productVariants, { fields: [cartItems.variantId], references: [productVariants.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  coupon: one(coupons, { fields: [orders.couponId], references: [coupons.id] }),
  items: many(orderItems),
  events: many(orderEvents),
  payments: many(paymentTransactions),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
}));
export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));
export const paymentTransactionsRelations = relations(paymentTransactions, ({ one }) => ({
  order: one(orders, { fields: [paymentTransactions.orderId], references: [orders.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
}));

export const wishlistsRelations = relations(wishlists, ({ many }) => ({ items: many(wishlistItems) }));
export const wishlistItemsRelations = relations(wishlistItems, ({ one }) => ({
  wishlist: one(wishlists, { fields: [wishlistItems.wishlistId], references: [wishlists.id] }),
  product: one(products, { fields: [wishlistItems.productId], references: [products.id] }),
}));

export const homepageSectionsRelations = relations(homepageSections, ({ many }) => ({
  products: many(homepageSectionProducts),
}));
export const homepageSectionProductsRelations = relations(homepageSectionProducts, ({ one }) => ({
  section: one(homepageSections, { fields: [homepageSectionProducts.sectionId], references: [homepageSections.id] }),
  product: one(products, { fields: [homepageSectionProducts.productId], references: [products.id] }),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  product: one(products, { fields: [videos.productId], references: [products.id] }),
}));

export const blogCategoriesRelations = relations(blogCategories, ({ many }) => ({ posts: many(blogPosts) }));
export const blogPostsRelations = relations(blogPosts, ({ one }) => ({
  category: one(blogCategories, { fields: [blogPosts.categoryId], references: [blogCategories.id] }),
}));

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({ sessions: many(adminSessions) }));
export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
  adminUser: one(adminUsers, { fields: [adminSessions.adminUserId], references: [adminUsers.id] }),
}));
