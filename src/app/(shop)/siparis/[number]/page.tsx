import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, CreditCard, Landmark, ShieldCheck } from "lucide-react";
import { privateMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings";
import { getCustomer } from "@/lib/auth/customer";
import { getOrderForViewer, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/commerce/orders";
import { PAYMENT_LABELS } from "@/lib/payments/registry";
import { formatPrice } from "@/lib/commerce/money";
import { formatDateTime } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";
import { PurchaseTracker } from "@/components/commerce/PurchaseTracker";

export const metadata = privateMetadata("Sipariş");
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; odeme?: string }> };

/** Sipariş onay / detay sayfası. Erişim: sipariş bağlantısındaki gizli anahtar veya siparişin sahibi olan oturum. */
export default async function OrderPage({ params, searchParams }: Props) {
  const { number } = await params;
  const { t, odeme } = await searchParams;
  const customer = await getCustomer();
  const data = await getOrderForViewer(number.toUpperCase(), { token: t, customerId: customer?.id });
  if (!data) notFound();
  const { order: o, items, events } = data;
  const settings = await getSiteSettings();
  const bank = settings.payments.bankTransfer;
  const awaitingTransfer = o.paymentProvider === "bank_transfer" && o.paymentStatus === "awaiting_transfer";
  // Kartla ödeme (iyzico): ödeme tamamlanmadıysa "Siparişiniz alındı" denmez; satın alma olayı yalnızca ödeme alınınca
  const isCard = o.paymentProvider === "iyzico";
  const cardPaid = isCard && o.paymentStatus === "paid";
  const cardOpen = isCard && !cardPaid && !["cancelled", "refunded"].includes(o.status);
  const inReview = cardOpen && odeme === "inceleme";
  const retryAction = `/api/payments/iyzico/tekrar?n=${encodeURIComponent(o.orderNumber)}&t=${encodeURIComponent(t ?? "")}`;

  return (
    <div className="shell max-w-5xl pt-8 pb-20 sm:pt-12">
      {!isCard || cardPaid ? (
      <PurchaseTracker
        orderNumber={o.orderNumber}
        value={o.grandTotal}
        shipping={o.shippingTotal}
        coupon={o.couponCode}
        items={items.map((i) => ({ id: i.productId ?? i.id, sku: i.sku, name: i.name, price: i.unitPrice, category: i.categoryName, variant: i.variantLabel, quantity: i.quantity }))}
      />
      ) : null}
      <div className="text-center">
        {cardOpen && !inReview ? (
          <>
            <span aria-hidden="true" className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-coral-50 text-coral-ink">
              <AlertCircle className="h-10 w-10" />
            </span>
            <h1 className="display-2 mt-6">Ödemeniz tamamlanmadı</h1>
            <p className="lead mx-auto mt-3 max-w-xl">
              Siparişiniz <strong className="text-ink">{o.orderNumber}</strong> numarasıyla ayrıldı ancak kart ödemesi henüz alınmadı. Aşağıdan ödemeyi güvenle tamamlayabilirsiniz.
            </p>
          </>
        ) : inReview ? (
          <>
            <span aria-hidden="true" className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sun-50 text-sun-ink">
              <ShieldCheck className="h-10 w-10" />
            </span>
            <h1 className="display-2 mt-6">Ödemeniz kontrol ediliyor</h1>
            <p className="lead mx-auto mt-3 max-w-xl">
              Sipariş numaranız <strong className="text-ink">{o.orderNumber}</strong>. Ödemeniz iyzico tarafından güvenlik kontrolünden geçiyor; onaylandığında siparişiniz hazırlanmaya başlayacak. Tekrar ödeme yapmanıza gerek yok.
            </p>
          </>
        ) : (
          <>
            <span aria-hidden="true" className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-leaf-50 text-leaf-ink">
              <CheckCircle2 className="h-10 w-10" />
            </span>
            <h1 className="display-2 mt-6">{cardPaid ? "Ödemeniz alındı, teşekkürler!" : "Siparişiniz alındı"}</h1>
            <p className="lead mx-auto mt-3 max-w-xl">
              Teşekkürler {o.firstName}! Sipariş numaranız <strong className="text-ink">{o.orderNumber}</strong>. Sipariş özetini <strong className="text-ink">{o.email}</strong> adresine de ileteceğiz.
            </p>
          </>
        )}
      </div>

      {cardOpen && !inReview ? (
        <section aria-label="Kartla ödeme" className="mx-auto mt-8 max-w-xl rounded-lg bg-white p-6 text-center shadow-soft ring-1 ring-line sm:p-8">
          {odeme === "baslatilamadi" ? (
            <p className="mb-4 rounded-md bg-sun-50 px-4 py-3 text-sm font-bold text-sun-ink">
              Ödeme sayfası şu anda açılamadı; kartınızdan herhangi bir tutar çekilmedi. Lütfen biraz sonra tekrar deneyin ya da bizimle iletişime geçin.
            </p>
          ) : odeme === "hata" ? (
            <p className="mb-4 rounded-md bg-coral-50 px-4 py-3 text-sm font-bold text-coral-ink">
              Ödeme işlemi tamamlanamadı. Kart bilgilerinizi kontrol edip tekrar deneyebilir ya da farklı bir kart kullanabilirsiniz.
            </p>
          ) : null}
          <p className="text-sm text-ink-soft">Ödenecek tutar</p>
          <p className="mt-1 font-display text-3xl font-extrabold tabular-nums">{formatPrice(o.grandTotal)}</p>
          <form method="post" action={retryAction} className="mt-5">
            <button type="submit" className="btn-primary min-h-13 w-full text-base">
              <CreditCard aria-hidden="true" className="h-5 w-5" /> Ödemeyi tamamla
            </button>
          </form>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted">
            <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" /> iyzico güvenli ödeme sayfasına yönlendirilirsiniz; kart bilgileriniz sitemizde saklanmaz.
          </p>
        </section>
      ) : null}

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Info label="Sipariş durumu" value={ORDER_STATUS_LABELS[o.status]} />
        <Info label="Ödeme" value={`${PAYMENT_LABELS[o.paymentProvider] ?? o.paymentProvider} · ${PAYMENT_STATUS_LABELS[o.paymentStatus]}`} />
        <Info label="Tarih" value={formatDateTime(o.createdAt)} />
      </div>

      {awaitingTransfer && bank.iban ? (
        <section aria-labelledby="havale" className="mt-8 rounded-lg bg-sun-50 p-6 sm:p-8">
          <h2 id="havale" className="flex items-center gap-3 font-display text-2xl font-extrabold">
            <Landmark aria-hidden="true" className="h-6 w-6 text-sun-ink" /> Havale / EFT bilgileri
          </h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            {bank.bankName ? <Info label="Banka" value={bank.bankName} plain /> : null}
            <Info label="Alıcı" value={bank.accountHolder ?? ""} plain />
            <Info label="IBAN" value={bank.iban} plain mono />
            <Info label="Tutar" value={formatPrice(o.grandTotal)} plain />
          </dl>
          <p className="mt-5 text-sm font-bold text-sun-ink">Açıklama alanına sipariş numaranızı ({o.orderNumber}) yazmayı unutmayın.</p>
          {bank.note ? <p className="mt-2 text-sm text-ink-soft">{bank.note}</p> : null}
        </section>
      ) : o.paymentStatus === "pending" && !isCard ? (
        <p className="mt-8 flex items-start gap-3 rounded-md bg-cream p-4 text-sm text-ink-soft">
          <Clock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> Ödemeniz onaylandığında siparişiniz hazırlanmaya başlayacak.
        </p>
      ) : null}

      <div className="mt-10 grid gap-10 lg:grid-cols-12">
        <section aria-labelledby="urunler" className="lg:col-span-7">
          <h2 id="urunler" className="display-3">
            Ürünler
          </h2>
          <ul className="mt-5 divide-y divide-line border-y border-line">
            {items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 py-4">
                <span className="shot relative h-20 w-16 shrink-0 overflow-hidden rounded-sm">
                  {i.imageUrl ? <SafeImage src={i.imageUrl} alt={i.name} fill sizes="64px" className="object-cover" /> : null}
                </span>
                <span className="min-w-0 flex-1">
                  {i.slug ? (
                    <Link href={`/urun/${i.slug}`} className="font-bold hover:text-brand-ink">
                      {i.name}
                    </Link>
                  ) : (
                    <span className="font-bold">{i.name}</span>
                  )}
                  {i.variantLabel ? <span className="block text-sm text-muted">{i.variantLabel}</span> : null}
                  <span className="block text-sm text-ink-soft tabular-nums">
                    {i.quantity} × {formatPrice(i.unitPrice)}
                  </span>
                </span>
                <span className="font-extrabold tabular-nums">{formatPrice(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-5 space-y-2 text-[15px]">
            <Row label="Ara toplam" value={formatPrice(o.subtotal)} />
            {o.discountTotal > 0 ? <Row label={`İndirim${o.couponCode ? ` (${o.couponCode})` : ""}`} value={`-${formatPrice(o.discountTotal)}`} /> : null}
            <Row
              label={o.carrier ? `Kargo (${o.carrier})` : "Kargo"}
              value={o.shippingTotal > 0 ? formatPrice(o.shippingTotal) : !o.carrier && settings.shipping.flatFee == null && settings.shipping.freeThreshold == null ? "Ayrıca bildirilecek" : "Ücretsiz"}
            />
            <Row label="Toplam" value={formatPrice(o.grandTotal)} strong />
          </dl>
        </section>
        <aside className="space-y-6 lg:col-span-5">
          <div className="rounded-lg bg-cream p-6">
            <h2 className="font-display text-xl font-extrabold">Teslimat adresi</h2>
            <address className="mt-3 text-[15px] leading-relaxed text-ink-soft not-italic">
              {o.shippingAddress.firstName} {o.shippingAddress.lastName}
              <br />
              {o.shippingAddress.addressLine}
              <br />
              {o.shippingAddress.district} / {o.shippingAddress.city} {o.shippingAddress.postalCode ?? ""}
              <br />
              {o.shippingAddress.phone}
            </address>
          </div>
          {events.length ? (
            <div className="rounded-lg bg-white p-6 ring-1 ring-line">
              <h2 className="font-display text-xl font-extrabold">Sipariş geçmişi</h2>
              <ol className="mt-4 space-y-3 text-sm">
                {events.map((e) => (
                  <li key={e.id} className="flex gap-3">
                    <span aria-hidden="true" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                    <span>
                      <span className="block font-bold">{e.message}</span>
                      <span className="text-muted">{formatDateTime(e.createdAt)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          <Link href="/urunler" className="btn-outline w-full">
            Alışverişe devam et
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value, plain, mono }: { label: string; value: string; plain?: boolean; mono?: boolean }) {
  return (
    <div className={plain ? "" : "rounded-md bg-cream p-4"}>
      <dt className="text-xs font-bold tracking-wide text-muted uppercase">{label}</dt>
      <dd className={`mt-1 font-extrabold ${mono ? "font-mono text-[15px] tracking-wide break-all" : ""}`}>{value}</dd>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "border-t border-dashed border-line-strong pt-3 text-lg font-extrabold" : ""}`}>
      <dt className={strong ? "" : "text-ink-soft"}>{label}</dt>
      <dd className="font-bold tabular-nums">{value}</dd>
    </div>
  );
}
