import { z } from "zod";
import { getCurrentCart, setCartCoupon } from "@/lib/commerce/cart";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getIpHash } from "@/lib/request-meta";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await readJson(req, z.object({ code: z.string().trim().max(40).nullable() }));
  if ("response" in body) return body.response;
  // Kupon kodu tahminine karşı: IP başına 10 dk'da 15 deneme.
  if (body.data.code && (await consumeRateLimit([`coupon:ip:${await getIpHash()}`], 15, 10 * 60_000))) {
    return jsonError("Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin.", 429);
  }
  const res = await setCartCoupon(body.data.code || null);
  if (!res.ok) return jsonError(res.message ?? "Kupon uygulanamadı.");
  return jsonOk({ cart: await getCurrentCart() });
}
