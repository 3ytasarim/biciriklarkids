import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, wishlistItems, wishlists } from "@/lib/db/schema";
import { ensureVisitorHash, readVisitorHash } from "./visitor";

async function findWishlist(tokenHash: string) {
  const [row] = await db.select({ id: wishlists.id }).from(wishlists).where(eq(wishlists.tokenHash, tokenHash)).limit(1);
  return row?.id ?? null;
}

export async function getWishlistProductIds(): Promise<string[]> {
  const tokenHash = await readVisitorHash();
  if (!tokenHash) return [];
  const id = await findWishlist(tokenHash);
  if (!id) return [];
  const rows = await db
    .select({ productId: wishlistItems.productId })
    .from(wishlistItems)
    .innerJoin(products, eq(products.id, wishlistItems.productId))
    .where(and(eq(wishlistItems.wishlistId, id), eq(products.status, "active")))
    .orderBy(desc(wishlistItems.createdAt));
  return rows.map((r) => r.productId);
}

export async function toggleWishlist(productId: string): Promise<{ saved: boolean }> {
  const tokenHash = await ensureVisitorHash();
  let id = await findWishlist(tokenHash);
  if (!id) {
    const [row] = await db.insert(wishlists).values({ tokenHash }).onConflictDoUpdate({ target: wishlists.tokenHash, set: { updatedAt: new Date() } }).returning({ id: wishlists.id });
    id = row!.id;
  }
  const deleted = await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.wishlistId, id), eq(wishlistItems.productId, productId)))
    .returning({ id: wishlistItems.id });
  if (deleted.length) return { saved: false };
  const [p] = await db.select({ id: products.id }).from(products).where(and(eq(products.id, productId), eq(products.status, "active"))).limit(1);
  if (!p) return { saved: false };
  await db.insert(wishlistItems).values({ wishlistId: id, productId }).onConflictDoNothing();
  return { saved: true };
}
