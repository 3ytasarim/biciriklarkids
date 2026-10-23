import Link from "next/link";
import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, STATUS_TONE, type OrderStatus, type PaymentStatus } from "@/lib/commerce/order-labels";
import { formatPrice } from "@/lib/commerce/money";
import { formatDateTime } from "@/lib/utils";
import { AdminPagination, Badge, EmptyRow, ListToolbar, PAGE_SIZE, PageHeader, pageOf, Table } from "@/components/admin/ui";

export const metadata = { title: "Siparişler" };

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; durum?: string; odeme?: string; sayfa?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = pageOf(sp.sayfa);
  const q = sp.q?.trim().slice(0, 80);
  const where: SQL[] = [];
  if (q) where.push(or(ilike(orders.orderNumber, `%${q}%`), ilike(orders.email, `%${q}%`), ilike(orders.lastName, `%${q}%`), ilike(orders.phone, `%${q}%`))!);
  if (sp.durum && sp.durum in ORDER_STATUS_LABELS) where.push(eq(orders.status, sp.durum as OrderStatus));
  if (sp.odeme && sp.odeme in PAYMENT_STATUS_LABELS) where.push(eq(orders.paymentStatus, sp.odeme as PaymentStatus));
  const w = where.length ? and(...where) : undefined;
  const [rows, [{ total }]] = await Promise.all([
    db.select().from(orders).where(w).orderBy(desc(orders.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(orders).where(w),
  ]);
  return (
    <>
      <PageHeader title="Siparişler" description={`${total} sipariş`} />
      <ListToolbar
        q={q}
        placeholder="Sipariş no, e-posta, soyad, telefon…"
        filters={[
          { name: "durum", label: "Durum", value: sp.durum, options: Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label })) },
          { name: "odeme", label: "Ödeme", value: sp.odeme, options: Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })) },
        ]}
      />
      <Table head={["Sipariş", "Müşteri", "Tarih", "Tutar", "Ödeme", "Durum"]} empty={rows.length ? null : <EmptyRow text="Sipariş bulunamadı." />}>
        {rows.map((o) => (
          <tr key={o.id} className="hover:bg-neutral-50">
            <td className="px-4 py-3">
              <Link href={`/admin/siparisler/${o.id}`} className="font-semibold hover:underline">
                {o.orderNumber}
              </Link>
            </td>
            <td className="px-4 py-3">
              {o.firstName} {o.lastName}
              <p className="text-xs text-neutral-500">{o.email}</p>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{formatDateTime(o.createdAt)}</td>
            <td className="px-4 py-3 font-semibold whitespace-nowrap tabular-nums">{formatPrice(o.grandTotal)}</td>
            <td className="px-4 py-3">
              <Badge tone={o.paymentStatus === "paid" ? "green" : o.paymentStatus === "failed" ? "red" : "amber"}>{PAYMENT_STATUS_LABELS[o.paymentStatus]}</Badge>
            </td>
            <td className="px-4 py-3">
              <Badge tone={STATUS_TONE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
            </td>
          </tr>
        ))}
      </Table>
      <AdminPagination page={page} pages={Math.ceil(Number(total) / PAGE_SIZE)} params={{ q, durum: sp.durum, odeme: sp.odeme }} />
    </>
  );
}
