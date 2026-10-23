"use server";

import { revalidatePath } from "next/cache";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { storage } from "@/lib/storage";
import { uploadImage, uploadVideo, UploadError } from "@/lib/upload";

export type MediaItem = { id: string; url: string; alt: string | null; width: number | null; height: number | null; originalName: string; size: number; mimeType: string };
type R<T> = { ok: true; data: T } | { ok: false; error: string };

const toItem = (m: typeof media.$inferSelect): MediaItem => ({ id: m.id, url: m.url, alt: m.alt, width: m.width, height: m.height, originalName: m.originalName ?? m.filename, size: m.size, mimeType: m.mimeType });

/** Tüm görsel alanlarının (ürün galerisi, kategori, banner, blog, editör…) tek merkezî yükleme noktası. */
export async function uploadImageAction(formData: FormData): Promise<R<MediaItem>> {
  await requireAdmin();
  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();
  const nameHint = String(formData.get("nameHint") ?? "").trim();
  try {
    if (!(file instanceof File)) throw new UploadError("Dosya seçilmedi.");
    const row = await uploadImage(file, { alt: alt || undefined, nameHint: nameHint || undefined });
    revalidatePath("/admin/medya");
    return { ok: true, data: toItem(row) };
  } catch (e) {
    return { ok: false, error: e instanceof UploadError ? e.message : "Görsel yüklenemedi. Lütfen tekrar deneyin." };
  }
}

export async function uploadVideoAction(formData: FormData): Promise<R<MediaItem>> {
  await requireAdmin();
  const file = formData.get("file");
  const nameHint = String(formData.get("nameHint") ?? "").trim();
  try {
    if (!(file instanceof File)) throw new UploadError("Dosya seçilmedi.");
    const row = await uploadVideo(file, nameHint || "video");
    revalidatePath("/admin/medya");
    return { ok: true, data: toItem(row) };
  } catch (e) {
    return { ok: false, error: e instanceof UploadError ? e.message : "Video yüklenemedi." };
  }
}

export async function listMediaAction(query = "", page = 1): Promise<{ items: MediaItem[]; hasMore: boolean }> {
  await requireAdmin();
  const take = 36;
  const q = query.trim().slice(0, 80);
  const rows = await db
    .select()
    .from(media)
    .where(q ? or(ilike(media.originalName, `%${q}%`), ilike(media.alt, `%${q}%`), ilike(media.filename, `%${q}%`)) : sql`${media.mimeType} like 'image/%'`)
    .orderBy(desc(media.createdAt))
    .limit(take + 1)
    .offset((Math.max(1, page) - 1) * take);
  return { items: rows.slice(0, take).map(toItem), hasMore: rows.length > take };
}

export async function updateMediaAltAction(id: string, alt: string): Promise<R<null>> {
  await requireAdmin();
  await db.update(media).set({ alt: alt.trim().slice(0, 250) || null }).where(eq(media.id, id));
  revalidatePath("/admin/medya");
  return { ok: true, data: null };
}

/** Görselin kullanıldığı yerler (silmeden önce kontrol). */
async function findMediaUsage(url: string): Promise<string[]> {
  const like = `%${url}%`;
  const res = await db.execute<{ where: string }>(sql`
    select 'Ürün galerisi' as "where" from product_images where image_url = ${url}
    union all select 'Kategori' from categories where image = ${url} or og_image = ${url}
    union all select 'Banner' from banners where image_url = ${url} or mobile_image_url = ${url}
    union all select 'Blog' from blog_posts where cover_image = ${url} or og_image = ${url} or content like ${like}
    union all select 'Sayfa' from pages where content like ${like} or og_image = ${url}
    union all select 'Video' from videos where desktop_url = ${url} or mobile_url = ${url} or poster_url = ${url} or mobile_poster_url = ${url}
    union all select 'Site ayarları' from site_settings where value::text like ${like}
    limit 5`);
  return [...new Set(res.rows.map((r) => r.where))];
}

export async function deleteMediaAction(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  await requireAdmin("admin");
  const [m] = await db.select().from(media).where(eq(media.id, id)).limit(1);
  if (!m) return { ok: false, error: "Dosya bulunamadı." };
  const usage = await findMediaUsage(m.url);
  if (usage.length) return { ok: false, error: `Bu dosya kullanımda: ${usage.join(", ")}. Önce ilgili içerikten kaldırın.` };
  await db.delete(media).where(eq(media.id, id));
  await storage.remove(m.storageKey);
  revalidatePath("/admin/medya");
  return { ok: true };
}
