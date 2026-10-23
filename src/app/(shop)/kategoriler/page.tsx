import { buildStaticPageMetadata } from "@/lib/seo/metadata";
import { getCategoryTree } from "@/lib/catalog/queries";
import { breadcrumbSchema, graph } from "@/lib/schema/json-ld";
import { absoluteUrl } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { CategoryTile } from "@/components/category/CategoryTile";

export const revalidate = 300;

export function generateMetadata() {
  return buildStaticPageMetadata("categories");
}

export default async function CategoriesPage() {
  const { roots } = await getCategoryTree();
  const crumbs = [
    { name: "Ana Sayfa", path: "/" },
    { name: "Kategoriler", path: "/kategoriler" },
  ];
  return (
    <div className="shell pt-4 pb-16 sm:pt-6">
      <JsonLd
        data={graph(breadcrumbSchema(crumbs), {
          "@type": "CollectionPage",
          name: "Kategoriler",
          url: absoluteUrl("/kategoriler"),
          hasPart: roots.map((c) => ({ "@type": "CollectionPage", name: c.name, url: absoluteUrl(`/kategori/${c.slug}`) })),
        })}
      />
      <Breadcrumbs items={crumbs} className="mb-6" />
      <header className="max-w-3xl">
        <p className="eyebrow mb-3">Bıcırıklar Kids</p>
        <h1 className="display-2">Kategoriler</h1>
        <p className="lead mt-4">Dikiş, punch, boyama ve kendin yap: çocuğunuzun ilgisine ve yaşına uygun aktivite türünü seçin.</p>
      </header>
      <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {roots.map((c) => (
          <li key={c.id}>
            <CategoryTile category={c} headingLevel="h2" />
            {c.description ? <p className="mt-3 px-1 text-[15px] leading-relaxed text-ink-soft">{c.description}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
