import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { searchProducts } from "@/lib/catalog/search";
import { getProductCards } from "@/lib/catalog/queries";
import { ProductGrid } from "@/components/product/ProductGrid";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";

type Props = { searchParams: Promise<{ q?: string }> };

/** Arama sonuçları indekslenmez (ince/kopya içerik); WebSite SearchAction bu sayfayı hedefler. */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: { absolute: q ? `“${q.slice(0, 60)}” arama sonuçları | Bıcırıklar Kids` : "Arama | Bıcırıklar Kids" }, robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  const q = ((await searchParams).q ?? "").slice(0, 80).trim();
  const results = q.length >= 2 ? await searchProducts(q, 48) : [];
  const fallback = q && !results.length ? await getProductCards({}, "cok-satan", 4) : [];
  return (
    <div className="shell pt-4 pb-16 sm:pt-6">
      <Breadcrumbs items={[{ name: "Ana Sayfa", path: "/" }, { name: "Arama", path: "/arama" }]} className="mb-6" />
      <h1 className="display-2">{q ? <>“{q}” için sonuçlar</> : "Ürün ara"}</h1>
      <form action="/arama" method="get" role="search" className="mt-6 flex max-w-xl gap-2">
        <label htmlFor="q" className="sr-only">
          Arama
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Ürün adı, SKU veya kategori…" className="field rounded-full" enterKeyHint="search" />
        <button type="submit" className="btn-dark shrink-0" aria-label="Ara">
          <Search aria-hidden="true" className="h-5 w-5" />
        </button>
      </form>
      {q ? <p className="mt-6 text-sm font-bold text-ink-soft" aria-live="polite">{results.length} ürün bulundu</p> : null}
      {results.length ? (
        <ProductGrid products={results} listId="search" listName="Arama sonuçları" className="mt-8" priorityCount={4} />
      ) : q ? (
        <div className="mt-10">
          <p className="max-w-lg text-ink-soft">Aradığınız kelimeyle eşleşen ürün yok. Yazımı kontrol edin veya daha genel bir kelime deneyin. Dilerseniz <Link href="/urunler" className="font-bold text-brand-ink underline">tüm ürünlere</Link> göz atın.</p>
          {fallback.length ? (
            <>
              <h2 className="display-3 mt-14">Çok satanlar</h2>
              <ProductGrid products={fallback} listId="search-fallback" listName="Arama — çok satanlar" className="mt-8" />
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
