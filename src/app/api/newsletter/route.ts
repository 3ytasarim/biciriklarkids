import { z } from "zod";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getIpHash } from "@/lib/request-meta";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * Bülten kaydı. Açık rıza (KVKK / ETK) onay kutusu zorunlu; rıza zamanı saklanır.
 * TODO(e-posta sağlayıcısı): çift onay (double opt-in) e-postası — SMTP/ESP bilgisi gelince.
 */
export async function POST(req: Request) {
  const body = await readJson(
    req,
    z.object({
      email: z.email("Geçerli bir e-posta adresi girin.").max(160),
      consent: z.literal(true, { error: "Devam etmek için onay kutusunu işaretleyin." }),
      source: z.string().max(40).optional(),
      website: z.string().max(0).optional(), // bal küpü (botlar doldurur)
    }),
  );
  if ("response" in body) return body.response;
  const ipHash = await getIpHash();
  if (await consumeRateLimit([`newsletter:${ipHash}`], 5, 60 * 60_000)) return jsonError("Çok fazla deneme. Lütfen daha sonra tekrar deneyin.", 429);
  const email = body.data.email.trim().toLowerCase();
  await db
    .insert(newsletterSubscribers)
    .values({ email, status: "subscribed", consentAt: new Date(), ipHash, source: body.data.source ?? "site" })
    .onConflictDoUpdate({ target: newsletterSubscribers.email, set: { status: "subscribed", consentAt: new Date(), updatedAt: new Date() } });
  return jsonOk({ message: "Teşekkürler! Bültenimize kaydoldunuz." });
}
