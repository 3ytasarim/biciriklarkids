import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowRight, CalendarDays, Clock, ListTree, Tag } from "lucide-react";
import { db } from "@/lib/db";
import { blogPosts } from "@/lib/db/schema";
import { buildEntityMetadata, deriveDescription } from "@/lib/seo/metadata";
import { getBlogCategories, getPostBySlug, listPosts, type PostCard } from "@/lib/content/queries";
import { articleSchema, breadcrumbSchema, graph } from "@/lib/schema/json-ld";
import { sanitizeRichText } from "@/lib/sanitize";
import { slugify } from "@/lib/slug";
import { formatDate } from "@/lib/utils";
import { getProductCards } from "@/lib/catalog/queries";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ProductRailSection } from "@/components/homepage/ProductRailSection";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { SkyDrift } from "@/components/ui/Clouds";

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

/** h2'lere çapa id'si ekler ve içindekiler listesini çıkarır (içerik zaten sanitize edilmiş HTML). */
function withToc(html: string) {
  const toc: { id: string; text: string }[] = [];
  const used = new Set<string>();
  const out = html.replace(/<h2>([\s\S]*?)<\/h2>/g, (_m, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').trim();
    let id = slugify(text).slice(0, 60) || "bolum";
    while (used.has(id)) id += "-2";
    used.add(id);
    toc.push({ id, text });
    return `<h2 id="${id}">${inner}</h2>`;
  });
  return { html: out, toc };
}

function SidePost({ post, index }: { post: PostCard; index?: number }) {
  return (
    <li>
      <Link href={`/blog/${post.slug}`} className="group flex items-center gap-3.5 rounded-xl p-2 transition-colors hover:bg-cream">
        <span className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden rounded-lg bg-cream">
          {post.coverImage ? <Image src={post.coverImage} alt="" fill sizes="96px" className="object-cover transition-transform duration-500 group-hover:scale-110" /> : null}
          {index != null ? <span className="absolute top-1 left-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-xs font-extrabold text-brand-ink">{index}</span> : null}
        </span>
        <span className="min-w-0">
          <span className="line-clamp-2 text-[15px] leading-snug font-extrabold group-hover:text-brand-ink">{post.title}</span>
          {post.publishedAt ? (
            <time dateTime={post.publishedAt.toISOString()} className="mt-1 block text-xs font-bold text-muted">
              {formatDate(post.publishedAt)}
            </time>
          ) : null}
        </span>
      </Link>
    </li>
  );
}

export default async function BlogPostPage({ params }: Props) {
  const row = await getPostBySlug((await params).slug);
  if (!row) notFound();
  const { post: p, category } = row;
  const { html, toc } = withToc(sanitizeRichText(p.content));
  const [sameCat, { items: latest }, categories, products] = await Promise.all([
    p.categoryId ? listPosts({ categoryId: p.categoryId, limit: 4 }) : Promise.resolve({ items: [] as PostCard[] }),
    listPosts({ limit: 8 }),
    getBlogCategories(),
    getProductCards({ featured: true }, "onerilen", 4),
  ]);
  const related = sameCat.items.filter((r) => r.id !== p.id).slice(0, 3);
  const relatedIds = new Set([p.id, ...related.map((r) => r.id)]);
  const recent = latest.filter((r) => !relatedIds.has(r.id)).slice(0, 4);
  const crumbs = [
    { name: "Ana Sayfa", path: "/" },
    { name: "Blog / İlham", path: "/blog" },
    ...(category ? [{ name: category.name, path: `/blog/kategori/${category.slug}` }] : []),
    { name: p.title, path: `/blog/${p.slug}` },
  ];
  const initials = (p.authorName ?? "BK")
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toLocaleUpperCase("tr");

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
      <ReadingProgress targetId="yazi-govdesi" />

      {/* ── Başlık bandı ── */}
      <header className="relative isolate overflow-hidden bg-[linear-gradient(180deg,var(--color-brand-50),var(--color-paper))] pt-4 pb-10 sm:pt-6 sm:pb-14">
        <SkyDrift className="-z-10 opacity-70" />
        <div className="shell">
          <Breadcrumbs items={crumbs} />
          <div className="mx-auto mt-8 max-w-4xl text-center sm:mt-12">
            {category ? (
              <Link href={`/blog/kategori/${category.slug}`} className="eyebrow mx-auto animate-rise hover:border-brand">
                {category.name}
              </Link>
            ) : null}
            <h1 className="display-2 mt-5 animate-rise text-balance [animation-delay:80ms]">{p.title}</h1>
            {p.excerpt ? <p className="lead mx-auto mt-5 max-w-2xl animate-rise [animation-delay:160ms]">{p.excerpt}</p> : null}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm font-bold text-muted animate-rise [animation-delay:240ms]">
              {p.authorName ? (
                <span className="flex items-center gap-2.5 text-ink">
                  <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand),var(--color-berry))] text-xs font-extrabold text-white">
                    {initials}
                  </span>
                  {p.authorName}
                </span>
              ) : null}
              {p.publishedAt ? (
                <span className="flex items-center gap-1.5">
                  <CalendarDays aria-hidden="true" className="h-4 w-4" />
                  <time dateTime={p.publishedAt.toISOString()}>{formatDate(p.publishedAt)}</time>
                </span>
              ) : null}
              {p.readingMinutes ? (
                <span className="flex items-center gap-1.5">
                  <Clock aria-hidden="true" className="h-4 w-4" /> {p.readingMinutes} dk okuma
                </span>
              ) : null}
            </div>
          </div>
          {p.coverImage ? (
            <div className="relative mx-auto mt-10 aspect-[16/9] max-w-5xl animate-rise overflow-hidden rounded-[1.75rem] bg-cream shadow-[0_40px_80px_-40px_rgb(16_40_74/0.55)] ring-1 ring-white [animation-delay:300ms] sm:mt-12">
              <Image src={p.coverImage} alt={p.coverImageAlt || p.title} fill priority sizes="(min-width: 1100px) 1024px, 100vw" className="object-cover" />
            </div>
          ) : null}
        </div>
      </header>

      {/* ── Gövde + kenar çubuğu ── */}
      <div className="shell grid gap-12 py-12 sm:py-16 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-14 xl:gap-20">
        <article id="yazi-govdesi" className="min-w-0">
          <div className="prose rich blog-body max-w-[72ch] sm:prose-lg" dangerouslySetInnerHTML={{ __html: html }} />

          {p.tags.length ? (
            <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-line pt-8">
              <Tag aria-hidden="true" className="mr-1 h-4 w-4 text-muted" />
              <h2 className="sr-only">Etiketler</h2>
              <ul className="flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <li key={t} className="rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-bold text-brand-ink ring-1 ring-brand-100">
                    #{t}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {p.authorName ? (
            <aside aria-label="Yazar" className="mt-10 flex items-start gap-5 rounded-2xl bg-[linear-gradient(135deg,var(--color-brand-50),var(--color-berry-50))] p-6 sm:p-8">
              <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand),var(--color-berry))] text-lg font-extrabold text-white">
                {initials}
              </span>
              <div>
                <p className="text-xs font-extrabold tracking-wider text-muted uppercase">Yazar</p>
                <p className="mt-0.5 font-display text-xl font-extrabold">{p.authorName}</p>
                {p.authorBio ? <p className="mt-2 text-[15px] text-ink-soft">{p.authorBio}</p> : null}
              </div>
            </aside>
          ) : null}
        </article>

        <aside aria-label="Yazı kenar çubuğu" className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          {toc.length > 1 ? (
            <nav aria-labelledby="toc-baslik" className="hidden rounded-2xl bg-white p-5 ring-1 ring-line lg:block">
              <h2 id="toc-baslik" className="flex items-center gap-2 text-sm font-extrabold tracking-wide text-ink uppercase">
                <ListTree aria-hidden="true" className="h-4 w-4 text-brand" /> İçindekiler
              </h2>
              <ol className="mt-3 space-y-1 border-l-2 border-brand-100">
                {toc.map((t) => (
                  <li key={t.id}>
                    <a href={`#${t.id}`} className="-ml-0.5 block border-l-2 border-transparent py-1 pl-3.5 text-sm leading-snug text-ink-soft transition-colors hover:border-brand hover:text-brand-ink">
                      {t.text}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          {related.length ? (
            <section aria-labelledby="ilgili-baslik" className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <h2 id="ilgili-baslik" className="text-sm font-extrabold tracking-wide text-ink uppercase">
                İlgili yazılar
              </h2>
              <ul className="mt-3 space-y-1">
                {related.map((r) => (
                  <SidePost key={r.id} post={r} />
                ))}
              </ul>
            </section>
          ) : null}

          {recent.length ? (
            <section aria-labelledby="son-baslik" className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <h2 id="son-baslik" className="text-sm font-extrabold tracking-wide text-ink uppercase">
                Son yazılar
              </h2>
              <ul className="mt-3 space-y-1">
                {recent.map((r, i) => (
                  <SidePost key={r.id} post={r} index={i + 1} />
                ))}
              </ul>
            </section>
          ) : null}

          {categories.length ? (
            <section aria-labelledby="kat-baslik" className="rounded-2xl bg-white p-5 ring-1 ring-line">
              <h2 id="kat-baslik" className="text-sm font-extrabold tracking-wide text-ink uppercase">
                Kategoriler
              </h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/blog/kategori/${c.slug}`}
                      aria-current={c.id === category?.id ? "page" : undefined}
                      className="inline-flex min-h-10 items-center rounded-full bg-cream px-4 text-sm font-bold text-ink-soft transition-colors hover:bg-brand-ink hover:text-white aria-[current=page]:bg-brand-ink aria-[current=page]:text-white"
                    >
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="relative isolate overflow-hidden rounded-2xl bg-brand-ink p-6 text-white">
            <SkyDrift className="-z-10 opacity-25" />
            <p className="font-display text-xl leading-tight font-extrabold">Yazıyı okudunuz, sıra uygulamada!</p>
            <p className="mt-2 text-sm text-white/80">Çocuğunuzla ilk dikiş deneyimi için hazırlanan kitleri inceleyin.</p>
            <Link href="/urunler" className="btn-dark btn-sm mt-5 bg-white text-ink hover:bg-sun-50">
              Kitleri keşfet <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </aside>
      </div>

      <ProductRailSection id="blog-urunler" eyebrow="Kitlerimiz" title="Bu yazıyla birlikte deneyin" products={products} link={{ href: "/urunler", label: "Tüm ürünler" }} tinted />
    </>
  );
}
