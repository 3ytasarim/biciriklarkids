import "server-only";
import { NextResponse } from "next/server";
import type { z } from "zod";

/**
 * CSRF savunması (JSON API'ler): çerezler SameSite=Lax + istek gövdesi JSON (çapraz site form gönderimi
 * JSON üretemez, fetch ise CORS preflight'a takılır) + Origin/Referer başlığı kendi host'umuz olmalı.
 */
export function isSameOrigin(req: Request): boolean {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!host || !origin) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export function jsonOk<T extends object>(data: T, init?: { status?: number }) {
  return NextResponse.json({ ok: true, ...data }, { status: init?.status ?? 200, headers: { "Cache-Control": "no-store" } });
}

/** Mutasyon isteği ön kontrolü + gövdeyi Zod ile doğrular. */
export async function readJson<S extends z.ZodType>(req: Request, schema: S): Promise<{ data: z.infer<S> } | { response: NextResponse }> {
  if (!isSameOrigin(req)) return { response: jsonError("Geçersiz istek kaynağı.", 403) };
  if (!req.headers.get("content-type")?.includes("application/json")) return { response: jsonError("JSON bekleniyor.", 415) };
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { response: jsonError("Geçersiz JSON.") };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { response: jsonError(parsed.error.issues[0]?.message ?? "Geçersiz veri.") };
  return { data: parsed.data };
}
