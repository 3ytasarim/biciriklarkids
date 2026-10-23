import Link from "next/link";
import { and, count, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, productImages, products, redirects, seoSettings } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { STATIC_PAGES, STATIC_PAGE_KEYS } from "@/lib/seo/static-pages";
import { Badge, EmptyRow, PageHeader, Table } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { RedirectForm } from "./SeoForms";
import { deleteRedirectAction } from "./actions";

export const metadata = { title: "SEO" };

export default async function SeoAdmin() {
  await requireAdmin();
  const active = and(eq(products.status, "active"), eq(products.isDemo, false));
  const [rows, redirs, [noDesc], [noImgAlt], [noBarcode], [catNoContent]] = await Promise.all([
    db.select().from(seoSettings),
    db.select().from(redirects).orderBy(desc(redirects.createdAt)).limit(200),
    db.select({ n: count() }).from(products).where(and(active, or(isNull(products.description), eq(products.description, "")))),
    db.select({ n: count() }).from(productImages).innerJoin(products, eq(productImages.productId, products.id)).where(and(active, eq(productImages.alt, ""))),
    db.select({ n: count() }).from(products).where(and(active, isNull(products.barcode))),
    db.select({ n: count() }).from(categories).where(and(eq(categories.status, "active"), sql`coalesce(${categories.content}, '') = ''`)),
  ]);
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const checks = [
    { label: "Açıklaması boş aktif ürün", n: Number(noDesc?.n ?? 0) },
    { label: "Alt metni boş ürün görseli", n: Number(noImgAlt?.n ?? 0) },
    { label: "Barkodu (GTIN) girilmemiş aktif ürün (Merchant için önerilir)", n: Number(noBarcode?.n ?? 0) },
    { label: "Sayfa altı içeriği (GEO) boş kategori", n: Number(catNoContent?.n ?? 0) },
  ];
  return (
    <>
      <PageHeader title="SEO & Yönlendirmeler" />
      <section className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {checks.map((c) => (
          <div key={c.label} className="rounded-lg border border-neutral-200 bg-white p-4">
            <p className={`text-2xl font-bold ${c.n ? "text-amber-700" : "text-emerald-700"}`}>{c.n}</p>
            <p className="text-sm text-neutral-600">{c.label}</p>
          </div>
        ))}
      </section>
      <div className="mb-8 flex flex-wrap gap-2 text-sm">
        {[
          ["/sitemap.xml", "Sitemap"],
          ["/robots.txt", "robots.txt"],
          ["/feeds/google-merchant.xml", "Merchant feed"],
          ["/llms.txt", "llms.txt"],
          ["/og/site", "OG görseli"],
        ].map(([href, l]) => (
          <a key={href} href={href} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center rounded-full border border-neutral-300 bg-white px-4 hover:border-ink">
            {l} ↗
          </a>
        ))}
      </div>

      <h2 className="mb-3 text-lg font-semibold">Sayfa SEO&apos;su</h2>
      <Table head={["Sayfa", "Başlık", "Durum"]}>
        {STATIC_PAGE_KEYS.map((k) => {
          const r = byKey.get(k);
          return (
            <tr key={k} className="hover:bg-neutral-50">
              <td className="px-4 py-3">
                <Link href={`/admin/seo/${k}`} className="font-semibold hover:underline">
                  {STATIC_PAGES[k].label}
                </Link>
                <p className="text-xs text-neutral-500">{STATIC_PAGES[k].path}</p>
              </td>
              <td className="px-4 py-3 text-neutral-600">{r?.title || STATIC_PAGES[k].defaults.title}</td>
              <td className="px-4 py-3">{r ? <Badge tone="green">Özelleştirildi</Badge> : <Badge>Varsayılan</Badge>}</td>
            </tr>
          );
        })}
      </Table>

      <h2 className="mt-10 mb-3 text-lg font-semibold">301 / 302 yönlendirmeler</h2>
      <p className="mb-3 text-sm text-neutral-600">Ürün/kategori/yazı adresi değiştiğinde otomatik 301 eklenir. Eski Wix adresleri (/product-page/…) ayrıca ad eşleşmesiyle otomatik yönlendirilir.</p>
      <RedirectForm />
      <div className="mt-4">
        <Table head={["Eski adres", "Yeni adres", "Kod", "İsabet", "Not", ""]} empty={redirs.length ? null : <EmptyRow text="Yönlendirme yok." />}>
          {redirs.map((r) => (
            <tr key={r.id}>
              <td className="px-4 py-2 font-mono text-xs break-all">{r.sourcePath}</td>
              <td className="px-4 py-2 font-mono text-xs break-all">{r.destinationPath}</td>
              <td className="px-4 py-2">{r.statusCode}</td>
              <td className="px-4 py-2 tabular-nums">{r.hits}</td>
              <td className="px-4 py-2 text-xs text-neutral-500">{r.note}</td>
              <td className="px-2 py-2 text-right">
                <ConfirmAction compact title="Yönlendirme silinsin mi?" description={`${r.sourcePath} → ${r.destinationPath}`} action={deleteRedirectAction.bind(null, r.id)} />
              </td>
            </tr>
          ))}
        </Table>
      </div>
    </>
  );
}
