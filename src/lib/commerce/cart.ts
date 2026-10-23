import "server-only";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cartItems, carts, categories, coupons, productImages, products, productVariants } from "@/lib/db/schema";
import { getSiteSettings } from "@/lib/settings";
import { getCategoryTree, descendantIds } from "@/lib/catalog/queries";
import { computeTotals, type CouponRule, type Totals } from "./pricing";
import { activeCarriers, defaultCarrier, shippingRuleFor, type ShippingOption } from "./carriers";
import { ensureVisitorHash, readVisitorHash } from "./visitor";

export const MAX_LINE_QTY = 99;

export type CartLine = {
  id: string;
  productId: string;
  variantId: string | null;
  slug: string;
  name: string;
  variantLabel: string | null;
  sku: string | null;
  image: { url: string; alt: string } | null;
  categoryName: string | null;
  categoryId: string | null;
  unitPrice: number;
  compareAtPrice: number | null;
  quantity: number;
  /** Satın alınabilecek azami adet (stok takibi kapalıysa MAX_LINE_QTY). */
  maxQuantity: number;
  lineTotal: number;
  available: boolean;
  isDemo: boolean;
};

export type CartView = Totals & {
  items: CartLine[];
  count: number;
  coupon: { code: string; applied: boolean; message: string | null } | null;
  freeShippingThreshold: number | null;
  /** Aktif kargo firmaları ve bu sepet için kargo/toplam (boş → firma tanımlı değil, genel ücret). */
  shippingOptions: ShippingOption[];
  warnings: string[];
};

const EMPTY: CartView = {
  items: [],
  count: 0,
  subtotal: 0,
  discount: 0,
  shipping: 0,
  total: 0,
  freeShippingRemaining: null,
  freeShippingThreshold: null,
  couponApplied: false,
  couponMessage: null,
  coupon: null,
  shippingOptions: [],
  warnings: [],
};

async function findCartId(tokenHash: string): Promise<{ id: string; couponCode: string | null } | null> {
  const [row] = await db.select({ id: carts.id, couponCode: carts.couponCode }).from(carts).where(eq(carts.tokenHash, tokenHash)).limit(1);
  return row ?? null;
}

async function getOrCreateCart(): Promise<string> {
  const tokenHash = await ensureVisitorHash();
  const existing = await findCartId(tokenHash);
  if (existing) return existing.id;
  const [row] = await db
    .insert(carts)
    .values({ tokenHash })
    .onConflictDoUpdate({ target: carts.tokenHash, set: { updatedAt: new Date() } })
    .returning({ id: carts.id });
  return row!.id;
}

/** Kupon kuralını DB'den okur ve tarih/limit kontrolü yapar. Geçersizse { rule: null, message }. */
export async function loadCouponRule(code: string): Promise<{ rule: CouponRule | null; message: string | null; couponId: string | null }> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return { rule: null, message: null, couponId: null };
  const [c] = await db.select().from(coupons).where(eq(coupons.code, normalized)).limit(1);
  const now = new Date();
  if (!c || !c.isActive) return { rule: null, message: "Kupon kodu geçersiz.", couponId: null };
  if (c.startsAt && c.startsAt > now) return { rule: null, message: "Bu kupon henüz başlamadı.", couponId: null };
  if (c.endsAt && c.endsAt < now) return { rule: null, message: "Bu kuponun süresi doldu.", couponId: null };
  if (c.usageLimit != null && c.usedCount >= c.usageLimit) return { rule: null, message: "Bu kuponun kullanım limiti doldu.", couponId: null };
  let categoryIds: string[] | null = null;
  if (c.categoryId) {
    const tree = await getCategoryTree();
    const node = tree.byId.get(c.categoryId);
    categoryIds = node ? descendantIds(node) : [c.categoryId];
  }
  return {
    rule: { code: c.code, type: c.type, value: c.value, minOrderAmount: c.minOrderAmount, maxDiscountAmount: c.maxDiscountAmount, categoryIds },
    message: null,
    couponId: c.id,
  };
}

/** Sepet satırlarını güncel ürün verisiyle birleştirir (fiyat her zaman DB'den). */
export async function loadCartLines(cartId: string): Promise<CartLine[]> {
  const rows = await db
    .select({
      id: cartItems.id,
      productId: cartItems.productId,
      variantId: cartItems.variantId,
      quantity: cartItems.quantity,
      slug: products.slug,
      name: products.name,
      sku: products.sku,
      price: products.price,
      compareAtPrice: products.compareAtPrice,
      stock: products.stock,
      trackStock: products.trackStock,
      status: products.status,
      isDemo: products.isDemo,
      categoryId: products.categoryId,
      categoryName: categories.name,
      variantName: productVariants.name,
      variantValue: productVariants.value,
      variantSku: productVariants.sku,
      variantStock: productVariants.stock,
      priceAdjustment: productVariants.priceAdjustment,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(productVariants, eq(cartItems.variantId, productVariants.id))
    .where(eq(cartItems.cartId, cartId))
    .orderBy(asc(cartItems.createdAt));
  if (!rows.length) return [];

  const imgs = await db
    .select({ productId: productImages.productId, url: productImages.imageUrl, alt: productImages.alt })
    .from(productImages)
    .where(inArray(productImages.productId, [...new Set(rows.map((r) => r.productId))]))
    .orderBy(desc(productImages.isPrimary), asc(productImages.sortOrder));
  const firstImg = new Map<string, { url: string; alt: string }>();
  for (const i of imgs) if (!firstImg.has(i.productId)) firstImg.set(i.productId, { url: i.url, alt: i.alt });

  return rows.map((r) => {
    const unitPrice = Math.round((r.price + (r.priceAdjustment ?? 0)) * 100) / 100;
    const stock = r.variantId ? (r.variantStock ?? 0) : r.stock;
    const maxQuantity = r.trackStock ? Math.max(0, Math.min(stock, MAX_LINE_QTY)) : MAX_LINE_QTY;
    const available = r.status === "active" && maxQuantity > 0 && unitPrice > 0;
    const quantity = Math.min(r.quantity, Math.max(maxQuantity, 1));
    return {
      id: r.id,
      productId: r.productId,
      variantId: r.variantId,
      slug: r.slug,
      name: r.name,
      variantLabel: r.variantName && r.variantValue ? `${r.variantName}: ${r.variantValue}` : null,
      sku: r.variantSku || r.sku,
      image: firstImg.get(r.productId) ?? null,
      categoryName: r.categoryName,
      categoryId: r.categoryId,
      unitPrice,
      compareAtPrice: r.compareAtPrice,
      quantity,
      maxQuantity,
      lineTotal: Math.round(unitPrice * quantity * 100) / 100,
      available,
      isDemo: r.isDemo,
    };
  });
}

export async function buildCartView(cartId: string, couponCode: string | null): Promise<CartView> {
  const [lines, settings] = await Promise.all([loadCartLines(cartId), getSiteSettings()]);
  const sellable = lines.filter((l) => l.available);
  const coupon = couponCode ? await loadCouponRule(couponCode) : null;
  const priced = sellable.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity, categoryId: l.categoryId }));
  // Özet: en ucuz aktif firma (yoksa genel sabit ücret); ödeme adımında müşteri firmayı seçer.
  const base = defaultCarrier(settings.shipping);
  const totals = computeTotals(priced, shippingRuleFor(settings.shipping, base), coupon?.rule ?? null);
  const shippingOptions: ShippingOption[] = activeCarriers(settings.shipping).map((c) => {
    const t = computeTotals(priced, shippingRuleFor(settings.shipping, c), coupon?.rule ?? null);
    return { id: c.id, brand: c.brand, name: c.name, note: c.note, logoUrl: c.logoUrl, shipping: t.shipping ?? 0, total: t.total };
  });
  const warnings: string[] = [];
  if (lines.some((l) => !l.available)) warnings.push("Sepetinizdeki bazı ürünler şu anda satışta değil; ödeme adımında hesaba katılmaz.");
  return {
    ...totals,
    items: lines,
    count: sellable.reduce((s, l) => s + l.quantity, 0),
    coupon: couponCode ? { code: couponCode, applied: totals.couponApplied, message: coupon?.message ?? totals.couponMessage } : null,
    freeShippingThreshold: base?.freeThreshold ?? settings.shipping.freeThreshold,
    shippingOptions,
    warnings,
  };
}

export async function getCurrentCart(): Promise<CartView> {
  const tokenHash = await readVisitorHash();
  if (!tokenHash) return EMPTY;
  const cart = await findCartId(tokenHash);
  if (!cart) return EMPTY;
  return buildCartView(cart.id, cart.couponCode);
}

/** Sepete ekler (aynı ürün/varyant varsa adedi artırır). Stok sınırı sunucuda uygulanır. */
export async function addToCart(productId: string, variantId: string | null, quantity: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const [p] = await db
    .select({ id: products.id, status: products.status, stock: products.stock, trackStock: products.trackStock, price: products.price })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);
  if (!p || p.status !== "active") return { ok: false, error: "Ürün satışta değil." };
  if (p.price <= 0) return { ok: false, error: "Bu ürünün fiyatı henüz belirlenmedi." };
  let stock = p.stock;
  if (variantId) {
    const [v] = await db.select({ stock: productVariants.stock }).from(productVariants).where(and(eq(productVariants.id, variantId), eq(productVariants.productId, productId))).limit(1);
    if (!v) return { ok: false, error: "Seçenek bulunamadı." };
    stock = v.stock;
  }
  const limit = p.trackStock ? Math.min(stock, MAX_LINE_QTY) : MAX_LINE_QTY;
  if (limit <= 0) return { ok: false, error: "Bu ürün şu anda stokta yok." };

  const cartId = await getOrCreateCart();
  const qty = Math.max(1, Math.min(Math.floor(quantity), MAX_LINE_QTY));
  await db
    .insert(cartItems)
    .values({ cartId, productId, variantId, quantity: Math.min(qty, limit) })
    .onConflictDoUpdate({
      target: [cartItems.cartId, cartItems.productId, cartItems.variantId],
      set: { quantity: sql`least(${cartItems.quantity} + ${qty}, ${limit})`, updatedAt: new Date() },
    });
  await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
  return { ok: true };
}

async function currentCartId(): Promise<{ id: string; couponCode: string | null } | null> {
  const tokenHash = await readVisitorHash();
  return tokenHash ? findCartId(tokenHash) : null;
}

export async function updateCartLine(lineId: string, quantity: number) {
  const cart = await currentCartId();
  if (!cart) return;
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.id, lineId), eq(cartItems.cartId, cart.id)));
    return;
  }
  await db
    .update(cartItems)
    .set({ quantity: Math.min(Math.floor(quantity), MAX_LINE_QTY) })
    .where(and(eq(cartItems.id, lineId), eq(cartItems.cartId, cart.id)));
}

export async function setCartCoupon(code: string | null): Promise<{ ok: boolean; message: string | null }> {
  const cart = await currentCartId();
  if (!cart) return { ok: false, message: "Sepetiniz boş." };
  if (code) {
    const { rule, message } = await loadCouponRule(code);
    if (!rule) return { ok: false, message };
  }
  await db.update(carts).set({ couponCode: code ? code.trim().toUpperCase() : null }).where(eq(carts.id, cart.id));
  return { ok: true, message: null };
}

export async function getCartForCheckout() {
  const cart = await currentCartId();
  if (!cart) return null;
  return { cartId: cart.id, view: await buildCartView(cart.id, cart.couponCode) };
}

export async function clearCart(cartId: string) {
  await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
  await db.update(carts).set({ couponCode: null }).where(eq(carts.id, cartId));
}
