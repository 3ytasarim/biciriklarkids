import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderEvents, orderItems, orders, paymentTransactions } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { isUuid } from "@/lib/admin/form";
import { ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, STATUS_TONE } from "@/lib/commerce/order-labels";
import { PAYMENT_LABELS } from "@/lib/payments/registry";
import { formatPrice } from "@/lib/commerce/money";
import { formatDateTime } from "@/lib/utils";
import { Badge, PageHeader } from "@/components/admin/ui";
import { OrderUpdateForm, MarkPaidButton } from "./OrderClient";

export const metadata = { title: "Sipariş" };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const [o] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  if (!o) notFound();
  const [items, events, payments] = await Promise.all([
    db.select().from(orderItems).where(eq(orderItems.orderId, id)),
    db.select().from(orderEvents).where(eq(orderEvents.orderId, id)).orderBy(desc(orderEvents.createdAt)),
    db.select().from(paymentTransactions).where(eq(paymentTransactions.orderId, id)).orderBy(asc(paymentTransactions.createdAt)),
  ]);
  const b = o.billingAddress;
  const s = o.shippingAddress;

  return (
    <>
      <PageHeader title={`Sipariş ${o.orderNumber}`} description={formatDateTime(o.createdAt)} back={{ label: "Siparişler", href: "/admin/siparisler" }} />
      <div className="mb-6 flex flex-wrap gap-2">
        <Badge tone={STATUS_TONE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
        <Badge tone={o.paymentStatus === "paid" ? "green" : "amber"}>
          {PAYMENT_LABELS[o.paymentProvider] ?? o.paymentProvider} · {PAYMENT_STATUS_LABELS[o.paymentStatus]}
        </Badge>
        {o.couponCode ? <Badge>Kupon: {o.couponCode}</Badge> : null}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded-lg border border-neutral-200 bg-white">
            <h2 className="border-b border-neutral-200 px-5 py-3 font-semibold">Ürünler</h2>
            <ul className="divide-y divide-neutral-100">
              {items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-xs bg-neutral-100">{i.imageUrl ? <Image src={i.imageUrl} alt="" fill sizes="48px" className="object-cover" /> : null}</div>
                  <div className="min-w-0 flex-1">
                    {i.productId ? (
                      <Link href={`/admin/urunler/${i.productId}`} className="font-semibold hover:underline">
                        {i.name}
                      </Link>
                    ) : (
                      <span className="font-semibold">{i.name}</span>
                    )}
                    <p className="text-xs text-neutral-500">
                      {[i.sku, i.variantLabel].filter(Boolean).join(" · ")} · {i.quantity} × {formatPrice(i.unitPrice)}
                    </p>
                  </div>
                  <span className="font-semibold tabular-nums">{formatPrice(i.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="space-y-1 border-t border-neutral-200 px-5 py-4 text-sm">
              <Row k="Ara toplam" v={formatPrice(o.subtotal)} />
              {o.discountTotal > 0 ? <Row k="İndirim" v={`-${formatPrice(o.discountTotal)}`} /> : null}
              <Row k="Kargo" v={formatPrice(o.shippingTotal)} />
              <Row k="Toplam" v={formatPrice(o.grandTotal)} strong />
            </dl>
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm">
              <h2 className="mb-2 font-semibold">Müşteri ve teslimat</h2>
              <p className="font-semibold">
                {o.firstName} {o.lastName}
              </p>
              <p>
                <a href={`mailto:${o.email}`} className="underline">
                  {o.email}
                </a>{" "}
                · <a href={`tel:${o.phone.replace(/\s/g, "")}`}>{o.phone}</a>
              </p>
              <address className="mt-3 text-neutral-700 not-italic">
                {s.addressLine}
                <br />
                {s.district} / {s.city} {s.postalCode ?? ""}
              </address>
              {o.note ? <p className="mt-3 rounded-sm bg-amber-50 p-2 text-amber-900">Not: {o.note}</p> : null}
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white p-5 text-sm">
              <h2 className="mb-2 font-semibold">Fatura</h2>
              <p>{b.invoiceType === "corporate" ? `Kurumsal — ${b.companyName}` : "Bireysel"}</p>
              {b.invoiceType === "corporate" ? (
                <p>
                  {b.taxOffice} · VKN {b.taxNumber}
                </p>
              ) : null}
              <p className="mt-2">
                {b.firstName} {b.lastName}
              </p>
              <address className="text-neutral-700 not-italic">
                {b.addressLine}
                <br />
                {b.district} / {b.city}
              </address>
            </div>
          </section>

          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Zaman çizelgesi</h2>
            <ol className="space-y-3 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span aria-hidden="true" className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${e.isPublic ? "bg-brand" : "bg-neutral-300"}`} />
                  <div>
                    <p>{e.message}</p>
                    <p className="text-xs text-neutral-500">
                      {formatDateTime(e.createdAt)} · {e.actor} {e.isPublic ? "· müşteriye görünür" : "· iç not"}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-neutral-200 bg-white p-5">
            <h2 className="mb-3 font-semibold">Ödeme</h2>
            <p className="text-sm">
              {PAYMENT_LABELS[o.paymentProvider] ?? o.paymentProvider} — <strong>{PAYMENT_STATUS_LABELS[o.paymentStatus]}</strong>
            </p>
            {o.paidAt ? <p className="text-xs text-neutral-500">Ödeme: {formatDateTime(o.paidAt)}</p> : null}
            <ul className="mt-2 space-y-1 text-xs text-neutral-500">
              {payments.map((p) => (
                <li key={p.id}>
                  {formatDateTime(p.createdAt)} · {p.provider} · {PAYMENT_STATUS_LABELS[p.status]} · {formatPrice(p.amount)}
                </li>
              ))}
            </ul>
            {o.paymentStatus !== "paid" && o.paymentProvider === "bank_transfer" ? <MarkPaidButton id={o.id} /> : null}
          </section>
          <OrderUpdateForm id={o.id} status={o.status} carrier={o.carrier} trackingNumber={o.trackingNumber} />
        </aside>
      </div>
    </>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? "pt-1 text-base font-bold" : ""}`}>
      <dt>{k}</dt>
      <dd className="tabular-nums">{v}</dd>
    </div>
  );
}
