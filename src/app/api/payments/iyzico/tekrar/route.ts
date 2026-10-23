import { NextResponse, type NextRequest } from "next/server";
import { restartIyzicoPayment } from "@/lib/payments/iyzico/flow";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getIpHash } from "@/lib/request-meta";

/** Ödenmemiş iyzico siparişi için ödeme sayfasını yeniden açar (sipariş sayfasındaki "Ödemeyi tamamla"). */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const n = req.nextUrl.searchParams.get("n") ?? "";
  const t = req.nextUrl.searchParams.get("t") ?? "";
  if (await consumeRateLimit([`iyzico-retry:${await getIpHash()}`], 10, 60 * 60_000)) {
    return NextResponse.redirect(new URL(`/siparis/${encodeURIComponent(n)}?t=${encodeURIComponent(t)}&odeme=baslatilamadi`, req.nextUrl.origin), 303);
  }
  return NextResponse.redirect(await restartIyzicoPayment(n, t), 303);
}
