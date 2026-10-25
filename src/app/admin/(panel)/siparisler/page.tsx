import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { and, count, desc, eq, ilike, inArray, notInArray, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { orders } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, STATUS_TONE, type OrderStatus, type PaymentStatus } from "@/lib/commerce/order-labels";
import { formatPrice } from "@/lib/commerce/money";
import { formatDateTime } from "@/lib/utils";
import { AdminPagination, Badge, EmptyRow, ListToolbar, PAGE_SIZE, PageHeader, pageOf, Table } from "@/components/admin/ui";
import { CancelOrderButton } from "./CancelOrderButton";

export const metadata = { title: "Siparişler" };

type Row = typeof orders.$inferSelect;
const CLOSED: OrderStatus[] = ["cancelled", "refunded"];

function OpenButton({ o }: { o: Row }) {
  return (
    <Link
      href={`/admin/siparisler/${o.id}`}
      aria-label={`${o.orderNumber} siparişini aç`}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#1e8cf5,#0067d1)] px-4 text-sm font-bold whitespace-nowrap text-white shadow-[0_8px_18px_-10px_rgb(0_103_209/0.9)] transition-transform hover:-translate-y-0.5"
    >
      Siparişi aç <ChevronRight aria-hidden="true" className="h-4 w-4" />
    </Link>
  );
}

function OrderRow({ o, cancellable }: { o: Row; cancellable: boolean }) {
  return (
    <tr className="hover:bg-neutral-50">
      <td className="px-4 py-3">
        <Link href={`/admin/siparisler/${o.id}`} className="font-semibold text-brand-ink underline decoration-brand/30 underline-offset-4 hover:decoration-brand">
          {o.orderNumber}
        </Link>
      </td>
      <td className="px-4 py-3">
        {o.firstName} {o.lastName}
        <p className="text-xs text-neutral-500">{o.email}</p>
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-neutral-600">{formatDateTime(o.cancelledAt && !cancellable ? o.cancelledAt : o.createdAt)}</td>
      <td className="px-4 py-3 font-semibold whitespace-nowrap tabular-nums">{formatPrice(o.grandTotal)}</td>
      <td className="px-4 py-3">
        <Badge tone={o.paymentStatus === "paid" ? "green" : o.paymentStatus === "failed" ? "red" : "amber"}>{PAYMENT_STATUS_LABELS[o.paymentStatus]}</Badge>
      </td>
      <td className="px-4 py-3">
        <Badge tone={STATUS_TONE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-start justify-end gap-2">
          <OpenButton o={o} />
          {cancellable && o.status !== "shipped" && o.status !== "delivered" ? <CancelOrderButton id={o.id} orderNumber={o.orderNumber} paid={o.paymentStatus === "paid"} /> : null}
        </div>
      </td>
    </tr>
  );
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ q?: string; durum?: string; odeme?: string; sayfa?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = pageOf(sp.sayfa);
  const q = sp.q?.trim().slice(0, 80);
  const durum = sp.durum && sp.durum in ORDER_STATUS_LABELS ? (sp.durum as OrderStatus) : null;

  const common: SQL[] = [];
  if (q) common.push(or(ilike(orders.orderNumber, `%${q}%`), ilike(orders.email, `%${q}%`), ilike(orders.lastName, `%${q}%`), ilike(orders.phone, `%${q}%`))!);
  if (sp.odeme && sp.odeme in PAYMENT_STATUS_LABELS) common.push(eq(orders.paymentStatus, sp.odeme as PaymentStatus));

  // Üst tablo: iptal/iade dışındaki siparişler (durum filtresi seçilmişse yalnız o durum).
  const showClosedOnTop = durum !== null && CLOSED.includes(durum);
  const topWhere = and(...common, durum ? eq(orders.status, durum) : notInArray(orders.status, CLOSED));
  // Alt tablo: iptal edilen/iade edilen siparişler (durum filtresi yokken).
  const showClosedTable = durum === null;
  const closedWhere = and(...common, inArray(orders.status, CLOSED));

  const [rows, [{ total }], closed] = await Promise.all([
    db.select().from(orders).where(topWhere).orderBy(desc(orders.createdAt)).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(orders).where(topWhere),
    showClosedTable ? db.select().from(orders).where(closedWhere).orderBy(desc(orders.cancelledAt), desc(orders.createdAt)).limit(50) : Promise.resolve([] as Row[]),
  ]);
  const head = ["Sipariş", "Müşteri", "Tarih", "Tutar", "Ödeme", "Durum", ""];

  return (
    <>
      <PageHeader title="Siparişler" description={`${total} ${showClosedOnTop ? "sipariş" : "aktif sipariş"}${showClosedTable && closed.length ? ` · ${closed.length} iptal/iade` : ""}`} />
      <ListToolbar
        q={q}
        placeholder="Sipariş no, e-posta, soyad, telefon…"
        filters={[
          { name: "durum", label: "Durum", value: sp.durum, options: Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label })) },
          { name: "odeme", label: "Ödeme", value: sp.odeme, options: Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({ value, label })) },
        ]}
      />
      <Table head={head} empty={rows.length ? null : <EmptyRow text="Sipariş bulunamadı." />}>
        {rows.map((o) => (
          <OrderRow key={o.id} o={o} cancellable={!CLOSED.includes(o.status)} />
        ))}
      </Table>
      <AdminPagination page={page} pages={Math.ceil(Number(total) / PAGE_SIZE)} params={{ q, durum: sp.durum, odeme: sp.odeme }} />

      {showClosedTable ? (
        <section aria-labelledby="iptal-baslik" className="mt-12">
          <h2 id="iptal-baslik" className="mb-1 text-lg font-bold text-ink">
            İptal edilen siparişler
          </h2>
          <p className="mb-4 text-sm text-neutral-500">İptal veya iade edilen siparişler burada listelenir (son 50). Tarih sütunu iptal tarihini gösterir.</p>
          <Table head={head} empty={closed.length ? null : <EmptyRow text="İptal edilen sipariş yok." />}>
            {closed.map((o) => (
              <OrderRow key={o.id} o={o} cancellable={false} />
            ))}
          </Table>
        </section>
      ) : null}
    </>
  );
}
