import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { redirects } from "@/lib/db/schema";

type Entry = { destinationPath: string; statusCode: number };

const TTL_MS = 60_000;
let cache: Map<string, Entry> | null = null;
let loadedAt = 0;
let loading: Promise<Map<string, Entry>> | null = null;

/** Karşılaştırma anahtarı: yüzde kodlaması çözülmüş, küçük harf, sondaki / atılmış ("/category/ke%C3%A7e" → "/category/keçe"). */
export function normalizePath(pathname: string): string {
  let p = pathname;
  try {
    p = decodeURIComponent(pathname);
  } catch {
    /* geçersiz kodlama → olduğu gibi */
  }
  p = p.normalize("NFC").toLocaleLowerCase("tr-TR");
  return p.length > 1 ? p.replace(/\/+$/, "") : p;
}

async function load(): Promise<Map<string, Entry>> {
  const rows = await db
    .select({ sourcePath: redirects.sourcePath, destinationPath: redirects.destinationPath, statusCode: redirects.statusCode })
    .from(redirects)
    .where(eq(redirects.isActive, true));
  return new Map(rows.map((r) => [normalizePath(r.sourcePath), { destinationPath: r.destinationPath, statusCode: r.statusCode }]));
}

/** Aktif yönlendirmeler 60 sn bellek önbelleğinde; DB hatasında son bilinen tablo kullanılır. */
export async function findRedirect(pathname: string): Promise<Entry | null> {
  if (!cache || Date.now() - loadedAt > TTL_MS) {
    loading ??= load().finally(() => (loading = null));
    try {
      cache = await loading;
      loadedAt = Date.now();
    } catch {
      if (!cache) return null;
    }
  }
  return cache.get(normalizePath(pathname)) ?? null;
}

export function invalidateRedirectCache() {
  cache = null;
}

/** Yönlendirme isabet sayacı (rapor için) — hata olursa sessizce geçilir. */
export async function countRedirectHit(pathname: string) {
  await db
    .update(redirects)
    .set({ hits: sql`${redirects.hits} + 1` })
    .where(eq(redirects.sourcePath, normalizePath(pathname)))
    .catch(() => {});
}

/**
 * Slug değiştiğinde eski URL'den yenisine 301 açar (SEO değeri korunur). Zincir oluşmasın diye eski URL'ye
 * işaret eden mevcut yönlendirmeler de yeni hedefe güncellenir; yeni URL'yi kaynak alan kayıt pasifleştirilir.
 */
export async function recordSlugChange(oldPath: string, newPath: string) {
  if (oldPath === newPath) return;
  await db.transaction(async (tx) => {
    await tx.update(redirects).set({ destinationPath: newPath }).where(eq(redirects.destinationPath, oldPath));
    await tx.update(redirects).set({ isActive: false }).where(eq(redirects.sourcePath, newPath));
    await tx
      .insert(redirects)
      .values({ sourcePath: oldPath, destinationPath: newPath, statusCode: 301, note: "Slug değişikliği (otomatik)" })
      .onConflictDoUpdate({ target: redirects.sourcePath, set: { destinationPath: newPath, statusCode: 301, isActive: true } });
  });
  invalidateRedirectCache();
}

