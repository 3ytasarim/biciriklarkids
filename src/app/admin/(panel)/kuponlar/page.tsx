import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { formatPrice } from "@/lib/commerce/money";
import { formatDate } from "@/lib/utils";
import { Badge, EmptyRow, Flash, PageHeader, Table } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { deleteCouponAction } from "./actions";

export const metadata = { title: "Kuponlar" };

export default async function CouponsPage({ searchParams }: { searchParams: Promise<{ kaydedildi?: string }> }) {
  await requireAdmin();
  const rows = await db.select().from(coupons).orderBy(desc(coupons.createdAt));
  const now = new Date();
  return (
    <>
      <PageHeader title="Kuponlar" action={{ label: "Yeni kupon", href: "/admin/kuponlar/yeni" }} />
      <Flash message={(await searchParams).kaydedildi ? "Kupon oluşturuldu." : null} />
      <Table head={["Kod", "İndirim", "Koşul", "Kullanım", "Geçerlilik", "Durum", ""]} empty={rows.length ? null : <EmptyRow text="Henüz kupon yok." action={{ label: "Yeni kupon", href: "/admin/kuponlar/yeni" }} />}>
        {rows.map((c) => {
          const expired = c.endsAt && c.endsAt < now;
          return (
            <tr key={c.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3"><Link href={`/admin/kuponlar/${c.id}`} className="font-mono font-semibold hover:underline">{c.code}</Link></td>
              <td className="px-4 py-3">{c.type === "percent" ? `%${c.value}` : c.type === "fixed" ? formatPrice(c.value) : "Ücretsiz kargo"}</td>
              <td className="px-4 py-3 text-neutral-600">{c.minOrderAmount ? `${formatPrice(c.minOrderAmount)} üzeri` : "—"}</td>
              <td className="px-4 py-3 tabular-nums">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
              <td className="px-4 py-3 text-neutral-600">{c.startsAt ? formatDate(c.startsAt) : "—"} → {c.endsAt ? formatDate(c.endsAt) : "süresiz"}</td>
              <td className="px-4 py-3">{!c.isActive ? <Badge>Pasif</Badge> : expired ? <Badge tone="red">Süresi doldu</Badge> : <Badge tone="green">Aktif</Badge>}</td>
              <td className="px-2 py-3 text-right"><ConfirmAction compact title={`${c.code} silinsin mi?`} description="Kupon kalıcı olarak silinir; geçmiş siparişlerdeki kupon kodu korunur." action={deleteCouponAction.bind(null, c.id)} /></td>
            </tr>
          );
        })}
      </Table>
    </>
  );
}
