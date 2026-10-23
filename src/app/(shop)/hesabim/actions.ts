"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { addresses, customers } from "@/lib/db/schema";
import { hashPassword, PASSWORD_MIN_LENGTH, verifyPassword } from "@/lib/auth/password";
import { createCustomerSession, destroyCustomerSession, getCustomer } from "@/lib/auth/customer";
import { clearRateLimit, consumeRateLimit, hitRateLimit, isRateLimited } from "@/lib/rate-limit";
import { getIpHash } from "@/lib/request-meta";

export type AuthState = { error?: string; email?: string };

const safeNext = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/hesabim";
};

// Kullanıcı yoksa da gerçek bir argon2 doğrulaması → yanıt süresi hesabın varlığını sızdırmaz.
let dummy: Promise<string> | null = null;
const dummyHash = () => (dummy ??= hashPassword(randomBytes(16).toString("hex")));

export async function loginAction(_p: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = z.object({ email: z.email("Geçerli bir e-posta girin."), password: z.string().min(1, "Şifrenizi girin.").max(200) }).safeParse({ email: String(fd.get("email") ?? "").trim().toLowerCase(), password: fd.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email: String(fd.get("email") ?? "") };
  const { email, password } = parsed.data;
  const keys = [`clogin:email:${email}`, `clogin:ip:${await getIpHash()}`];
  if (await isRateLimited(keys, 8, 15 * 60_000)) return { error: "Çok fazla hatalı deneme. 15 dakika sonra tekrar deneyin.", email };
  const [c] = await db.select().from(customers).where(eq(customers.email, email)).limit(1);
  const ok = await verifyPassword(c?.passwordHash ?? (await dummyHash()), password);
  if (!c || !c.passwordHash || !ok || !c.isActive) {
    await hitRateLimit(keys);
    return { error: "E-posta veya şifre hatalı.", email };
  }
  await clearRateLimit(keys);
  await db.update(customers).set({ lastLoginAt: new Date() }).where(eq(customers.id, c.id));
  await createCustomerSession(c.id);
  redirect(safeNext(fd.get("next")));
}

export async function registerAction(_p: AuthState, fd: FormData): Promise<AuthState> {
  const parsed = z
    .object({
      firstName: z.string().trim().min(2, "Adınızı girin.").max(80),
      lastName: z.string().trim().min(2, "Soyadınızı girin.").max(80),
      email: z.email("Geçerli bir e-posta girin.").max(160),
      password: z.string().min(PASSWORD_MIN_LENGTH, `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`).max(200),
      kvkk: z.literal("on", { error: "Aydınlatma metnini onaylayın." }),
      marketing: z.literal("on").optional(),
    })
    .safeParse({ ...Object.fromEntries(fd), email: String(fd.get("email") ?? "").trim().toLowerCase() });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email: String(fd.get("email") ?? "") };
  const d = parsed.data;
  if (await consumeRateLimit([`register:${await getIpHash()}`], 5, 60 * 60_000)) return { error: "Çok fazla deneme. Lütfen daha sonra tekrar deneyin." };

  const [existing] = await db.select().from(customers).where(eq(customers.email, d.email)).limit(1);
  if (existing?.passwordHash) return { error: "Bu e-posta ile kayıtlı bir hesap var. Giriş yapmayı deneyin.", email: d.email };
  const passwordHash = await hashPassword(d.password);
  const marketing = d.marketing === "on";
  // TODO(e-posta doğrulama): SMTP gelince misafir siparişlerinin hesaba bağlanması e-posta doğrulamasından sonra yapılmalı.
  const [c] = existing
    ? await db
        .update(customers)
        .set({ passwordHash, firstName: d.firstName, lastName: d.lastName, marketingConsent: marketing, marketingConsentAt: marketing ? new Date() : null })
        .where(eq(customers.id, existing.id))
        .returning()
    : await db.insert(customers).values({ email: d.email, passwordHash, firstName: d.firstName, lastName: d.lastName, marketingConsent: marketing, marketingConsentAt: marketing ? new Date() : null }).returning();
  await createCustomerSession(c!.id);
  redirect(safeNext(fd.get("next")));
}

export async function logoutAction() {
  await destroyCustomerSession();
  redirect("/hesabim");
}

export async function deleteAddressAction(fd: FormData) {
  const customer = await getCustomer();
  if (!customer) redirect("/hesabim");
  const id = String(fd.get("id") ?? "");
  if (/^[0-9a-f-]{36}$/i.test(id)) await db.delete(addresses).where(and(eq(addresses.id, id), eq(addresses.customerId, customer.id)));
  redirect("/hesabim?bolum=adresler");
}

