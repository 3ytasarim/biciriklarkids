import Link from "next/link";
import { getSiteSettings } from "@/lib/settings";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema, graph } from "@/lib/schema/json-ld";
import { BRAND_FAQ } from "@/lib/content/brand-faq";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FaqList } from "@/components/ui/FaqList";

export const revalidate = 600;

export function generateMetadata() {
  return buildStaticPageMetadata("faq");
}

export default async function FaqPage() {
  const settings = await getSiteSettings();
  const crumbs = [
    { name: "Ana Sayfa", path: "/" },
    { name: "Sıkça Sorulan Sorular", path: "/sss" },
  ];
  const all = [...settings.siteFaq, ...BRAND_FAQ];
  return (
    <div className="shell pt-4 pb-16 sm:pt-6">
      <JsonLd data={graph(breadcrumbSchema(crumbs), faqSchema(all))} />
      <Breadcrumbs items={crumbs} className="mb-6" />
      <div className="mx-auto max-w-3xl">
        <h1 className="display-2">Sıkça sorulan sorular</h1>
        <p className="lead mt-4">Sipariş, kargo, iade ve kitlerin kullanımıyla ilgili en çok sorulanlar. Cevabını bulamadığınız bir soru için <Link href="/iletisim" className="font-bold text-brand-ink underline underline-offset-2">bize yazın</Link>.</p>
        {settings.siteFaq.length ? (
          <section className="mt-12">
            <h2 className="display-3 mb-4">Sipariş ve teslimat</h2>
            <FaqList items={settings.siteFaq} />
          </section>
        ) : null}
        <section className="mt-12">
          <h2 className="display-3 mb-4">Ürünler ve kullanım</h2>
          <FaqList items={BRAND_FAQ} />
        </section>
      </div>
    </div>
  );
}
