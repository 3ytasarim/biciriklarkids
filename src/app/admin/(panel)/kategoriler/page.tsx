import Link from "next/link";
import { asc, count } from "drizzle-orm";
import { ArrowDown, ArrowUp } from "lucide-react";
import { db } from "@/lib/db";
import { categories, products } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { Badge, EmptyRow, PageHeader, Table } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { deleteCategoryAction, moveCategoryAction } from "./actions";

export const metadata = { title: "Kategoriler" };

export default async function CategoriesAdmin() {
  await requireAdmin();
  const [rows, counts] = await Promise.all([
    db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    db.select({ id: products.categoryId, n: count() }).from(products).groupBy(products.categoryId),
  ]);
  const countBy = new Map(counts.map((c) => [c.id, Number(c.n)]));
  const ordered: { row: (typeof rows)[number]; depth: number }[] = [];
  const walk = (parent: string | null, depth: number) => {
    for (const r of rows.filter((x) => x.parentId === parent)) {
      ordered.push({ row: r, depth });
      walk(r.id, depth + 1);
    }
  };
  walk(null, 0);
  return (
    <>
      <PageHeader title="Kategoriler" description="Sıralama ana sayfa, menü ve filtrelerde kullanılır." action={{ label: "Yeni kategori", href: "/admin/kategoriler/yeni" }} />
      <Table head={["Kategori", "Ürün", "Durum", "Sıra", ""]} empty={rows.length ? null : <EmptyRow text="Henüz kategori yok." />}>
        {ordered.map(({ row: c, depth }) => (
          <tr key={c.id} className="hover:bg-neutral-50">
            <td className="px-4 py-3">
              <Link href={`/admin/kategoriler/${c.id}`} className="font-semibold hover:underline" style={{ paddingLeft: depth * 20 }}>
                {depth ? "↳ " : ""}
                {c.name}
              </Link>
              <p className="text-xs text-neutral-500" style={{ paddingLeft: depth * 20 }}>
                /kategori/{c.slug}
              </p>
            </td>
            <td className="px-4 py-3 tabular-nums">{countBy.get(c.id) ?? 0}</td>
            <td className="px-4 py-3">{c.status === "active" ? <Badge tone="green">Aktif</Badge> : <Badge>Gizli</Badge>}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <span className="w-10 text-xs text-neutral-500 tabular-nums">{c.sortOrder}</span>
                <form action={async () => { "use server"; await moveCategoryAction(c.id, -1); }}>
                  <button type="submit" aria-label="Yukarı" className="flex h-8 w-8 items-center justify-center rounded-xs hover:bg-neutral-100"><ArrowUp className="h-4 w-4" /></button>
                </form>
                <form action={async () => { "use server"; await moveCategoryAction(c.id, 1); }}>
                  <button type="submit" aria-label="Aşağı" className="flex h-8 w-8 items-center justify-center rounded-xs hover:bg-neutral-100"><ArrowDown className="h-4 w-4" /></button>
                </form>
              </div>
            </td>
            <td className="px-2 py-3 text-right">
              <ConfirmAction compact title={`“${c.name}” silinsin mi?`} description="Kategoride ürün varsa silinmez. Alt kategoriler ana kategoriye taşınır." action={deleteCategoryAction.bind(null, c.id)} />
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
