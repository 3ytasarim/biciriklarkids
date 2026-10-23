import { storage } from "@/lib/storage";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
};

/**
 * Yüklenen dosyaların servisi (/uploads/2026/10/avokado-figurlu-kece-canta-dikis-kiti.webp).
 * Dosyalar üzerine yazılmadığı için (aynı adda -2, -3…) 1 yıl immutable önbelleklenir.
 * Video için HTTP Range desteği (iOS Safari oynatma ve ileri sarma için zorunlu).
 */
export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const key = path.join("/");
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const type = MIME[ext];
  if (!type || path.some((p) => p === ".." || p.startsWith("."))) return new Response("Bulunamadı", { status: 404 });

  const file = await storage.read(key);
  if (!file) return new Response("Bulunamadı", { status: 404 });

  const base = {
    "Content-Type": type,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Last-Modified": file.mtime.toUTCString(),
    "X-Content-Type-Options": "nosniff",
    "Accept-Ranges": "bytes",
  };

  const range = req.headers.get("range");
  const m = range?.match(/^bytes=(\d*)-(\d*)$/);
  if (m && (m[1] || m[2])) {
    let start = m[1] ? Number(m[1]) : file.size - Number(m[2]);
    let end = m[1] && m[2] ? Number(m[2]) : file.size - 1;
    start = Math.max(0, start);
    end = Math.min(end, file.size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${file.size}` } });
    return new Response(new Uint8Array(file.data.subarray(start, end + 1)), {
      status: 206,
      headers: { ...base, "Content-Range": `bytes ${start}-${end}/${file.size}`, "Content-Length": String(end - start + 1) },
    });
  }

  return new Response(new Uint8Array(file.data), { headers: { ...base, "Content-Length": String(file.size) } });
}
