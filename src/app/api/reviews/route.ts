import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, reviews } from "@/lib/db/schema";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getIpHash } from "@/lib/request-meta";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Ürün yorumu gönderimi. Yorumlar "pending" durumunda kaydedilir ve admin onayından sonra yayınlanır
 * (sitede ve şemada yalnızca onaylı gerçek yorumlar). Bot koruması: bal küpü + IP başına saatte 3 yorum.
 */
export async function POST(req: Request) {
  const body = await readJson(
    req,
    z.object({
      productId: z.uuid(),
      authorName: z.string().trim().min(2, "Adınızı yazın.").max(80),
      authorEmail: z.email("Geçerli bir e-posta girin.").max(160),
      rating: z.number().int().min(1, "Puan seçin.").max(5),
      title: z.string().trim().max(140).optional(),
      body: z.string().trim().min(10, "Yorumunuz en az 10 karakter olmalı.").max(3000),
      website: z.string().max(0).optional(),
    }),
  );
  if ("response" in body) return body.response;
  const ipHash = await getIpHash();
  if (await consumeRateLimit([`review:${ipHash}`], 3, 60 * 60_000)) return jsonError("Çok fazla yorum gönderdiniz. Lütfen daha sonra tekrar deneyin.", 429);
  const [p] = await db.select({ id: products.id }).from(products).where(and(eq(products.id, body.data.productId), eq(products.status, "active"))).limit(1);
  if (!p) return jsonError("Ürün bulunamadı.", 404);
  const d = body.data;
  await db.insert(reviews).values({ productId: p.id, authorName: d.authorName, authorEmail: d.authorEmail.toLowerCase(), rating: d.rating, title: d.title || null, body: d.body, status: "pending", ipHash });
  return jsonOk({ message: "Teşekkürler! Yorumunuz incelendikten sonra yayınlanacak." });
}
