import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { LogOut, MapPin, Package } from "lucide-react";
import { db } from "@/lib/db";
import { addresses, orders } from "@/lib/db/schema";
import { getCustomer } from "@/lib/auth/customer";
import { privateMetadata } from "@/lib/seo/metadata";
import { ORDER_STATUS_LABELS } from "@/lib/commerce/orders";
import { formatPrice } from "@/lib/commerce/money";
import { formatDate } from "@/lib/utils";
import { AuthForms } from "./AuthForms";
import { deleteAddressAction, logoutAction } from "./actions";

export const metadata = privateMetadata("Hesabım");
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ sonra?: string; bolum?: string }> };

export default async function AccountPage({ searchParams }: Props) {
  const sp = await searchParams;
  const customer = await getCustomer();
  const next = sp.sonra?.startsWith("/") && !sp.sonra.startsWith("//") ? sp.sonra : "/hesabim";

  if (!customer) {
    return (
      <div className="shell pt-8 pb-16 sm:pt-12">
        <h1 className="display-2">Hesabım</h1>
        <p className="lead mt-3">Giriş yapın veya birkaç saniyede hesap oluşturun.</p>
        <AuthForms next={next} />
      </div>
    );
  }

  const [myOrders, myAddresses] = await Promise.all([
    db.select().from(orders).where(eq(orders.customerId, customer.id)).orderBy(desc(orders.createdAt)).limit(50),
    db.select().from(addresses).where(eq(addresses.customerId, customer.id)).orderBy(desc(addresses.isDefault), desc(addresses.createdAt)),
  ]);

  return (
    <div className="shell pt-8 pb-16 sm:pt-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Hesabım</p>
          <h1 className="display-2">Merhaba {customer.firstName ?? ""}!</h1>
          <p className="mt-2 text-ink-soft">{customer.email}</p>
        </div>
        <form action={logoutAction}>
          <button type="submit" className="btn-outline btn-sm">
            <LogOut aria-hidden="true" className="h-4 w-4" /> Çıkış yap
          </button>
        </form>
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-12">
        <section aria-labelledby="siparislerim" className="lg:col-span-8">
          <h2 id="siparislerim" className="display-3 flex items-center gap-3">
            <Package aria-hidden="true" className="h-7 w-7 text-brand-ink" /> Siparişlerim
          </h2>
          {myOrders.length ? (
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {myOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/siparis/${o.orderNumber}`} className="flex flex-wrap items-center justify-between gap-3 py-4 hover:bg-cream sm:px-2">
                    <span>
                      <span className="block font-extrabold">{o.orderNumber}</span>
                      <span className="text-sm text-muted">{formatDate(o.createdAt)}</span>
                    </span>
                    <span className="rounded-full bg-cream px-3 py-1 text-sm font-bold">{ORDER_STATUS_LABELS[o.status]}</span>
                    <span className="font-extrabold tabular-nums">{formatPrice(o.grandTotal)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-md bg-cream p-6 text-ink-soft">
              Henüz siparişiniz yok.{" "}
              <Link href="/urunler" className="font-bold text-brand-ink underline">
                Alışverişe başlayın
              </Link>
              .
            </p>
          )}
        </section>

        <section aria-labelledby="adreslerim" className="lg:col-span-4">
          <h2 id="adreslerim" className="display-3 flex items-center gap-3">
            <MapPin aria-hidden="true" className="h-7 w-7 text-leaf-ink" /> Adreslerim
          </h2>
          {myAddresses.length ? (
            <ul className="mt-6 space-y-3">
              {myAddresses.map((a) => (
                <li key={a.id} className="rounded-md bg-white p-4 text-sm ring-1 ring-line">
                  <p className="font-extrabold">{a.title}</p>
                  <p className="mt-1 text-ink-soft">
                    {a.firstName} {a.lastName} · {a.phone}
                    <br />
                    {a.addressLine}, {a.district} / {a.city}
                  </p>
                  <form action={deleteAddressAction} className="mt-2">
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="text-sm font-bold text-danger underline underline-offset-2">
                      Sil
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-ink-soft">Kayıtlı adresiniz yok. Ödeme sırasında “Bu adresi hesabıma kaydet” seçeneğiyle ekleyebilirsiniz.</p>
          )}
        </section>
      </div>
    </div>
  );
}
