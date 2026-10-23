import "server-only";
import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/lib/db";
import { media } from "@/lib/db/schema";
import { slugify } from "@/lib/slug";
import { storage } from "@/lib/storage";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

/** SVG bilinçli olarak YOK: içinde script taşıyabilir (XSS). */
const IMAGE_TYPES: Record<string, { exts: string[]; format: string }> = {
  "image/jpeg": { exts: ["jpg", "jpeg"], format: "jpeg" },
  "image/png": { exts: ["png"], format: "png" },
  "image/webp": { exts: ["webp"], format: "webp" },
  "image/avif": { exts: ["avif"], format: "heif" },
};
const VIDEO_TYPES: Record<string, string[]> = { "video/mp4": ["mp4"], "video/webm": ["webm"] };

export class UploadError extends Error {}
export type MediaRow = typeof media.$inferSelect;

const extensionOf = (name: string) => name.split(".").pop()?.toLowerCase() ?? "";

/**
 * Google Görseller için açıklayıcı, kalıcı dosya adı: "2026/10/avokado-figurlu-kece-canta-dikis-kiti.webp".
 * Aynı ad varsa -2, -3… eklenir (dosyalar asla üzerine yazılmaz → URL'ler kalıcı).
 */
async function putUnique(baseName: string, ext: string, data: Buffer): Promise<{ key: string; url: string }> {
  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const name = slugify(baseName).slice(0, 80) || "gorsel";
  for (let i = 1; i < 200; i++) {
    const key = `${folder}/${name}${i > 1 ? `-${i}` : ""}.${ext}`;
    try {
      return await storage.put(key, data);
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    }
  }
  throw new UploadError("Dosya adı üretilemedi.");
}

/**
 * Görsel yükler ve media kaydı oluşturur. Kontroller: boyut, MIME whitelist, uzantı-MIME uyumu, gerçek içerik
 * (sharp başlığı okuyabilmeli ve biçim MIME ile eşleşmeli). Yeniden ENCODE EDİLMEZ (kalite kaybı yok);
 * gerçek genişlik/yükseklik okunur (CLS önleme + image SEO). Optimizasyon next/image tarafında yapılır.
 */
export async function uploadImage(file: File, opts: { alt?: string; nameHint?: string } = {}): Promise<MediaRow> {
  if (!(file instanceof File) || file.size === 0) throw new UploadError("Dosya seçilmedi.");
  if (file.size > MAX_IMAGE_BYTES) throw new UploadError("Görsel en fazla 10 MB olabilir.");
  const type = IMAGE_TYPES[file.type];
  const ext = extensionOf(file.name);
  if (!type || !type.exts.includes(ext)) throw new UploadError("Yalnızca JPG, PNG, WebP veya AVIF görseller yüklenebilir.");

  const data = Buffer.from(await file.arrayBuffer());
  let meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>;
  try {
    meta = await sharp(data).metadata();
  } catch {
    throw new UploadError("Dosya geçerli bir görsel değil.");
  }
  if (!meta.width || !meta.height || meta.format !== type.format) throw new UploadError("Dosya içeriği uzantısıyla uyuşmuyor.");
  const rotated = meta.orientation !== undefined && meta.orientation >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;

  const baseName = opts.nameHint || opts.alt || file.name.replace(/\.[^.]+$/, "");
  const { key, url } = await putUnique(baseName, ext === "jpeg" ? "jpg" : ext, data);
  const [row] = await db
    .insert(media)
    .values({ url, storageKey: key, filename: key.split("/").pop()!, originalName: file.name.slice(0, 200), mimeType: file.type, size: file.size, width, height, alt: opts.alt?.slice(0, 250) || null })
    .returning();
  return row!;
}

/** Video (MP4/WebM). İlk baytlar biçim imzasıyla doğrulanır. Büyük dosyalar için harici CDN önerilir. */
export async function uploadVideo(file: File, nameHint: string): Promise<MediaRow> {
  if (!(file instanceof File) || file.size === 0) throw new UploadError("Dosya seçilmedi.");
  if (file.size > MAX_VIDEO_BYTES) throw new UploadError("Video en fazla 80 MB olabilir. Daha büyük videolar için harici video URL'si kullanın.");
  const ext = extensionOf(file.name);
  if (!VIDEO_TYPES[file.type]?.includes(ext)) throw new UploadError("Yalnızca MP4 veya WebM video yüklenebilir.");
  const data = Buffer.from(await file.arrayBuffer());
  const isMp4 = data.subarray(4, 8).toString("latin1") === "ftyp";
  const isWebm = data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
  if ((ext === "mp4" && !isMp4) || (ext === "webm" && !isWebm)) throw new UploadError("Dosya içeriği uzantısıyla uyuşmuyor.");
  const { key, url } = await putUnique(nameHint || file.name.replace(/\.[^.]+$/, ""), ext, data);
  const [row] = await db.insert(media).values({ url, storageKey: key, filename: key.split("/").pop()!, originalName: file.name.slice(0, 200), mimeType: file.type, size: file.size }).returning();
  return row!;
}

/** URL'lerin gerçek ölçüleri (ürün galerisine width/height yazmak için). */
export async function getMediaDimensions(urls: string[]): Promise<Map<string, { width: number | null; height: number | null }>> {
  const out = new Map<string, { width: number | null; height: number | null }>();
  for (const u of [...new Set(urls)]) {
    const [r] = await db.select({ width: media.width, height: media.height }).from(media).where(eq(media.url, u)).limit(1);
    if (r) out.set(u, r);
  }
  return out;
}
