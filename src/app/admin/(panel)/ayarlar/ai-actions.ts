"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { getSiteSettings } from "@/lib/settings";
import { decryptSecret } from "@/lib/crypto/secret-box";
import { testOpenAI } from "@/lib/assistant/openai";

/** Kayıtlı (veya ENV) OpenAI anahtarı ve modeliyle kısa bağlantı testi. */
export async function testAiAction(): Promise<{ ok: boolean; message: string }> {
  await requireAdmin("admin");
  const s = await getSiteSettings();
  const key = process.env.OPENAI_API_KEY?.trim() || decryptSecret(s.ai.apiKeyEnc);
  if (!key) return { ok: false, message: "Önce API anahtarını girip ayarları kaydedin." };
  return testOpenAI(key, s.ai.model || "gpt-4o-mini");
}
