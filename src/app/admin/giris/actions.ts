"use server";

import { randomBytes } from "node:crypto";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminUsers } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createAdminSession, destroyAdminSession } from "@/lib/auth/admin";
import { clearRateLimit, hitRateLimit, isRateLimited } from "@/lib/rate-limit";
import { getIpHash } from "@/lib/request-meta";

export type LoginState = { error?: string; email?: string };

/** Giriş kimliği: e-posta veya kullanıcı adı (harf, rakam, . _ -). Her ikisi de admin_users.email sütununda tutulur. */
const schema = z.object({
  email: z
    .string()
    .min(3, "Kullanıcı adı veya e-posta girin.")
    .max(160)
    .refine((v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) || /^[a-z0-9._-]{3,40}$/.test(v), "Geçerli bir kullanıcı adı veya e-posta girin."),
  password: z.string().min(1, "Şifre girin.").max(200),
});

// Kullanıcı yoksa da gerçek bir argon2 doğrulaması → yanıt süresi kullanıcı varlığını sızdırmaz.
let dummy: Promise<string> | null = null;
const dummyHash = () => (dummy ??= hashPassword(randomBytes(16).toString("hex")));

export async function adminLoginAction(_prev: LoginState, fd: FormData): Promise<LoginState> {
  const parsed = schema.safeParse({ email: String(fd.get("email") ?? "").trim().toLowerCase(), password: String(fd.get("password") ?? "") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message, email: String(fd.get("email") ?? "") };
  const { email, password } = parsed.data;
  const keys = [`alogin:email:${email}`, `alogin:ip:${await getIpHash()}`];
  if (await isRateLimited(keys, 5, 15 * 60_000)) return { error: "Çok fazla hatalı deneme. Lütfen 15 dakika sonra tekrar deneyin.", email };

  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email)).limit(1);
  const valid = await verifyPassword(user?.passwordHash ?? (await dummyHash()), password);
  if (!user || !valid || !user.isActive) {
    await hitRateLimit(keys);
    return { error: "Kullanıcı adı/e-posta veya şifre hatalı.", email };
  }
  await clearRateLimit(keys);
  await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, user.id));
  await createAdminSession(user.id);
  redirect("/admin");
}

export async function logoutAdminAction() {
  await destroyAdminSession();
  redirect("/admin/giris");
}
