"use server";

import { revalidatePath } from "next/cache";
import { and, count, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminSessions, adminUsers } from "@/lib/db/schema";
import { destroyOtherAdminSessions, requireAdmin } from "@/lib/auth/admin";
import { hashPassword, PASSWORD_MIN_LENGTH, verifyPassword } from "@/lib/auth/password";
import { fail, formObject, isUniqueViolation, required, zodErrors, type ActionState, type Result } from "@/lib/admin/form";

const createSchema = z.object({
  name: required("Ad", 120),
  email: z.email("Geçerli e-posta girin.").max(160),
  role: z.enum(["editor", "admin", "owner"]),
  password: z.string().min(PASSWORD_MIN_LENGTH, `Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`).max(200),
});

export async function createAdminUserAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin("owner");
  const parsed = createSchema.safeParse({ ...formObject(fd), email: String(fd.get("email") ?? "").trim().toLowerCase() });
  if (!parsed.success) return zodErrors(parsed.error);
  try {
    await db.insert(adminUsers).values({ ...parsed.data, passwordHash: await hashPassword(parsed.data.password) });
  } catch (e) {
    if (isUniqueViolation(e)) return fail("Bu e-posta ile bir yönetici var.", { email: "Kayıtlı." });
    throw e;
  }
  revalidatePath("/admin/kullanicilar");
  return { status: "success", message: "Yönetici eklendi." };
}

export async function toggleAdminUserAction(id: string): Promise<Result> {
  const me = await requireAdmin("owner");
  if (id === me.id) return { ok: false, error: "Kendi hesabınızı pasifleştiremezsiniz." };
  const [u] = await db.select().from(adminUsers).where(eq(adminUsers.id, id)).limit(1);
  if (!u) return { ok: false, error: "Kullanıcı bulunamadı." };
  if (u.role === "owner" && u.isActive) {
    const [{ n }] = await db.select({ n: count() }).from(adminUsers).where(and(eq(adminUsers.role, "owner"), eq(adminUsers.isActive, true), ne(adminUsers.id, id)));
    if (Number(n) === 0) return { ok: false, error: "Son aktif sahip hesabı pasifleştirilemez." };
  }
  await db.update(adminUsers).set({ isActive: !u.isActive }).where(eq(adminUsers.id, id));
  if (u.isActive) await db.delete(adminSessions).where(eq(adminSessions.adminUserId, id));
  revalidatePath("/admin/kullanicilar");
  return { ok: true };
}

const pwSchema = z
  .object({
    current: z.string().min(1, "Mevcut şifreyi girin."),
    next: z.string().min(PASSWORD_MIN_LENGTH, `Yeni şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalı.`).max(200),
    confirm: z.string(),
  })
  .refine((v) => v.next === v.confirm, { path: ["confirm"], message: "Şifreler eşleşmiyor." });

export async function changePasswordAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  const me = await requireAdmin();
  const parsed = pwSchema.safeParse(formObject(fd));
  if (!parsed.success) return zodErrors(parsed.error);
  const [u] = await db.select().from(adminUsers).where(eq(adminUsers.id, me.id)).limit(1);
  if (!u || !(await verifyPassword(u.passwordHash, parsed.data.current))) return fail("Mevcut şifre hatalı.", { current: "Hatalı." });
  await db.update(adminUsers).set({ passwordHash: await hashPassword(parsed.data.next) }).where(eq(adminUsers.id, me.id));
  await destroyOtherAdminSessions(me.id);
  return { status: "success", message: "Şifreniz güncellendi; diğer cihazlardaki oturumlar kapatıldı." };
}
