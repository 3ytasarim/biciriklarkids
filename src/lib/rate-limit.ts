import "server-only";
import { and, count, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { rateLimitEvents } from "@/lib/db/schema";

/**
 * DB tabanlı basit kayan pencere rate limit (tek sunucu/serverless fark etmez).
 * Yüksek trafikte Redis/Upstash'e taşınabilir; arayüz aynı kalır.
 */
export async function isRateLimited(keys: string[], max: number, windowMs: number): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);
  const counts = await Promise.all(
    keys.map((key) =>
      db
        .select({ n: count() })
        .from(rateLimitEvents)
        .where(and(eq(rateLimitEvents.key, key), gte(rateLimitEvents.createdAt, since)))
        .then((r) => Number(r[0]?.n ?? 0)),
    ),
  );
  return counts.some((c) => c >= max);
}

export async function hitRateLimit(keys: string[]) {
  if (!keys.length) return;
  await db.insert(rateLimitEvents).values(keys.map((key) => ({ key })));
  // Tablo büyümesin: 2 günden eski kayıtları ara sıra temizle.
  if (Math.random() < 0.05) await db.delete(rateLimitEvents).where(lt(rateLimitEvents.createdAt, new Date(Date.now() - 2 * 86_400_000)));
}

export async function clearRateLimit(keys: string[]) {
  if (keys.length) await db.delete(rateLimitEvents).where(inArray(rateLimitEvents.key, keys));
}

/** Kontrol + kayıt tek adımda: sınır aşıldıysa true döner (kayıt eklenmez). */
export async function consumeRateLimit(keys: string[], max: number, windowMs: number): Promise<boolean> {
  if (await isRateLimited(keys, max, windowMs)) return true;
  await hitRateLimit(keys);
  return false;
}
