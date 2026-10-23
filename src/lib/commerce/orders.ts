import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { cartItems, coupons, orderEvents, orderItems, orders, paymentTransactions, products, productVariants, type AddressSnapshot, type BillingSnapshot } from "@/lib/db/schema";
import { computeTotals } from "./pricing";
import { activeCarriers, findCarrier, shippingRuleFor } from "./carriers";
import { loadCartLines, loadCouponRule } from "./cart";
import type { SiteSettings } from "@/lib/settings";

export { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, type OrderStatus, type PaymentStatus } from "./order-labels";

export const hashOrderToken = (t: string) => createHash("sha256").update(t).digest("hex");

export class OrderError extends Error {}

type CreateInput = {
  cartId: string;
  couponCode: string | null;
  customerId: string | null;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  shipping: AddressSnapshot;
  billing: BillingSnapshot;
  note: string | null;
  paymentProvider: string;
  /** Ödeme adımında seçilen kargo firması (aktif firma tanımlıysa zorunlu). */
  carrierId: string | null;
  ipHash: string;
  settings: SiteSettings;
};

/**
 * Sepetten sipariş oluşturur — tek transaction:
 * 1) ürün satırları FOR UPDATE ile kilitlenir, stok tekrar kontrol edilir (yarış durumu yok)
 * 2) fiyatlar ve toplamlar sunucuda DB'den yeniden hesaplanır (istemci tutarına güvenilmez)
 * 3) stok düşülür, kupon kullanımı artırılır, sipariş + satırlar + ilk olay yazılır, sepet boşaltılır
 */
export async function createOrderFromCart(input: CreateInput) {
  const lines = (await loadCartLines(input.cartId)).filter((l) => l.available);
  if (!lines.length) throw new OrderError("Sepetinizde satın alınabilir ürün yok.");

  const coupon = input.couponCode ? await loadCouponRule(input.couponCode) : null;
  // Kargo: aktif firma tanımlıysa müşterinin seçtiği firma zorunlu; ücret sunucuda o firmaya göre hesaplanır
  const carrier = findCarrier(input.settings.shipping, input.carrierId);
  if (activeCarriers(input.settings.shipping).length && !carrier) throw new OrderError("Lütfen bir kargo firması seçin.");
  const totals = computeTotals(
    lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity, categoryId: l.categoryId })),
    shippingRuleFor(input.settings.shipping, carrier),
    coupon?.rule ?? null,
  );
  const token = randomBytes(24).toString("base64url");

  const order = await db.transaction(async (tx) => {
    // Stok kilidi + kontrol
    const productIds = [...new Set(lines.map((l) => l.productId))];
    const locked = await tx
      .select({ id: products.id, stock: products.stock, trackStock: products.trackStock, status: products.status, name: products.name, price: products.price })
      .from(products)
      .where(inArray(products.id, productIds))
      .for("update");
    const byId = new Map(locked.map((p) => [p.id, p]));
    const variantIds = lines.map((l) => l.variantId).filter((v): v is string => Boolean(v));
    const lockedVariants = variantIds.length
      ? await tx.select({ id: productVariants.id, stock: productVariants.stock }).from(productVariants).where(inArray(productVariants.id, variantIds)).for("update")
      : [];
    const variantStock = new Map(lockedVariants.map((v) => [v.id, v.stock]));

    for (const l of lines) {
      const p = byId.get(l.productId);
      if (!p || p.status !== "active") throw new OrderError(`"${l.name}" artık satışta değil.`);
      if (p.price <= 0) throw new OrderError(`"${l.name}" için fiyat henüz belirlenmedi; sepetten çıkarın.`);
      if (p.trackStock) {
        const available = l.variantId ? (variantStock.get(l.variantId) ?? 0) : p.stock;
        if (available < l.quantity) throw new OrderError(`"${l.name}" için stokta yalnızca ${available} adet kaldı. Lütfen sepetinizi güncelleyin.`);
      }
    }

    const [{ seq }] = (await tx.execute(sql`select nextval(pg_get_serial_sequence('orders', 'seq'))::int as seq`)).rows as { seq: number }[];
    const orderNumber = `BK${new Date().getFullYear().toString().slice(2)}${String(seq).padStart(5, "0")}`;

    const [created] = await tx
      .insert(orders)
      .values({
        orderNumber,
        seq,
        accessTokenHash: hashOrderToken(token),
        customerId: input.customerId,
        email: input.email,
        phone: input.phone,
        firstName: input.firstName,
        lastName: input.lastName,
        shippingAddress: input.shipping,
        billingAddress: input.billing,
        note: input.note,
        status: "pending",
        paymentStatus: "pending",
        paymentProvider: input.paymentProvider,
        subtotal: totals.subtotal,
        discountTotal: totals.discount,
        shippingTotal: totals.shipping ?? 0,
        grandTotal: totals.total,
        couponId: totals.couponApplied ? coupon?.couponId ?? null : null,
        couponCode: totals.couponApplied ? coupon?.rule?.code ?? null : null,
        carrier: carrier?.name ?? null,
        termsAcceptedAt: new Date(),
        ipHash: input.ipHash,
      })
      .returning();

    await tx.insert(orderItems).values(
      lines.map((l) => ({
        orderId: created!.id,
        productId: l.productId,
        variantId: l.variantId,
        name: l.name,
        variantLabel: l.variantLabel,
        sku: l.sku,
        slug: l.slug,
        imageUrl: l.image?.url ?? null,
        categoryName: l.categoryName,
        unitPrice: l.unitPrice,
        compareAtPrice: l.compareAtPrice,
        quantity: l.quantity,
        lineTotal: l.lineTotal,
      })),
    );

    for (const l of lines) {
      const p = byId.get(l.productId)!;
      if (p.trackStock) {
        if (l.variantId) await tx.update(productVariants).set({ stock: sql`${productVariants.stock} - ${l.quantity}` }).where(eq(productVariants.id, l.variantId));
        else await tx.update(products).set({ stock: sql`${products.stock} - ${l.quantity}` }).where(eq(products.id, l.productId));
      }
      await tx.update(products).set({ salesCount: sql`${products.salesCount} + ${l.quantity}` }).where(eq(products.id, l.productId));
    }

    if (totals.couponApplied && coupon?.couponId) {
      await tx.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.id, coupon.couponId));
    }

    await tx.insert(orderEvents).values({ orderId: created!.id, type: "created", toStatus: "pending", message: "Sipariş oluşturuldu.", isPublic: true, actor: "Müşteri" });
    if (totals.shipping == null) {
      // İç not (müşteriye görünmez): kargo ücreti ayarlanmadan alınan sipariş.
      await tx.insert(orderEvents).values({ orderId: created!.id, type: "note", message: "Kargo ücreti ayarlarda tanımlı değil; toplam tutara kargo eklenmedi. Müşteriye bildirilmeli.", isPublic: false, actor: "Sistem" });
    }

    await tx.delete(cartItems).where(eq(cartItems.cartId, input.cartId));
    return created!;
  });

  return { order, token, lines, totals };
}

/** Sağlayıcı başlatma sonucuna göre ödeme durumunu günceller ve kaydı tutar. */
export async function recordPaymentInit(orderId: string, provider: string, amount: number, paymentStatus: "pending" | "awaiting_transfer") {
  await db.update(orders).set({ paymentStatus }).where(eq(orders.id, orderId));
  await db.insert(paymentTransactions).values({ orderId, provider, amount, status: paymentStatus });
}

/**
 * Ödemeyi "ödendi" yapar — YALNIZCA doğrulanmış sağlayıcı geri çağrısı veya admin (havale kontrolü) tarafından.
 * İdempotent: zaten ödenmişse tekrar işlem yapmaz.
 */
export async function markOrderPaid(orderId: string, opts: { provider: string; reference?: string | null; amount: number; actor: string; raw?: unknown }) {
  return db.transaction(async (tx) => {
    const [o] = await tx.select({ paymentStatus: orders.paymentStatus, status: orders.status }).from(orders).where(eq(orders.id, orderId)).for("update");
    if (!o || o.paymentStatus === "paid") return false;
    await tx
      .update(orders)
      .set({ paymentStatus: "paid", paidAt: new Date(), status: o.status === "pending" ? "confirmed" : o.status })
      .where(eq(orders.id, orderId));
    await tx.insert(paymentTransactions).values({ orderId, provider: opts.provider, providerReference: opts.reference ?? null, amount: opts.amount, status: "paid", raw: opts.raw ?? null });
    await tx.insert(orderEvents).values({ orderId, type: "payment", fromStatus: o.paymentStatus, toStatus: "paid", message: "Ödeme alındı.", isPublic: true, actor: opts.actor });
    return true;
  });
}

/**
 * Siparişi iptal ederken stok iadesi (yalnızca stok takipli ürünler). Satış sayacı da geri alınır.
 */
export async function restockOrder(orderId: string) {
  await db.transaction(async (tx) => {
    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const it of items) {
      if (!it.productId) continue;
      const [p] = await tx.select({ trackStock: products.trackStock }).from(products).where(eq(products.id, it.productId));
      if (p?.trackStock) {
        if (it.variantId) await tx.update(productVariants).set({ stock: sql`${productVariants.stock} + ${it.quantity}` }).where(eq(productVariants.id, it.variantId));
        else await tx.update(products).set({ stock: sql`${products.stock} + ${it.quantity}` }).where(eq(products.id, it.productId));
      }
      await tx.update(products).set({ salesCount: sql`greatest(${products.salesCount} - ${it.quantity}, 0)` }).where(eq(products.id, it.productId));
    }
  });
}

/** Onay sayfası: sipariş numarası + erişim anahtarı (misafir) veya oturumdaki müşteri. */
export async function getOrderForViewer(orderNumber: string, opts: { token?: string | null; customerId?: string | null }) {
  const [o] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  if (!o) return null;
  const tokenOk = opts.token ? hashOrderToken(opts.token) === o.accessTokenHash : false;
  const ownerOk = Boolean(opts.customerId && o.customerId === opts.customerId);
  if (!tokenOk && !ownerOk) return null;
  const [items, events] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, o.id)),
    db.select().from(orderEvents).where(and(eq(orderEvents.orderId, o.id), eq(orderEvents.isPublic, true))).orderBy(orderEvents.createdAt),
  ]);
  return { order: o, items, events };
}

/** Sipariş takibi: sipariş no + e-posta eşleşmesi (misafir). Yalnızca herkese açık olaylar döner. */
export async function trackOrder(orderNumber: string, email: string) {
  const [o] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber.trim().toUpperCase()), eq(orders.email, email.trim().toLowerCase())))
    .limit(1);
  if (!o) return null;
  const events = await db.select().from(orderEvents).where(and(eq(orderEvents.orderId, o.id), eq(orderEvents.isPublic, true))).orderBy(orderEvents.createdAt);
  return { order: o, events };
}

