"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { orderEvents, orders } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { formObject, isUuid, optional, zodErrors, type ActionState } from "@/lib/admin/form";
import { markOrderPaid, ORDER_STATUS_LABELS, restockOrder, type OrderStatus } from "@/lib/commerce/orders";
import { revalidateSite } from "@/lib/admin/revalidate";
import { after } from "next/server";
import { sendOrderEmail } from "@/lib/mail/order-emails";
import type { MailEvent } from "@/lib/mail/templates";

const STATUSES = Object.keys(ORDER_STATUS_LABELS) as [OrderStatus, ...OrderStatus[]];

const schema = z.object({
  status: z.enum(STATUSES),
  carrier: optional(60),
  trackingNumber: optional(80),
  message: optional(1000),
  isPublic: z.literal("on").optional(),
});

/** Durum değişikliği + kargo bilgisi + zaman çizelgesi kaydı. İptal/iadede stok geri eklenir. */
export async function updateOrderAction(id: string, _prev: ActionState, fd: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  if (!isUuid(id)) return { status: "error", message: "Geçersiz sipariş." };
  const parsed = schema.safeParse(formObject(fd));
  if (!parsed.success) return zodErrors(parsed.error);
  const d = parsed.data;
  const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!o) return { status: "error", message: "Sipariş bulunamadı." };

  const statusChanged = d.status !== o.status;
  const wasActive = !["cancelled", "refunded"].includes(o.status);
  const nowInactive = ["cancelled", "refunded"].includes(d.status);
  const now = new Date();

  await db
    .update(orders)
    .set({
      status: d.status,
      carrier: d.carrier,
      trackingNumber: d.trackingNumber,
      ...(statusChanged && d.status === "shipped" ? { shippedAt: now } : {}),
      ...(statusChanged && d.status === "delivered" ? { deliveredAt: now } : {}),
      ...(statusChanged && d.status === "cancelled" ? { cancelledAt: now } : {}),
      // Ödeme durumu sipariş durumuyla uyumlu: ödenmemiş iptal → ödeme iptal; ödenmiş + iade → ödeme iade
      ...(statusChanged && d.status === "cancelled" && o.paymentStatus !== "paid" ? { paymentStatus: "cancelled" as const } : {}),
      ...(statusChanged && d.status === "refunded" && o.paymentStatus === "paid" ? { paymentStatus: "refunded" as const } : {}),
    })
    .where(eq(orders.id, id));

  if (statusChanged && wasActive && nowInactive) await restockOrder(id);

  const trackingChanged = (d.trackingNumber ?? null) !== (o.trackingNumber ?? null);
  if (statusChanged || d.message || trackingChanged) {
    const defaultMsg = statusChanged ? `Sipariş durumu: ${ORDER_STATUS_LABELS[d.status]}.` : trackingChanged ? "Kargo takip bilgisi güncellendi." : null;
    await db.insert(orderEvents).values({
      orderId: id,
      type: statusChanged ? "status" : trackingChanged ? "shipment" : "note",
      fromStatus: statusChanged ? o.status : null,
      toStatus: statusChanged ? d.status : null,
      message: [defaultMsg, d.message].filter(Boolean).join(" "),
      // Durum değişikliği müşteriye görünür; yalnızca not ise işarete göre.
      isPublic: statusChanged || trackingChanged || d.isPublic === "on",
      actor: admin.name,
    });
  }
  if (statusChanged) {
    const event: MailEvent | null =
      d.status === "shipped" ? "order_shipped" : d.status === "delivered" ? "order_delivered" : d.status === "cancelled" || d.status === "refunded" ? "order_cancelled" : d.status === "confirmed" || d.status === "processing" ? "order_status" : null;
    if (event) after(() => sendOrderEmail(event, id));
  }

  revalidatePath(`/admin/siparisler/${id}`);
  if (statusChanged && nowInactive) revalidateSite();
  return { status: "success", message: "Sipariş güncellendi." };
}

/** Havale/EFT kontrolü sonrası admin onayı — tek "ödendi" giriş noktası (markOrderPaid, idempotent). */
export async function markPaidAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin("admin");
  const [o] = await db.select({ grandTotal: orders.grandTotal, paymentProvider: orders.paymentProvider }).from(orders).where(eq(orders.id, id)).limit(1);
  if (!o) return { ok: false, error: "Sipariş bulunamadı." };
  const changed = await markOrderPaid(id, { provider: o.paymentProvider, amount: o.grandTotal, actor: admin.name, reference: "admin-onay" });
  if (changed) after(() => sendOrderEmail("payment_confirmed", id));
  revalidatePath(`/admin/siparisler/${id}`);
  return changed ? { ok: true } : { ok: false, error: "Sipariş zaten ödenmiş görünüyor." };
}

/**
 * Listeden tek tıkla iptal: durum "İptal edildi", stok iadesi, zaman çizelgesi kaydı ve müşteriye iptal
 * e-postası. Kartla ödenmiş siparişin para iadesi ayrıca iyzico panelinden yapılmalıdır (burada para hareketi yok).
 */
export async function cancelOrderAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireAdmin();
  if (!isUuid(id)) return { ok: false, error: "Geçersiz sipariş." };
  const [o] = await db.select({ status: orders.status, orderNumber: orders.orderNumber, paymentStatus: orders.paymentStatus }).from(orders).where(eq(orders.id, id)).limit(1);
  if (!o) return { ok: false, error: "Sipariş bulunamadı." };
  if (o.status === "cancelled" || o.status === "refunded") return { ok: false, error: "Sipariş zaten iptal/iade edilmiş." };
  if (o.status === "shipped" || o.status === "delivered") return { ok: false, error: "Kargoya verilmiş/teslim edilmiş sipariş listeden iptal edilemez; sipariş detayından “İade edildi” durumunu kullanın." };

  // Ödeme alınmamışsa ödeme de iptal; alınmışsa "Ödendi" kalır (iade iyzico panelinden, sonra "İade edildi").
  await db
    .update(orders)
    .set({ status: "cancelled", cancelledAt: new Date(), ...(o.paymentStatus !== "paid" ? { paymentStatus: "cancelled" as const } : {}) })
    .where(eq(orders.id, id));
  await restockOrder(id);
  await db.insert(orderEvents).values({ orderId: id, type: "status", fromStatus: o.status, toStatus: "cancelled", message: `Sipariş durumu: ${ORDER_STATUS_LABELS.cancelled}.`, isPublic: true, actor: admin.name });
  after(() => sendOrderEmail("order_cancelled", id));

  revalidatePath("/admin/siparisler");
  revalidatePath(`/admin/siparisler/${id}`);
  revalidateSite();
  return { ok: true };
}
