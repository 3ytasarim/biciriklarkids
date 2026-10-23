import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { buildEntityMetadata, deriveDescription } from "@/lib/seo/metadata";
import { getPostBySlug, listPosts } from "@/lib/content/queries";
import { articleSchema, breadcrumbSchema, graph } from "@/lib/schema/json-ld";
import { sanitizeRichText } from "@/lib/sanitize";
import { formatDate } from "@/lib/utils";
import { getProductCards } from "@/lib/catalog/queries";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PostCardView } from "@/components/blog/PostCardView";
import { ProductRailSection } from "@/components/homepage/ProductRailSection";

export const revalidate = 300;

export async function generateStaticParams() {
  const rows = await db
    .select({ slug: blogPosts.slug })
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .limit(300)
    .catch(() => []);
  return rows.map((r) => ({ slug: r.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const row = await getPostBySlug((await params).slug);
  if (!row) notFound();
  const p = row.post;
  return buildEntityMetadata({
    name: p.title,
    path: `/blog/${p.slug}`,
    seo: p,
    fallbackDescription: [p.excerpt, p.content],
    image: p.coverImage || `/og/blog/${p.slug}`,
    imageAlt: p.coverImageAlt || p.title,
    type: "article",
    publishedTime: p.publishedAt,
    modifiedTime: p.updatedAt,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const row = await getPostBySlug((await params).slug);
  if (!row) notFound();
  const { post: p, category } = row;
  const html = sanitizeRichText(p.content);
  const [{ items: recent }, products] = await Promise.all([listPosts({ limit: 4 }), getProductCards({ featured: true }, "onerilen", 4)]);
  const related = recent.filter((r) => r.id !== p.id).slice(0, 3);
  const crumbs = [
    { name: "Ana Sayfa", path: "/" },
    { name: "Blog / İlham", path: "/blog" },
    ...(category ? [{ name: category.name, path: `/blog/kategori/${category.slug}` }] : []),
    { name: p.title, path: `/blog/${p.slug}` },
  ];

  return (
    <>
      <JsonLd
        data={graph(
          articleSchema({
            title: p.title,
            slug: p.slug,
            description: p.seoDescription || p.excerpt || deriveDescription(p.content),
            image: p.coverImage,
            publishedAt: p.publishedAt ?? p.createdAt,
            updatedAt: p.updatedAt,
            authorName: p.authorName,
            categoryName: category?.name ?? null,
            tags: p.tags,
          }),
          breadcrumbSchema(crumbs),
        )}
      />
      <article className="pt-4 pb-10 sm:pt-6">
        <div className="shell">
          <Breadcrumbs items={crumbs} className="mb-8" />
          <header className="mx-auto max-w-3xl text-center">
            {category ? (
              <Link href={`/blog/kategori/${category.slug}`} className="eyebrow justify-center hover:underline">
                {category.name}
              </Link>
            ) : null}
            <h1 className="display-2 mt-3">{p.title}</h1>
            {p.excerpt ? <p className="lead mt-5">{p.excerpt}</p> : null}
            <p className="mt-5 text-sm font-bold text-muted">
              {p.authorName ? <span>{p.authorName} · </span> : null}
              {p.publishedAt ? <time dateTime={p.publishedAt.toISOString()}>{formatDate(p.publishedAt)}</time> : null}
              {p.readingMinutes ? <span> · {p.readingMinutes} dk okuma</span> : null}
            </p>
          </header>
          {p.coverImage ? (
            <div className="relative mx-auto mt-10 aspect-[16/9] max-w-5xl overflow-hidden rounded-xl bg-cream">
              <Image src={p.coverImage} alt={p.coverImageAlt || p.title} fill priority sizes="(min-width: 1024px) 1024px, 100vw" className="object-cover" />
            </div>
          ) : null}
          <div className="prose rich mx-auto mt-12 max-w-3xl sm:prose-lg" dangerouslySetInnerHTML={{ __html: html }} />
          {p.tags.length ? (
            <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap gap-2" aria-label="Etiketler">
              {p.tags.map((t) => (
                <li key={t} className="rounded-full bg-cream px-3 py-1 text-sm font-bold text-ink-soft">
                  #{t}
                </li>
              ))}
            </ul>
          ) : null}
          {p.authorName ? (
            <aside aria-label="Yazar" className="mx-auto mt-12 max-w-3xl rounded-lg bg-cream p-6">
              <p className="text-xs font-extrabold tracking-wider text-muted uppercase">Yazar</p>
              <p className="mt-1 font-display text-xl font-extrabold">{p.authorName}</p>
              {p.authorBio ? <p className="mt-2 text-[15px] text-ink-soft">{p.authorBio}</p> : null}
            </aside>
          ) : null}
        </div>
      </article>
      <ProductRailSection id="blog-urunler" eyebrow="Kitlerimiz" title="Bu yazıyla birlikte deneyin" products={products} link={{ href: "/urunler", label: "Tüm ürünler" }} tinted />
      {related.length ? (
        <section aria-labelledby="related-posts" className="py-16">
          <div className="shell">
            <h2 id="related-posts" className="display-3">
              Diğer yazılar
            </h2>
            <ul className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <li key={r.id}>
                  <PostCardView post={r} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
