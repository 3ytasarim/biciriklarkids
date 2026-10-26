import { z } from "zod";
import { answer } from "@/lib/assistant/engine";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getIpHash } from "@/lib/request-meta";

/** BıcırıklarBot: kullanıcı mesajı → sitenin verisinden kurulan yanıt (ürün kartları + bağlantılar). */
const body = z.object({ message: z.string().trim().min(1).max(300) });

export async function POST(req: Request) {
  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Mesaj 1–300 karakter olmalı." }, { status: 400 });
  if (await consumeRateLimit([`assistant:${await getIpHash()}`], 40, 10 * 60_000)) {
    return Response.json({ text: "Çok hızlı soru sordunuz 🙂 Lütfen birkaç dakika sonra tekrar deneyin." }, { status: 429 });
  }
  try {
    return Response.json(await answer(parsed.data.message), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[asistan]", e);
    return Response.json({ text: "Şu an yanıt veremiyorum. Ürünlere göz atabilir ya da İletişim sayfasından bize yazabilirsiniz.", links: [{ label: "Tüm ürünler", href: "/urunler" }, { label: "İletişim", href: "/iletisim" }] }, { status: 200 });
  }
}
