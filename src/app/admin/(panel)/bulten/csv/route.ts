import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { getAdminUser } from "@/lib/auth/admin";

/** Aktif abonelerin CSV dışa aktarımı (yalnızca oturum açmış yönetici). */
export async function GET() {
  const user = await getAdminUser();
  if (!user) return new Response("Yetkisiz", { status: 401 });
  const rows = await db.select().from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "subscribed")).orderBy(desc(newsletterSubscribers.createdAt));
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = ["email,consent_at,source", ...rows.map((r) => [esc(r.email), r.consentAt.toISOString(), esc(r.source ?? "")].join(","))].join("\n");
  return new Response("﻿" + csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="bulten-aboneleri-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "no-store" },
  });
}
