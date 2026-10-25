import Link from "next/link";
import { sql } from "drizzle-orm";
import { ArrowDownRight, ArrowUpRight, CalendarDays, Clock, Minus, ShoppingBag, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/commerce/money";

/**
 * Panel satış raporu. Ciro = ödemesi alınmış siparişlerin toplamı (payment_status = paid), ödeme tarihine
 * (paid_at) göre ve İstanbul saatiyle gruplanır. İptal/iade edilenler ciroya girmez.
 */
const TZ = "Europe/Istanbul";
const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const MONTHS_LONG = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

type Num = { v: number };
const one = async <T,>(q: Promise<{ rows: T[] }>) => (await q).rows[0];

export async function SalesReport() {
  const local = sql.raw(`(now() at time zone '${TZ}')`);
  const paidLocal = sql.raw(`(paid_at at time zone '${TZ}')`);
  const [thisMonth, lastMonth, today, week, open, monthly, top] = await Promise.all([
    one<{ total: number; n: number }>(
      db.execute(sql`select coalesce(sum(grand_total),0)::float as total, count(*)::int as n from orders where payment_status = 'paid' and ${paidLocal} >= date_trunc('month', ${local})`) as never,
    ),
    one<{ total: number; n: number }>(
      db.execute(
        sql`select coalesce(sum(grand_total),0)::float as total, count(*)::int as n from orders where payment_status = 'paid' and ${paidLocal} >= date_trunc('month', ${local}) - interval '1 month' and ${paidLocal} < date_trunc('month', ${local})`,
      ) as never,
    ),
    one<Num>(db.execute(sql`select coalesce(sum(grand_total),0)::float as v from orders where payment_status = 'paid' and ${paidLocal} >= date_trunc('day', ${local})`) as never),
    one<Num>(db.execute(sql`select coalesce(sum(grand_total),0)::float as v from orders where payment_status = 'paid' and ${paidLocal} >= date_trunc('day', ${local}) - interval '6 days'`) as never),
    one<{ n: number; total: number }>(
      db.execute(sql`select count(*)::int as n, coalesce(sum(grand_total),0)::float as total from orders where payment_status in ('pending','awaiting_transfer') and status not in ('cancelled','refunded')`) as never,
    ),
    db.execute(
      sql`select to_char(m, 'YYYY-MM') as ym, coalesce(sum(o.grand_total),0)::float as total, count(o.id)::int as n
          from generate_series(date_trunc('month', ${local}) - interval '11 months', date_trunc('month', ${local}), interval '1 month') m
          left join orders o on o.payment_status = 'paid' and date_trunc('month', (o.paid_at at time zone ${TZ})) = m
          group by m order by m`,
    ) as unknown as Promise<{ rows: { ym: string; total: number; n: number }[] }>,
    db.execute(
      sql`select oi.name, sum(oi.quantity)::int as qty, sum(oi.line_total)::float as total
          from order_items oi join orders o on o.id = oi.order_id
          where o.payment_status = 'paid' and (o.paid_at at time zone ${TZ}) >= date_trunc('month', ${local})
          group by oi.name order by qty desc, total desc limit 5`,
    ) as unknown as Promise<{ rows: { name: string; qty: number; total: number }[] }>,
  ]);

  const cur = thisMonth ?? { total: 0, n: 0 };
  const prev = lastMonth ?? { total: 0, n: 0 };
  const change = prev.total > 0 ? ((cur.total - prev.total) / prev.total) * 100 : null;
  const avg = cur.n ? cur.total / cur.n : 0;
  const months = monthly.rows;
  const max = Math.max(1, ...months.map((m) => m.total));
  const nowMonth = MONTHS_LONG[Number(months.at(-1)?.ym.slice(5, 7) ?? 1) - 1];

  return (
    <section aria-labelledby="rapor-baslik" className="mb-8 grid gap-4 xl:grid-cols-[1.15fr_1fr]">
      {/* Bu ay */}
      <div className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="rapor-baslik" className="flex items-center gap-2 text-sm font-bold tracking-wide text-neutral-500 uppercase">
            <CalendarDays aria-hidden="true" className="h-4 w-4" /> {nowMonth} ayı satışları
          </h2>
          <Link href="/admin/siparisler?odeme=paid" className="text-sm font-semibold text-brand-ink hover:underline">
            Ödenen siparişler →
          </Link>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-x-4 gap-y-2">
          <p className="font-display text-[2.6rem] leading-none font-extrabold tabular-nums">{formatPrice(cur.total)}</p>
          {change === null ? (
            <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-bold text-neutral-600">
              <Minus aria-hidden="true" className="h-3.5 w-3.5" /> Geçen ay satış yok
            </span>
          ) : (
            <span className={`mb-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${change >= 0 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
              {change >= 0 ? <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" /> : <ArrowDownRight aria-hidden="true" className="h-3.5 w-3.5" />}
              %{Math.abs(change).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} geçen aya göre
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-neutral-500">Geçen ay: {formatPrice(prev.total)} · {prev.n} sipariş</p>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { k: "Bu ay sipariş", v: String(cur.n), icon: ShoppingBag },
            { k: "Ortalama sepet", v: formatPrice(avg), icon: Wallet },
            { k: "Bugün", v: formatPrice(today?.v ?? 0), icon: Clock },
            { k: "Son 7 gün", v: formatPrice(week?.v ?? 0), icon: CalendarDays },
          ].map((s) => (
            <div key={s.k} className="rounded-md bg-neutral-50 p-3">
              <dt className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
                <s.icon aria-hidden="true" className="h-3.5 w-3.5" /> {s.k}
              </dt>
              <dd className="mt-1 text-lg font-extrabold tabular-nums">{s.v}</dd>
            </div>
          ))}
        </dl>

        {open && open.n > 0 ? (
          <Link href="/admin/siparisler?odeme=pending" className="mt-4 flex items-center justify-between gap-3 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100">
            <span>
              <strong>{open.n}</strong> sipariş ödeme bekliyor
            </span>
            <span className="font-bold tabular-nums">{formatPrice(open.total)}</span>
          </Link>
        ) : null}

        {top.rows.length ? (
          <div className="mt-6">
            <h3 className="text-sm font-bold text-ink">Bu ay en çok satanlar</h3>
            <ol className="mt-2 divide-y divide-neutral-100">
              {top.rows.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 py-2 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-900">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{p.name}</span>
                  <span className="shrink-0 text-neutral-500">{p.qty} adet</span>
                  <span className="w-24 shrink-0 text-right font-semibold tabular-nums">{formatPrice(p.total)}</span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>

      {/* Son 12 ay */}
      <div className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-6">
        <h2 className="text-sm font-bold tracking-wide text-neutral-500 uppercase">Son 12 ay ciro</h2>
        <p className="mt-1 text-sm text-neutral-500">Toplam: {formatPrice(months.reduce((s, m) => s + m.total, 0))}</p>
        <figure className="mt-5">
          <div className="flex h-56 items-end gap-1.5 sm:gap-2" role="img" aria-label={`Son 12 ayın aylık cirosu; ${nowMonth}: ${formatPrice(cur.total)}`}>
            {months.map((m, i) => {
              const h = Math.max(m.total > 0 ? 4 : 1, Math.round((m.total / max) * 100));
              const last = i === months.length - 1;
              return (
                <div key={m.ym} className="group relative flex h-full flex-1 flex-col justify-end">
                  <span className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-md bg-ink px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-white opacity-0 transition-opacity group-hover:opacity-100">
                    {formatPrice(m.total)} · {m.n} sipariş
                  </span>
                  <div className={`w-full rounded-t-md transition-all ${last ? "bg-[linear-gradient(180deg,#1e8cf5,#0067d1)]" : "bg-sky-200 group-hover:bg-sky-300"}`} style={{ height: `${h}%` }} />
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex gap-1.5 sm:gap-2">
            {months.map((m) => (
              <span key={m.ym} className="flex-1 text-center text-[11px] text-neutral-500">
                {MONTHS[Number(m.ym.slice(5, 7)) - 1]}
              </span>
            ))}
          </div>
          <figcaption className="sr-only">
            {months.map((m) => `${MONTHS_LONG[Number(m.ym.slice(5, 7)) - 1]} ${m.ym.slice(0, 4)}: ${formatPrice(m.total)}`).join(", ")}
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
