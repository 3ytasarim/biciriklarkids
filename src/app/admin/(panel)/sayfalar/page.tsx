import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { pages } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { formatDate } from "@/lib/utils";
import { Badge, EmptyRow, PageHeader, Table } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { deletePageAction } from "./actions";

export const metadata = { title: "Sayfalar" };

export default async function PagesAdmin() {
  await requireAdmin();
  const rows = await db.select().from(pages).orderBy(asc(pages.kind), asc(pages.sortOrder), asc(pages.title));
  return (
    <>
      <PageHeader title="Sayfalar" description="Yasal metinler (KVKK, gizlilik, iade, çerez, mesafeli satış) ve bilgi sayfaları. Yasal metinleri yayın öncesi hukuk danışmanınıza onaylatın." action={{ label: "Yeni sayfa", href: "/admin/sayfalar/yeni" }} />
      <Table head={["Başlık", "Adres", "Tür", "Durum", "Güncelleme", ""]} empty={rows.length ? null : <EmptyRow text="Sayfa yok." />}>
        {rows.map((p) => (
          <tr key={p.id} className="hover:bg-neutral-50">
            <td className="px-4 py-3">
              <Link href={`/admin/sayfalar/${p.id}`} className="font-semibold hover:underline">
                {p.title}
              </Link>
              {p.content.includes("NETLEŞTİRİLECEK") ? <p className="text-xs font-semibold text-amber-700">Eksik bilgi içeriyor</p> : null}
            </td>
            <td className="px-4 py-3 text-neutral-600">/{p.slug}</td>
            <td className="px-4 py-3">{p.kind === "legal" ? <Badge tone="ember">Yasal</Badge> : <Badge>Bilgi</Badge>}</td>
            <td className="px-4 py-3">{p.isActive ? <Badge tone="green">Yayında</Badge> : <Badge>Pasif</Badge>}</td>
            <td className="px-4 py-3 text-neutral-600">{formatDate(p.updatedAt)}</td>
            <td className="px-2 py-3 text-right">
              <ConfirmAction compact title={`“${p.title}” silinsin mi?`} description="Sayfa kalıcı olarak silinir." action={deletePageAction.bind(null, p.id)} />
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
