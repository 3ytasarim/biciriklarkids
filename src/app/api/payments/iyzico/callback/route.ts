import { NextResponse, type NextRequest } from "next/server";
import { handleIyzicoCallback } from "@/lib/payments/iyzico/flow";

/**
 * iyzico Checkout Form geri çağrısı. Müşterinin tarayıcısı iyzico'dan buraya `token` POST eder
 * (çapraz site form gönderimi — bu yüzden same-origin kontrolü YOK; güvenlik token'ın iyzico'dan
 * sunucu tarafında sorgulanması ve sipariş anahtarı doğrulamasıyla sağlanır).
 */
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const n = req.nextUrl.searchParams.get("n") ?? "";
  const t = req.nextUrl.searchParams.get("t") ?? "";
  const form = await req.formData().catch(() => null);
  const token = form?.get("token");
  const target = await handleIyzicoCallback(n, t, typeof token === "string" ? token : null);
  return NextResponse.redirect(target, 303);
}

/** Tarayıcı geri tuşu vb. ile GET gelirse sipariş sayfasına gönder (ödeme durumu değişmez). */
export async function GET(req: NextRequest) {
  const n = req.nextUrl.searchParams.get("n") ?? "";
  const t = req.nextUrl.searchParams.get("t") ?? "";
  return NextResponse.redirect(new URL(`/siparis/${encodeURIComponent(n)}?t=${encodeURIComponent(t)}`, req.nextUrl.origin), 303);
}
