import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { contactMessages } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDateTime } from "@/lib/utils";
import { Badge, PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Mesajlar" };

async function markRead(id: string) {
  "use server";
  await requireAdmin();
  await db.update(contactMessages).set({ isRead: true }).where(eq(contactMessages.id, id));
  revalidatePath("/admin", "layout");
}

export default async function MessagesPage() {
  await requireAdmin();
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt)).limit(200);
  return (
    <>
      <PageHeader title="Mesajlar" description="İletişim formundan gelen mesajlar." />
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((m) => (
            <li key={m.id} className={`rounded-lg border bg-white p-5 ${m.isRead ? "border-neutral-200" : "border-brand"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {m.name} {!m.isRead ? <Badge tone="ember">Yeni</Badge> : null}
                  </p>
                  <p className="text-sm text-neutral-600">
                    <a href={`mailto:${m.email}`} className="underline">
                      {m.email}
                    </a>
                    {m.phone ? ` · ${m.phone}` : ""} · {m.subject ?? "—"}
                  </p>
                  <p className="text-xs text-neutral-500">{formatDateTime(m.createdAt)}</p>
                </div>
                {!m.isRead ? (
                  <form action={markRead.bind(null, m.id)}>
                    <button type="submit" className="min-h-9 rounded-full border border-neutral-300 px-4 text-xs font-semibold hover:border-ink">
                      Okundu işaretle
                    </button>
                  </form>
                ) : null}
              </div>
              <p className="mt-3 text-sm whitespace-pre-line text-neutral-800">{m.message}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white px-4 py-14 text-center text-sm text-neutral-500">Henüz mesaj yok.</p>
      )}
    </>
  );
}
