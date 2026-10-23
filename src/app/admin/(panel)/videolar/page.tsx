import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { products, videos } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { Badge, EmptyRow, Flash, PageHeader, Table } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { deleteVideoAction } from "./actions";

export const metadata = { title: "Videolar" };

export default async function VideosAdmin({ searchParams }: { searchParams: Promise<{ kaydedildi?: string }> }) {
  await requireAdmin();
  const rows = await db.select({ v: videos, productName: products.name }).from(videos).leftJoin(products, eq(videos.productId, products.id)).orderBy(asc(videos.slot));
  return (
    <>
      <PageHeader title="Videolar" description="Videosu girilmemiş alanlar sitede “VideoTest” yer tutucusu olarak görünür." action={{ label: "Yeni video alanı", href: "/admin/videolar/yeni" }} />
      <Flash message={(await searchParams).kaydedildi ? "Video alanı oluşturuldu." : null} />
      <Table head={["Alan", "Başlık", "Durum", "Oran", ""]} empty={rows.length ? null : <EmptyRow text="Video alanı yok." />}>
        {rows.map(({ v, productName }) => (
          <tr key={v.id} className="hover:bg-neutral-50">
            <td className="px-4 py-3">
              <Link href={`/admin/videolar/${v.id}`} className="font-mono text-sm font-semibold hover:underline">
                {v.slot}
              </Link>
              {productName ? <p className="text-xs text-neutral-500">Ürün: {productName}</p> : null}
            </td>
            <td className="px-4 py-3">{v.title}</td>
            <td className="px-4 py-3">{!v.isActive ? <Badge>Pasif</Badge> : v.desktopUrl ? <Badge tone="green">Video var</Badge> : <Badge tone="amber">VideoTest (video yok)</Badge>}</td>
            <td className="px-4 py-3 text-neutral-600">
              {v.aspectRatio} · mobil {v.mobileAspectRatio}
            </td>
            <td className="px-2 py-3 text-right">
              <ConfirmAction compact title={`${v.slot} silinsin mi?`} description="Ana sayfa alanlarını silmek yerine pasifleştirmeniz önerilir." action={deleteVideoAction.bind(null, v.id)} />
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
