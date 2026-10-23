import Link from "next/link";
import { count, desc, eq } from "drizzle-orm";
import { Download } from "lucide-react";
import { db } from "@/lib/db";
import { newsletterSubscribers } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDateTime } from "@/lib/utils";
import { Badge, EmptyRow, PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Bülten" };

export default async function NewsletterPage() {
  await requireAdmin();
  const [rows, [{ n }]] = await Promise.all([
    db.select().from(newsletterSubscribers).orderBy(desc(newsletterSubscribers.createdAt)).limit(500),
    db.select({ n: count() }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status, "subscribed")),
  ]);
  return (
    <>
      <PageHeader title="Bülten aboneleri" description={`${n} aktif abone. Açık rıza zamanı kayıtlıdır. E-posta gönderimi için ESP (ör. Mailchimp, Brevo) entegrasyonu gerekir.`} />
      <Link href="/admin/bulten/csv" className="mb-4 inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm hover:border-ink">
        <Download aria-hidden="true" className="h-4 w-4" /> CSV indir
      </Link>
      <Table head={["E-posta", "Durum", "Kaynak", "Rıza zamanı"]} empty={rows.length ? null : <EmptyRow text="Henüz abone yok." />}>
        {rows.map((s) => (
          <tr key={s.id}>
            <td className="px-4 py-3">{s.email}</td>
            <td className="px-4 py-3">{s.status === "subscribed" ? <Badge tone="green">Abone</Badge> : <Badge>Ayrıldı</Badge>}</td>
            <td className="px-4 py-3 text-neutral-600">{s.source ?? "—"}</td>
            <td className="px-4 py-3 text-neutral-600">{formatDateTime(s.consentAt)}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
