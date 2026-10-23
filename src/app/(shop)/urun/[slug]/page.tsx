import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { BadgeCheck, Star } from "lucide-react";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { getSiteSettings } from "@/lib/settings";
import { buildEntityMetadata } from "@/lib/seo/metadata";
import { breadcrumbSchema, faqSchema, graph, productSchema } from "@/lib/schema/json-ld";
import { categoryTrail, getApprovedReviews, getCategoryTree, getProductBySlug, getProductCards, getRelatedProducts } from "@/lib/catalog/queries";
import { ageLabel, DIFFICULTY_LABELS } from "@/lib/catalog/types";
import { sanitizeRichText } from "@/lib/sanitize";
import { formatDate } from "@/lib/utils";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";
import { FaqList } from "@/components/ui/FaqList";
import { ProductGallery } from "@/components/product/ProductGallery";
import { BuyBox } from "@/components/product/BuyBox";
import { ReviewForm } from "@/components/product/ReviewForm";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { ProductRailSection } from "@/components/homepage/ProductRailSection";

export const revalidate = 300;

export async function generateStaticParams() {
  // Build sırasında aktif (demo olmayan) ürünler önceden üretilir; yenileri ilk istekte ISR ile.
  const rows = await db
    .select({ slug: products.slug })
    .from(products)
    .where(and(eq(products.status, "active"), eq(products.isDemo, false)))
    .limit(500)
    .catch(() => []);
  return rows.map((r) => ({ slug: r.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();
  return buildEntityMetadata({
    name: p.name,
    path: `/urun/${p.slug}`,
    seo: p,
    fallbackDescription: [p.shortDescription, p.description],
    image: `/og/urun/${p.slug}`,
    imageAlt: p.images[0]?.alt || p.name,
    forceNoIndex: p.isDemo,
  });
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) notFound();

  const [settings, tree, reviews, related] = await Promise.all([getSiteSettings(), getCategoryTree(), getApprovedReviews(p.id), getRelatedProducts(p.id, p.categoryId, 8)]);
  const alsoLike = await getProductCards({ excludeIds: [p.id, ...related.map((r) => r.id)] }, "cok-satan", 4);

  const node = p.categoryId ? tree.byId.get(p.categoryId) : undefined;
  const trail = node ? categoryTrail(node, tree.byId) : [];
  const crumbs: Crumb[] = [{ name: "Ana Sayfa", path: "/" }, { name: "Ürünler", path: "/urunler" }, ...trail.map((c) => ({ name: c.name, path: `/kategori/${c.slug}` })), { name: p.name, path: `/urun/${p.slug}` }];

  const inStock = !p.trackStock || p.stock > 0;
  const video = p.videos.find((v) => v.desktopUrl);
  const age = ageLabel(p.ageMin, p.ageMax);
  const description = sanitizeRichText(p.description);
  const contents = (p.contents ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const productFaq = p.faq.filter((f) => f.question && f.answer);

  const sections: { id: string; title: string; body: React.ReactNode }[] = [];
  if (description) sections.push({ id: "aciklama", title: "Ürün Açıklaması", body: <div className="prose rich" dangerouslySetInnerHTML={{ __html: description }} /> });
  if (contents.length)
    sections.push({
      id: "paket-icerigi",
      title: "Paket İçeriği",
      body: (
        <ul className="space-y-2">
          {contents.map((c) => (
            <li key={c} className="flex items-start gap-3">
              <span aria-hidden="true" className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />
              {c}
            </li>
          ))}
        </ul>
      ),
    });
  if (p.usageInformation) sections.push({ id: "nasil-kullanilir", title: "Nasıl Kullanılır?", body: <p className="whitespace-pre-line">{p.usageInformation}</p> });
  if (age || p.difficulty)
    sections.push({
      id: "yas-araligi",
      title: "Yaş Aralığı ve Zorluk",
      body: (
        <dl className="grid grid-cols-2 gap-4">
          {age ? (
            <div>
              <dt className="text-sm text-muted">Önerilen yaş</dt>
              <dd className="font-extrabold">{age}</dd>
            </div>
          ) : null}
          {p.difficulty ? (
            <div>
              <dt className="text-sm text-muted">Zorluk</dt>
              <dd className="font-extrabold">{DIFFICULTY_LABELS[p.difficulty]}</dd>
            </div>
          ) : null}
        </dl>
      ),
    });
  if (p.material) sections.push({ id: "materyal", title: "Materyal", body: <p className="whitespace-pre-line">{p.material}</p> });
  if (p.safetyInformation) sections.push({ id: "guvenlik", title: "Güvenlik Bilgileri", body: <p className="whitespace-pre-line">{p.safetyInformation}</p> });
  sections.push({
    id: "teslimat-iade",
    title: "Teslimat ve İade",
    body: (
      <div className="space-y-2">
        <p>Siparişleriniz özenle paketlenerek kargoya verilir{settings.shipping.dispatchTime ? ` (kargoya teslim: ${settings.shipping.dispatchTime})` : ""}.</p>
        <p>
          Teslim tarihinden itibaren {settings.commerce.returnDays} gün içinde cayma hakkınızı kullanabilirsiniz. Ayrıntılar:{" "}
          <Link href="/iade-politikasi" className="font-bold text-brand-ink underline underline-offset-2">
            İade Politikası
          </Link>
          {" · "}
          <Link href="/kargo-ve-teslimat" className="font-bold text-brand-ink underline underline-offset-2">
            Kargo ve Teslimat
          </Link>
        </p>
      </div>
    ),
  });

  // Fiyatı girilmemiş (0) ürüne Product şeması yazılmaz: offers/yorum olmadan Google bunu hata sayar
  const schema = p.isDemo || p.price <= 0
    ? null
    : productSchema(
        {
          id: p.id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          barcode: p.barcode,
          mpn: p.mpn,
          brand: p.brand,
          description: p.description,
          shortDescription: p.shortDescription,
          price: p.price,
          compareAtPrice: p.compareAtPrice,
          inStock,
          condition: p.condition,
          material: p.material,
          ageMin: p.ageMin,
          ageMax: p.ageMax,
          categoryName: p.category?.name ?? null,
          images: p.images.map((i) => ({ url: i.imageUrl })),
          updatedAt: p.updatedAt,
        },
        settings,
        reviews,
        video ? { name: video.title, description: video.description, contentUrl: video.desktopUrl!, thumbnailUrl: video.posterUrl, uploadDate: video.createdAt, duration: video.durationSeconds } : null,
      );

  return (
    <>
      <JsonLd data={graph(schema, breadcrumbSchema(crumbs), productFaq.length ? faqSchema(productFaq) : null)} />
      <div className="shell pt-4 pb-10 sm:pt-6">
        <Breadcrumbs items={crumbs} className="mb-5 sm:mb-8" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          <div className="lg:col-span-7">
            <ProductGallery
              name={p.name}
              images={p.images.map((i) => ({ url: i.imageUrl, alt: i.alt, width: i.width, height: i.height }))}
              video={video ? { src: video.desktopUrl!, mobileSrc: video.mobileUrl, poster: video.posterUrl, title: video.title, aspectRatio: video.aspectRatio } : null}
            />
          </div>
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <div className="flex flex-wrap items-center gap-2 text-sm font-bold">
                {p.isDemo ? <span className="rounded-full bg-lilac-ink px-2.5 py-1 text-[11px] tracking-wider text-white uppercase">Demo ürün</span> : null}
                {p.category ? (
                  <Link href={`/kategori/${p.category.slug}`} className="text-brand-ink hover:underline">
                    {p.category.name}
                  </Link>
                ) : null}
                {p.newProduct ? <span className="rounded-full bg-leaf-50 px-2.5 py-1 text-xs text-leaf-ink">Yeni</span> : null}
                {p.bestseller ? <span className="rounded-full bg-sun-50 px-2.5 py-1 text-xs text-sun-ink">En Çok Satan</span> : null}
                {p.giftProduct ? <span className="rounded-full bg-berry-50 px-2.5 py-1 text-xs text-berry-ink">Tam Hediyelik</span> : null}
              </div>
              <h1 className="mt-3 font-display text-[1.9rem] leading-[1.1] font-extrabold tracking-[-0.02em] sm:text-[2.4rem]">{p.name}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
                {reviews.summary ? (
                  <a href="#yorumlar" className="flex items-center gap-1.5 font-bold hover:underline">
                    <span className="flex" role="img" aria-label={`5 üzerinden ${reviews.summary.average} puan`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} aria-hidden="true" className={`h-4 w-4 ${i < Math.round(reviews.summary!.average) ? "fill-sun stroke-sun" : "stroke-line-strong"}`} />
                      ))}
                    </span>
                    {reviews.summary.average.toLocaleString("tr-TR")} ({reviews.summary.count} yorum)
                  </a>
                ) : null}
                {p.sku ? <span>SKU: {p.sku}</span> : null}
                {age ? <span className="rounded-full bg-sky-50 px-2.5 py-0.5 font-bold text-sky-ink">{age}</span> : null}
              </div>
              {p.shortDescription ? <p className="mt-5 text-[1.05rem] leading-relaxed text-ink-soft">{p.shortDescription}</p> : null}
              <div className="mt-6 border-t border-dashed border-line-strong pt-6">
                <BuyBox
                  product={{
                    id: p.id,
                    name: p.name,
                    sku: p.sku,
                    price: p.price,
                    compareAtPrice: p.compareAtPrice,
                    stock: p.stock,
                    trackStock: p.trackStock,
                    lowStockThreshold: p.lowStockThreshold,
                    categoryName: p.category?.name ?? null,
                    variants: p.variants.map((v) => ({ id: v.id, name: v.name, value: v.value, priceAdjustment: v.priceAdjustment, stock: v.stock })),
                    image: p.images[0]?.imageUrl ?? null,
                  }}
                  freeShippingThreshold={settings.shipping.freeThreshold}
                  dispatchTime={settings.shipping.dispatchTime}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ürün bilgileri — yerel details/summary: içerik ilk HTML'de (SEO), JS'siz çalışır */}
        <div className="mt-14 grid grid-cols-1 gap-10 lg:mt-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="sr-only">Ürün bilgileri</h2>
            <div className="divide-y divide-line border-y border-line">
              {sections.map((s, i) => (
                <details key={s.id} id={s.id} open={i === 0} className="group">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                    <h3 className="font-display text-xl font-extrabold">{s.title}</h3>
                    <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-cream text-lg font-bold transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <div className="pb-7 text-[15px] leading-relaxed text-ink-soft sm:text-base">{s.body}</div>
                </details>
              ))}
            </div>
            {productFaq.length ? (
              <div className="mt-12">
                <h2 className="display-3 mb-4">Sıkça sorulan sorular</h2>
                <FaqList items={productFaq} />
              </div>
            ) : null}
          </div>

          <aside id="yorumlar" aria-labelledby="reviews-heading" className="lg:col-span-5">
            <h2 id="reviews-heading" className="display-3">
              Yorumlar
            </h2>
            {reviews.summary ? (
              <p className="mt-2 text-ink-soft">
                {reviews.summary.count} onaylı yorum · ortalama <strong className="text-ink">{reviews.summary.average.toLocaleString("tr-TR")}</strong> / 5
              </p>
            ) : (
              <p className="mt-2 text-ink-soft">Bu ürün için henüz yorum yok. İlk yorumu siz yazın.</p>
            )}
            <ul className="mt-6 space-y-5">
              {reviews.list.map((r) => (
                <li key={r.id} className="rounded-md bg-white p-5 ring-1 ring-line">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex" role="img" aria-label={`5 üzerinden ${r.rating} yıldız`}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} aria-hidden="true" className={`h-4 w-4 ${i < r.rating ? "fill-sun stroke-sun" : "stroke-line-strong"}`} />
                      ))}
                    </span>
                    <time className="text-xs text-muted" dateTime={r.createdAt.toISOString()}>
                      {formatDate(r.createdAt)}
                    </time>
                  </div>
                  {r.title ? <p className="mt-3 font-extrabold">{r.title}</p> : null}
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-soft">{r.body}</p>
                  <p className="mt-3 flex items-center gap-1.5 text-sm font-bold">
                    {r.authorName}
                    {r.verifiedPurchase ? (
                      <span className="inline-flex items-center gap-1 text-xs text-leaf-ink">
                        <BadgeCheck aria-hidden="true" className="h-4 w-4" /> Doğrulanmış alışveriş
                      </span>
                    ) : null}
                  </p>
                  {r.adminReply ? <p className="mt-3 rounded-sm bg-cream p-3 text-sm"><strong>Bıcırıklar Kids:</strong> {r.adminReply}</p> : null}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <ReviewForm productId={p.id} />
            </div>
          </aside>
        </div>
      </div>

      <ProductRailSection id="benzer-urunler" eyebrow={p.category?.name ?? null} title="Benzer Ürünler" products={related.slice(0, 4)} link={p.category ? { href: `/kategori/${p.category.slug}`, label: "Kategoriye git" } : null} />
      <ProductRailSection id="bunlari-da-sevebilirsiniz" title="Bunları da Sevebilirsiniz" products={alsoLike} tinted />
      <RecentlyViewed excludeId={p.id} />
    </>
  );
}
