import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildEntityMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema, graph, itemListSchema } from "@/lib/schema/json-ld";
import { categoryTrail, descendantIds, getCategoryBySlug, getCategoryTree, getProductCards } from "@/lib/catalog/queries";
import { parseListingParams, type RawParams } from "@/lib/catalog/listing-params";
import { toAccent } from "@/lib/catalog/types";
import { sanitizeRichText } from "@/lib/sanitize";
import { JsonLd } from "@/components/seo/JsonLd";
import { FeltArt, motifFor } from "@/components/ui/FeltArt";
import { FaqList } from "@/components/ui/FaqList";
import { ProductListing } from "@/components/category/ProductListing";
import { isStudioShot } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCategoryBySlug(slug);
  if (!c) notFound();
  const parsed = parseListingParams(await searchParams);
  return buildEntityMetadata({
    name: c.name,
    // Başlık kalıbı: "{Kategori Adı} | Eğitici Çocuk Aktivite Kitleri | Bıcırıklar Kids"
    fallbackTitle: `${c.name} | Eğitici Çocuk Aktivite Kitleri | Bıcırıklar Kids`,
    path: `/kategori/${c.slug}`,
    seo: c,
    fallbackDescription: [c.description, c.content],
    image: c.ogImage || `/og/kategori/${c.slug}`,
    imageAlt: c.imageAlt || c.name,
    forceNoIndex: parsed.hasFilters || parsed.page > 1,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const [c, tree] = await Promise.all([getCategoryBySlug(slug), getCategoryTree()]);
  if (!c) notFound();
  const node = tree.byId.get(c.id);
  if (!node) notFound();

  const parsed = parseListingParams(sp);
  const trail = categoryTrail(node, tree.byId);
  const crumbs = [{ name: "Ana Sayfa", path: "/" }, { name: "Kategoriler", path: "/kategoriler" }, ...trail.map((t) => ({ name: t.name, path: `/kategori/${t.slug}` }))];
  const ids = descendantIds(node);
  const accent = toAccent(c.accent);
  const content = sanitizeRichText(c.content);
  const faq = c.faq.filter((f) => f.question && f.answer);
  const firstPage = await getProductCards({ categoryIds: ids }, "onerilen", 24);

  const header = (
    <header className={`tint-${accent} grid overflow-hidden rounded-xl md:grid-cols-[1.25fr_1fr]`} style={{ background: "var(--tint)" }}>
      <div className="p-6 sm:p-10 lg:p-14">
        <p className="eyebrow mb-3" style={{ color: "var(--tint-ink)" }}>
          {node.productCount ? `${node.productCount} ürün` : "Kategori"}
        </p>
        <h1 className="display-2">{c.name}</h1>
        {c.description ? <p className="lead mt-4 max-w-xl">{c.description}</p> : null}
        {node.children.length ? (
          <ul className="mt-6 flex flex-wrap gap-2" aria-label="Alt kategoriler">
            {node.children.map((ch) => (
              <li key={ch.id}>
                <Link href={`/kategori/${ch.slug}`} className="inline-flex min-h-10 items-center rounded-full bg-white px-4 text-sm font-bold shadow-soft hover:bg-ink hover:text-white">
                  {ch.name}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="shot relative hidden min-h-64 md:block">
        {c.image ? <Image src={c.image} alt={c.imageAlt || c.name} fill priority sizes="40vw" className={isStudioShot(c.image) ? "object-contain p-4" : "object-cover"} /> : <FeltArt accent={accent} motif={motifFor(c.slug)} />}
      </div>
    </header>
  );

  return (
    <>
      <JsonLd data={graph(breadcrumbSchema(crumbs), itemListSchema(c.name, `/kategori/${c.slug}`, firstPage.filter((p) => !p.isDemo)), faq.length ? faqSchema(faq) : null)} />
      <ProductListing
        title={c.name}
        basePath={`/kategori/${c.slug}`}
        crumbs={crumbs}
        baseFilters={{ categoryIds: ids }}
        parsed={parsed}
        searchParams={sp}
        listId={`category-${c.slug}`}
        header={header}
      >
        {content || faq.length ? (
          <section aria-label={`${c.name} hakkında`} className="mt-20 grid gap-12 border-t border-line pt-14 lg:grid-cols-12">
            {content ? <div className="prose rich lg:col-span-7" dangerouslySetInnerHTML={{ __html: content }} /> : null}
            {faq.length ? (
              <div className={content ? "lg:col-span-5" : "lg:col-span-8"}>
                <h2 className="display-3 mb-4">Sıkça sorulan sorular</h2>
                <FaqList items={faq} />
              </div>
            ) : null}
          </section>
        ) : null}
      </ProductListing>
    </>
  );
}

