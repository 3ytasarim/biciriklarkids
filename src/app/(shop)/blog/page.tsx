import Link from "next/link";
import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { getBlogCategories, listPosts } from "@/lib/content/queries";
import { breadcrumbSchema, graph } from "@/lib/schema/json-ld";
import { absoluteUrl } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { PostCardView } from "@/components/blog/PostCardView";
import { FeltArt } from "@/components/ui/FeltArt";

export const revalidate = 300;

export function generateMetadata() {
  return buildStaticPageMetadata("blog");
}

export default async function BlogIndex() {
  const [{ items }, cats] = await Promise.all([listPosts({ limit: 30 }), getBlogCategories()]);
  const crumbs = [
    { name: "Ana Sayfa", path: "/" },
    { name: "Blog / İlham", path: "/blog" },
  ];
  return (
    <div className="shell pt-4 pb-16 sm:pt-6">
      <JsonLd
        data={graph(breadcrumbSchema(crumbs), {
          "@type": "Blog",
          name: "Bıcırıklar Kids Blog",
          url: absoluteUrl("/blog"),
          blogPost: items.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: absoluteUrl(`/blog/${p.slug}`), datePublished: p.publishedAt?.toISOString() })),
        })}
      />
      <Breadcrumbs items={crumbs} className="mb-6" />
      <header className="max-w-3xl">
        <p className="eyebrow mb-3">Blog / İlham</p>
        <h1 className="display-2">Evde yaratıcı aktiviteler için fikirler ve rehberler</h1>
        <p className="lead mt-4">Dikiş kitlerinin kullanımı, yaşa göre aktivite seçimi ve çocuklarla birlikte üretmenin keyifli yolları.</p>
      </header>
      {cats.length ? (
        <nav aria-label="Blog kategorileri" className="mt-8">
          <ul className="flex flex-wrap gap-2">
            <li>
              <span aria-current="page" className="inline-flex min-h-10 items-center rounded-full bg-ink px-4 text-sm font-bold text-white">
                Tümü
              </span>
            </li>
            {cats.map((c) => (
              <li key={c.id}>
                <Link href={`/blog/kategori/${c.slug}`} className="inline-flex min-h-10 items-center rounded-full bg-cream px-4 text-sm font-bold hover:bg-sand">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      {items.length ? (
        <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <li key={p.id}>
              <PostCardView post={p} headingLevel="h2" />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-12 grid items-center gap-8 overflow-hidden rounded-xl bg-lilac-50 md:grid-cols-2">
          <div className="p-8 sm:p-12">
            <p className="font-display text-3xl font-extrabold">Yazılar çok yakında</p>
            <p className="mt-3 text-ink-soft">Aktivite fikirleri ve kullanım rehberleri hazırlanıyor. Bu arada kitlerimize göz atabilirsiniz.</p>
            <Link href="/urunler" className="btn-dark mt-6">
              Ürünleri Keşfet
            </Link>
          </div>
          <div className="hidden aspect-[4/3] md:block">
            <FeltArt accent="lilac" motif="star" />
          </div>
        </div>
      )}
    </div>
  );
}
