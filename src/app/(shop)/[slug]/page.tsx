import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Truck } from "lucide-react";
import { getPageBySlug } from "@/lib/content/queries";
import { getSiteSettings } from "@/lib/settings";
import { buildEntityMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema, graph } from "@/lib/schema/json-ld";
import { sanitizeRichText } from "@/lib/sanitize";
import { formatPrice } from "@/lib/commerce/money";
import { formatDate } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { FaqList } from "@/components/ui/FaqList";

/** Admin › Sayfalar'dan yönetilen içerik sayfaları (yasal metinler, Hakkımızda, Kargo ve Teslimat…). */
export const revalidate = 600;
export const dynamicParams = true;

/** Boş liste → tüm sayfalar ilk istekte üretilip ISR ile önbelleklenir. */
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageBySlug(slug);
  if (!page) notFound();
  return buildEntityMetadata({ name: page.title, path: `/${page.slug}`, seo: page, fallbackDescription: [page.excerpt, page.content] });
}

export default async function ContentPage({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9-]+$/.test(slug)) notFound();
  const page = await getPageBySlug(slug);
  if (!page) notFound();
  const settings = await getSiteSettings();
  const html = sanitizeRichText(page.content);
  const crumbs = [
    { name: "Ana Sayfa", path: "/" },
    { name: page.title, path: `/${page.slug}` },
  ];
  const faq = page.faq.filter((f) => f.question && f.answer);
  const isShipping = page.slug === "kargo-ve-teslimat";

  return (
    <article className="shell pt-4 pb-16 sm:pt-6">
      <JsonLd data={graph(breadcrumbSchema(crumbs), faq.length ? faqSchema(faq) : null)} />
      <Breadcrumbs items={crumbs} className="mb-6" />
      <div className="mx-auto max-w-3xl">
        <header>
          {page.kind === "legal" ? <p className="eyebrow mb-3">Yasal</p> : null}
          <h1 className="display-2">{page.title}</h1>
          {page.excerpt ? <p className="lead mt-4">{page.excerpt}</p> : null}
          <p className="mt-4 text-sm text-muted">
            Son güncelleme: <time dateTime={page.updatedAt.toISOString()}>{formatDate(page.updatedAt)}</time>
          </p>
        </header>
        {isShipping ? (
          <dl className="mt-8 grid gap-4 rounded-lg bg-leaf-50 p-6 sm:grid-cols-3">
            <div>
              <dt className="flex items-center gap-2 text-xs font-bold tracking-wide text-leaf-ink uppercase">
                <Truck aria-hidden="true" className="h-4 w-4" /> Kargo ücreti
              </dt>
              <dd className="mt-1 font-extrabold">{settings.shipping.flatFee != null ? formatPrice(settings.shipping.flatFee) : "Sipariş onayında bildirilir"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold tracking-wide text-leaf-ink uppercase">Ücretsiz kargo</dt>
              <dd className="mt-1 font-extrabold">{settings.shipping.freeThreshold != null ? `${formatPrice(settings.shipping.freeThreshold)} ve üzeri` : "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold tracking-wide text-leaf-ink uppercase">Kargoya teslim</dt>
              <dd className="mt-1 font-extrabold">{settings.shipping.dispatchTime ?? "—"}</dd>
            </div>
          </dl>
        ) : null}
        <div className="prose rich mt-10 sm:prose-lg" dangerouslySetInnerHTML={{ __html: html }} />
        {faq.length ? (
          <section className="mt-14">
            <h2 className="display-3 mb-4">Sıkça sorulan sorular</h2>
            <FaqList items={faq} />
          </section>
        ) : null}
      </div>
    </article>
  );
}
