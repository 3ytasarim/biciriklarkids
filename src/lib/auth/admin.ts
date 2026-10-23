import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { adminSessions, adminUsers } from "@/lib/db/schema";
import { ADMIN_SESSION_COOKIE } from "./cookies";

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 saat
export type AdminRole = "editor" | "admin" | "owner";
export type AdminUser = { id: string; name: string; email: string; role: AdminRole };

const ROLE_RANK: Record<AdminRole, number> = { editor: 0, admin: 1, owner: 2 };
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

export function hasRole(user: AdminUser, min: AdminRole): boolean {
  return ROLE_RANK[user.role] >= ROLE_RANK[min];
}

export async function createAdminSession(adminUserId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(adminSessions).values({ adminUserId, tokenHash: hashToken(token), expiresAt });
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));
  (await cookies()).set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: expiresAt,
  });
}

/** İstek başına bir kez (React cache) — layout ve sayfa aynı oturumu iki kez sorgulamaz. */
export const getAdminUser = cache(async (): Promise<AdminUser | null> => {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const [row] = await db
    .select({ id: adminUsers.id, name: adminUsers.name, email: adminUsers.email, role: adminUsers.role, isActive: adminUsers.isActive, expiresAt: adminSessions.expiresAt })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminUserId, adminUsers.id))
    .where(eq(adminSessions.tokenHash, hashToken(token)))
    .limit(1);
  if (!row || row.expiresAt < new Date() || !row.isActive) return null;
  return { id: row.id, name: row.name, email: row.email, role: row.role };
});

/**
 * Her admin sayfasının ve HER server action'ın ilk satırı. proxy.ts'teki çerez kontrolü yalnızca yönlendirme
 * kolaylığıdır; asıl yetki burada, veritabanındaki oturuma karşı doğrulanır (istemci tarafı kontrol yok).
 */
export async function requireAdmin(min: AdminRole = "editor"): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/giris");
  if (!hasRole(user, min)) redirect("/admin?yetki=yok");
  return user;
}

export async function destroyAdminSession() {
  const store = await cookies();
  const token = store.get(ADMIN_SESSION_COOKIE)?.value;
  if (token) await db.delete(adminSessions).where(eq(adminSessions.tokenHash, hashToken(token)));
  store.delete(ADMIN_SESSION_COOKIE);
}

export async function destroyOtherAdminSessions(adminUserId: string) {
  const token = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
  await db.delete(adminSessions).where(and(eq(adminSessions.adminUserId, adminUserId), token ? ne(adminSessions.tokenHash, hashToken(token)) : undefined));
}
