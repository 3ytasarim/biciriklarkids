import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { addresses } from "@/lib/db/schema";
import { privateMetadata } from "@/lib/seo/metadata";
import { getSiteSettings } from "@/lib/settings";
import { enabledPaymentMethods } from "@/lib/payments/registry";
import { getCustomer } from "@/lib/auth/customer";
import { CheckoutForm } from "@/components/commerce/CheckoutForm";

export const metadata = privateMetadata("Ödeme");
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [settings, customer] = await Promise.all([getSiteSettings(), getCustomer()]);
  const [address] = customer
    ? await db.select().from(addresses).where(and(eq(addresses.customerId, customer.id))).orderBy(desc(addresses.isDefault), desc(addresses.createdAt)).limit(1)
    : [];
  const bank = settings.payments.bankTransfer;
  return (
    <CheckoutForm
      paymentMethods={enabledPaymentMethods(settings)}
      loggedIn={Boolean(customer)}
      bankNote={bank.enabled ? bank.note : null}
      defaults={{
        email: customer?.email ?? "",
        phone: customer?.phone ?? address?.phone ?? "",
        firstName: customer?.firstName ?? address?.firstName ?? "",
        lastName: customer?.lastName ?? address?.lastName ?? "",
        city: address?.city ?? "",
        district: address?.district ?? "",
        postalCode: address?.postalCode ?? "",
        addressLine: address?.addressLine ?? "",
      }}
    />
  );
}
