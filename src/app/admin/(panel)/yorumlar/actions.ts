"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders, reviews } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { revalidateSite } from "@/lib/admin/revalidate";
import type { Result } from "@/lib/admin/form";

/**
 * Onay: yorum yayına girer. "Doğrulanmış alışveriş" yalnızca aynı e-postayla bu ürünü içeren ödenmiş bir
 * sipariş varsa işaretlenir.
 */
export async function setReviewStatusAction(id: string, status: "approved" | "rejected" | "pending"): Promise<Result> {
  await requireAdmin();
  const [r] = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  if (!r) return { ok: false, error: "Yorum bulunamadı." };
  let verified = false;
  if (status === "approved" && r.authorEmail) {
    const [hit] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(orders)
      .innerJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.email, r.authorEmail), eq(orderItems.productId, r.productId), eq(orders.paymentStatus, "paid")));
    verified = (hit?.n ?? 0) > 0;
  }
  await db
    .update(reviews)
    .set({ status, approvedAt: status === "approved" ? new Date() : null, verifiedPurchase: status === "approved" ? verified : r.verifiedPurchase })
    .where(eq(reviews.id, id));
  revalidateSite();
  return { ok: true };
}

export async function replyReviewAction(id: string, fd: FormData) {
  await requireAdmin();
  const reply = String(fd.get("reply") ?? "")
    .trim()
    .slice(0, 2000);
  await db.update(reviews).set({ adminReply: reply || null }).where(eq(reviews.id, id));
  revalidatePath("/admin/yorumlar");
  revalidateSite();
}

export async function deleteReviewAction(id: string): Promise<Result> {
  await requireAdmin("admin");
  await db.delete(reviews).where(eq(reviews.id, id));
  revalidateSite();
  return { ok: true };
}
