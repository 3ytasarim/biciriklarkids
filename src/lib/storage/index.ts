import "server-only";
import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Merkezi dosya deposu. Şimdilik yerel disk (Hetzner): dosyalar `UPLOAD_DIR` altında (varsayılan
 * ./storage/uploads — public/ DIŞINDA, çünkü next start build sonrası public/'e eklenen dosyaları
 * sunmaz) tutulur ve /uploads/[...path] route'u ile servis edilir.
 * İleride S3/R2'ye geçmek için yalnızca bu dosyanın arkası değişir; DB'de URL (`/uploads/...`) saklanır.
 */
const UPLOAD_ROOT = path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIR ?? path.join(/*turbopackIgnore: true*/ process.cwd(), "storage", "uploads"));

export const PUBLIC_UPLOAD_PREFIX = "/uploads/";

function resolveKey(key: string): string {
  const full = path.resolve(/*turbopackIgnore: true*/ UPLOAD_ROOT, key);
  // Path traversal koruması: anahtar kök dizinin dışına çıkamaz.
  if (!full.startsWith(UPLOAD_ROOT + path.sep)) throw new Error("Geçersiz dosya yolu.");
  return full;
}

export const storage = {
  async put(key: string, data: Buffer): Promise<{ key: string; url: string }> {
    const full = resolveKey(key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data, { flag: "wx" }); // mevcut dosyanın üzerine asla yazma
    return { key, url: PUBLIC_UPLOAD_PREFIX + key };
  },

  async remove(key: string): Promise<void> {
    await unlink(resolveKey(key)).catch(() => {});
  },

  async read(key: string): Promise<{ data: Buffer; size: number; mtime: Date } | null> {
    try {
      const full = resolveKey(key);
      const info = await stat(full);
      if (!info.isFile()) return null;
      return { data: await readFile(full), size: info.size, mtime: info.mtime };
    } catch {
      return null;
    }
  },

  keyFromUrl(url: string): string | null {
    return url.startsWith(PUBLIC_UPLOAD_PREFIX) ? url.slice(PUBLIC_UPLOAD_PREFIX.length) : null;
  },
};
