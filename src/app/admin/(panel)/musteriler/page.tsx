import { count, desc, ilike, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers, orders } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { formatPrice } from "@/lib/commerce/money";
import { formatDate } from "@/lib/utils";
import { AdminPagination, Badge, EmptyRow, ListToolbar, PAGE_SIZE, PageHeader, pageOf, Table } from "@/components/admin/ui";

export const metadata = { title: "Müşteriler" };

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string; sayfa?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = pageOf(sp.sayfa);
  const q = sp.q?.trim().slice(0, 80);
  const where = q ? or(ilike(customers.email, `%${q}%`), ilike(customers.lastName, `%${q}%`), ilike(customers.phone, `%${q}%`)) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db
      .select({
        id: customers.id,
        email: customers.email,
        firstName: customers.firstName,
        lastName: customers.lastName,
        phone: customers.phone,
        member: sql<boolean>`${customers.passwordHash} is not null`,
        marketingConsent: customers.marketingConsent,
        createdAt: customers.createdAt,
        orderCount: sql<number>`(select count(*)::int from ${orders} where ${orders.customerId} = ${customers.id})`,
        spent: sql<number>`(select coalesce(sum(${orders.grandTotal}), 0)::float from ${orders} where ${orders.customerId} = ${customers.id} and ${orders.paymentStatus} = 'paid')`,
      })
      .from(customers)
      .where(where)
      .orderBy(desc(customers.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(customers).where(where),
  ]);
  return (
    <>
      <PageHeader title="Müşteriler" description={`${total} kayıt (üyeler ve misafir sipariş verenler)`} />
      <ListToolbar q={q} placeholder="E-posta, soyad, telefon…" />
      <Table head={["Müşteri", "Telefon", "Tür", "Sipariş", "Ödenen", "İzin", "Kayıt"]} empty={rows.length ? null : <EmptyRow text="Müşteri bulunamadı." />}>
        {rows.map((c) => (
          <tr key={c.id} className="hover:bg-neutral-50">
            <td className="px-4 py-3">
              <p className="font-semibold">{[c.firstName, c.lastName].filter(Boolean).join(" ") || "—"}</p>
              <p className="text-xs text-neutral-500">{c.email}</p>
            </td>
            <td className="px-4 py-3 text-neutral-600">{c.phone ?? "—"}</td>
            <td className="px-4 py-3">{c.member ? <Badge tone="green">Üye</Badge> : <Badge>Misafir</Badge>}</td>
            <td className="px-4 py-3 tabular-nums">{c.orderCount}</td>
            <td className="px-4 py-3 tabular-nums">{formatPrice(Number(c.spent))}</td>
            <td className="px-4 py-3">{c.marketingConsent ? <Badge tone="green">Pazarlama ✓</Badge> : "—"}</td>
            <td className="px-4 py-3 text-neutral-600">{formatDate(c.createdAt)}</td>
          </tr>
        ))}
      </Table>
      <AdminPagination page={page} pages={Math.ceil(Number(total) / PAGE_SIZE)} params={{ q }} />
    </>
  );
}
