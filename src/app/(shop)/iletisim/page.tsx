import { Mail, MapPin, Phone } from "lucide-react";
import { getSiteSettings } from "@/lib/settings";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, graph, organizationSchema } from "@/lib/schema/json-ld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ContactForm } from "./ContactForm";

export const revalidate = 600;

export function generateMetadata() {
  return buildStaticPageMetadata("contact");
}

export default async function ContactPage() {
  const s = await getSiteSettings();
  const crumbs = [
    { name: "Ana Sayfa", path: "/" },
    { name: "İletişim", path: "/iletisim" },
  ];
  const address = [s.contact.street, s.contact.district && s.contact.city ? `${s.contact.district} / ${s.contact.city}` : s.contact.city].filter(Boolean).join(", ");
  return (
    <div className="shell pt-4 pb-16 sm:pt-6">
      <JsonLd data={graph(breadcrumbSchema(crumbs), organizationSchema(s))} />
      <Breadcrumbs items={crumbs} className="mb-6" />
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="display-2">Bize ulaşın</h1>
          <p className="lead mt-4">Siparişleriniz, ürünlerimiz ya da okul ve kurumlar için toplu alımlar hakkında sorularınızı yanıtlamaktan mutluluk duyarız.</p>
          <ul className="mt-10 space-y-5">
            {s.contact.phone ? (
              <li className="flex items-start gap-4">
                <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-ink">
                  <Phone className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-muted">Telefon</span>
                  <a href={`tel:${s.contact.phone.replace(/[^\d+]/g, "")}`} className="text-lg font-extrabold hover:text-brand-ink">
                    {s.contact.phone}
                  </a>
                </span>
              </li>
            ) : null}
            {s.contact.email ? (
              <li className="flex items-start gap-4">
                <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-50 text-sky-ink">
                  <Mail className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-muted">E-posta</span>
                  <a href={`mailto:${s.contact.email}`} className="text-lg font-extrabold break-all hover:text-brand-ink">
                    {s.contact.email}
                  </a>
                </span>
              </li>
            ) : null}
            {address ? (
              <li className="flex items-start gap-4">
                <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-leaf-50 text-leaf-ink">
                  <MapPin className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-muted">Adres</span>
                  <address className="text-lg font-extrabold not-italic">{address}</address>
                </span>
              </li>
            ) : null}
          </ul>
          {s.contact.workingHours ? <p className="mt-6 text-sm text-ink-soft">Çalışma saatleri: {s.contact.workingHours}</p> : null}
        </div>
        <div className="rounded-xl bg-cream p-6 sm:p-10 lg:col-span-7">
          <h2 className="display-3 mb-6">Mesaj gönderin</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  );
}
