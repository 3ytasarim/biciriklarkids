"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getIpHash } from "@/lib/request-meta";

export type ContactState = { ok?: boolean; error?: string; fieldErrors?: Record<string, string> };

const schema = z.object({
  name: z.string().trim().min(2, "Adınızı yazın.").max(120),
  email: z.email("Geçerli bir e-posta girin.").max(160),
  phone: z.string().trim().max(32).optional(),
  subject: z.string().trim().max(160).optional(),
  message: z.string().trim().min(10, "Mesajınız en az 10 karakter olmalı.").max(4000),
  consent: z.literal("on", { error: "Aydınlatma metnini onaylayın." }),
  website: z.string().max(0).optional(),
});

/** İletişim formu: mesaj Admin › Mesajlar'a düşer. TODO(e-posta): bildirim e-postası SMTP gelince. */
export async function contactAction(_prev: ContactState, fd: FormData): Promise<ContactState> {
  const parsed = schema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) fieldErrors[String(i.path[0])] ??= i.message;
    return { error: "Lütfen işaretli alanları kontrol edin.", fieldErrors };
  }
  const ipHash = await getIpHash();
  if (await consumeRateLimit([`contact:${ipHash}`], 5, 60 * 60_000)) return { error: "Çok fazla mesaj gönderildi. Lütfen daha sonra tekrar deneyin." };
  const d = parsed.data;
  await db.insert(contactMessages).values({ name: d.name, email: d.email.toLowerCase(), phone: d.phone || null, subject: d.subject || null, message: d.message, ipHash });
  return { ok: true };
}
