import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages, orders, reviews } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminShell } from "@/components/admin/AdminShell";

// Admin her zaman dinamik (oturuma bağlı) — önbelleğe alınmaz.
export const dynamic = "force-dynamic";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const [[o], [r], [m]] = await Promise.all([
    db.select({ n: count() }).from(orders).where(eq(orders.status, "pending")),
    db.select({ n: count() }).from(reviews).where(eq(reviews.status, "pending")),
    db.select({ n: count() }).from(contactMessages).where(eq(contactMessages.isRead, false)),
  ]);
  return (
    <AdminShell user={user} badges={{ orders: Number(o?.n ?? 0), reviews: Number(r?.n ?? 0), messages: Number(m?.n ?? 0) }}>
      {children}
    </AdminShell>
  );
}
