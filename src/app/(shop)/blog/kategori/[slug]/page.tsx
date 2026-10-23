import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildEntityMetadata } from "@/lib/seo/metadata";
import { getBlogCategories, listPosts } from "@/lib/content/queries";
import { breadcrumbSchema, graph } from "@/lib/schema/json-ld";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PostCardView } from "@/components/blog/PostCardView";

export const revalidate = 300;

export function generateStaticParams() {
  return [];
}
type Props = { params: Promise<{ slug: string }> };

async function load(slug: string) {
  const cats = await getBlogCategories();
  return { cat: cats.find((c) => c.slug === slug) ?? null, cats };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { cat } = await load((await params).slug);
  if (!cat) notFound();
  return buildEntityMetadata({ name: `${cat.name} — Blog`, path: `/blog/kategori/${cat.slug}`, seo: cat, fallbackDescription: [cat.description] });
}

export default async function BlogCategoryPage({ params }: Props) {
  const { cat, cats } = await load((await params).slug);
  if (!cat) notFound();
  const { items } = await listPosts({ categoryId: cat.id, limit: 30 });
  const crumbs = [
    { name: "Ana Sayfa", path: "/" },
    { name: "Blog / İlham", path: "/blog" },
    { name: cat.name, path: `/blog/kategori/${cat.slug}` },
  ];
  return (
    <div className="shell pt-4 pb-16 sm:pt-6">
      <JsonLd data={graph(breadcrumbSchema(crumbs))} />
      <Breadcrumbs items={crumbs} className="mb-6" />
      <h1 className="display-2">{cat.name}</h1>
      {cat.description ? <p className="lead mt-4 max-w-3xl">{cat.description}</p> : null}
      <ul className="mt-8 flex flex-wrap gap-2">
        <li>
          <Link href="/blog" className="inline-flex min-h-10 items-center rounded-full bg-cream px-4 text-sm font-bold hover:bg-sand">
            Tümü
          </Link>
        </li>
        {cats.map((c) => (
          <li key={c.id}>
            <Link href={`/blog/kategori/${c.slug}`} aria-current={c.id === cat.id ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold ${c.id === cat.id ? "bg-ink text-white" : "bg-cream hover:bg-sand"}`}>
              {c.name}
            </Link>
          </li>
        ))}
      </ul>
      {items.length ? (
        <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.id}>
              <PostCardView post={p} headingLevel="h2" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-12 rounded-md bg-cream p-6 text-ink-soft">Bu kategoride henüz yazı yok.</p>
      )}
    </div>
  );
}
