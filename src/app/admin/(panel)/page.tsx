import { enabledPaymentMethods } from "@/lib/payments/registry";
import Link from "next/link";
import { and, count, desc, eq, gte, lte, ne, sql } from "drizzle-orm";
import { AlertTriangle, CheckCircle2, CircleDashed, Inbox, MessageSquareQuote, Package, Receipt, TrendingUp, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { contactMessages, orders, pages, products, reviews, videos } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { getSiteSettings, resolveAnalyticsIds } from "@/lib/settings";
import { ORDER_STATUS_LABELS, STATUS_TONE } from "@/lib/commerce/order-labels";
import { formatPrice } from "@/lib/commerce/money";
import { formatDateTime } from "@/lib/utils";
import { Badge, PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Panel" };

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000);

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ yetki?: string }> }) {
  const user = await requireAdmin();
  const since30 = daysAgo(30);
  const notCancelled = and(ne(orders.status, "cancelled"), ne(orders.status, "refunded"));
  const [[orderTotal], [orders30], [paid30], [activeProducts], [demoCount], lowStock, recent, [pendingReviews], [unread], [videoTest], [legalTodo], settings] = await Promise.all([
    db.select({ n: count() }).from(orders),
    db.select({ n: count() }).from(orders).where(and(gte(orders.createdAt, since30), notCancelled)),
    db.select({ sum: sql<number>`coalesce(sum(${orders.grandTotal}), 0)::float` }).from(orders).where(and(gte(orders.createdAt, since30), eq(orders.paymentStatus, "paid"))),
    db.select({ n: count() }).from(products).where(and(eq(products.status, "active"), eq(products.isDemo, false))),
    db.select({ n: count() }).from(products).where(eq(products.isDemo, true)),
    db
      .select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .where(and(eq(products.status, "active"), eq(products.trackStock, true), lte(products.stock, products.lowStockThreshold)))
      .orderBy(products.stock)
      .limit(8),
    db.select().from(orders).orderBy(desc(orders.createdAt)).limit(8),
    db.select({ n: count() }).from(reviews).where(eq(reviews.status, "pending")),
    db.select({ n: count() }).from(contactMessages).where(eq(contactMessages.isRead, false)),
    db.select({ n: count() }).from(videos).where(and(eq(videos.isActive, true), sql`${videos.desktopUrl} is null`)),
    db.select({ n: count() }).from(pages).where(sql`${pages.content} like '%NETLEŞTİRİLECEK%'`),
    getSiteSettings(),
  ]);
  const ids = resolveAnalyticsIds(settings.analytics);

  const setup = [
    { ok: Number(activeProducts?.n ?? 0) > 0, label: "Gerçek ürünler eklendi", href: "/admin/urunler/yeni" },
    { ok: Number(demoCount?.n ?? 0) === 0, label: `Demo ürünler temizlendi (${demoCount?.n ?? 0} demo var — npm run demo:clear)`, href: "/admin/urunler?durum=demo" },
    { ok: settings.shipping.flatFee != null || settings.shipping.freeThreshold != null, label: "Kargo ücreti / ücretsiz kargo eşiği tanımlandı", href: "/admin/ayarlar" },
    { ok: enabledPaymentMethods(settings).some((m) => m.id !== "dev_test"), label: "En az bir ödeme yöntemi açık (Havale/EFT veya kart entegrasyonu)", href: "/admin/ayarlar" },
    { ok: settings.announcement.items.every((i) => !i.text.includes("Admin ›")), label: "Duyuru çubuğu metni girildi (şu an yer tutucu)", href: "/admin/ayarlar" },
    { ok: Number(videoTest?.n ?? 0) === 0, label: `Videolar eklendi (${videoTest?.n ?? 0} alan “VideoTest” gösteriyor)`, href: "/admin/videolar" },
    { ok: Number(legalTodo?.n ?? 0) === 0, label: "Yasal metinlerdeki eksik bilgiler tamamlandı (iade kargo ücreti)", href: "/admin/sayfalar" },
    { ok: Boolean(ids.gtmId || ids.ga4Id), label: "Google Analytics / Tag Manager ID girildi", href: "/admin/ayarlar" },
    { ok: Boolean(settings.brand.logoUrl), label: "Logo yüklendi", href: "/admin/ayarlar" },
  ];

  const stats = [
    { label: "Toplam sipariş", value: String(orderTotal?.n ?? 0), href: "/admin/siparisler", icon: Receipt, tint: "tint-sky" },
    { label: "Son 30 gün sipariş", value: String(orders30?.n ?? 0), href: "/admin/siparisler", icon: TrendingUp, tint: "tint-lilac" },
    { label: "Son 30 gün tahsil edilen", value: formatPrice(Number(paid30?.sum ?? 0)), href: "/admin/siparisler?odeme=paid", icon: Wallet, tint: "tint-leaf" },
    { label: "Yayındaki ürün", value: String(activeProducts?.n ?? 0), href: "/admin/urunler?durum=active", icon: Package, tint: "tint-sun" },
    { label: "Onay bekleyen yorum", value: String(pendingReviews?.n ?? 0), href: "/admin/yorumlar", icon: MessageSquareQuote, tint: "tint-berry" },
    { label: "Okunmamış mesaj", value: String(unread?.n ?? 0), href: "/admin/mesajlar", icon: Inbox, tint: "tint-coral" },
  ];

  return (
    <>
      <PageHeader title={`Merhaba, ${user.name.split(" ")[0]}`} description="Bıcırıklar Kids mağaza özeti" />
      {(await searchParams).yetki === "yok" ? <p className="mb-6 rounded-md bg-amber-50 p-3 text-sm text-amber-900">Bu işlem için yetkiniz yok.</p> : null}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`group rounded-lg border border-neutral-200 bg-white p-4 transition-transform hover:-translate-y-0.5 ${s.tint}`}>
            <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: "var(--tint)", color: "var(--tint-ink)" }}>
              <s.icon className="h-5 w-5" />
            </span>
            <p className="mt-3 font-display text-[1.6rem] leading-none font-extrabold tabular-nums">{s.value}</p>
            <p className="mt-1.5 text-[13px] font-semibold text-ink/60">{s.label}</p>
          </Link>
        ))}
      </section>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_400px]">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Son siparişler</h2>
          <Table head={["Sipariş", "Müşteri", "Tarih", "Tutar", "Durum"]} empty={recent.length ? null : <p className="px-4 py-10 text-center text-sm text-neutral-500">Henüz sipariş yok.</p>}>
            {recent.map((o) => (
              <tr key={o.id} className="hover:bg-neutral-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/siparisler/${o.id}`} className="font-semibold hover:underline">
                    {o.orderNumber}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {o.firstName} {o.lastName}
                </td>
                <td className="px-4 py-3 text-neutral-600">{formatDateTime(o.createdAt)}</td>
                <td className="px-4 py-3 tabular-nums">{formatPrice(o.grandTotal)}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[o.status]}>{ORDER_STATUS_LABELS[o.status]}</Badge>
                </td>
              </tr>
            ))}
          </Table>
          <h2 className="mt-8 mb-3 flex items-center gap-2 text-lg font-semibold">
            <AlertTriangle aria-hidden="true" className="h-5 w-5 text-amber-600" /> Düşük stok
          </h2>
          {lowStock.length ? (
            <ul className="divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <Link href={`/admin/urunler/${p.id}`} className="hover:underline">
                    {p.name}
                  </Link>
                  <Badge tone={p.stock <= 0 ? "red" : "amber"}>{p.stock} adet</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-neutral-200 bg-white p-4 text-sm text-neutral-500">Düşük stoklu ürün yok.</p>
          )}
        </section>
        <section className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Yayın öncesi kontrol listesi</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {setup.map((s) => (
              <li key={s.label} className="flex items-start gap-2.5">
                {s.ok ? <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <CircleDashed aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
                {s.ok ? (
                  <span className="text-neutral-600">{s.label}</span>
                ) : (
                  <Link href={s.href} className="font-semibold hover:underline">
                    {s.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
