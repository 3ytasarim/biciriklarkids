import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { Copy, ExternalLink } from "lucide-react";
import { db } from "@/lib/db";
import { productImages, products, productVariants } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { isUuid } from "@/lib/admin/form";
import { Flash, PageHeader } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { ProductForm } from "../ProductForm";
import { deleteProductAction, duplicateProductAction, saveProductAction } from "../actions";
import { categoryOptions, productTypeSuggestions } from "../data";

export const metadata = { title: "Ürünü düzenle" };

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ kaydedildi?: string; kopya?: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  if (!isUuid(id)) notFound();
  const [p] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  if (!p) notFound();
  const [imgs, vars, categories, productTypes] = await Promise.all([
    db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(asc(productImages.sortOrder)),
    db.select().from(productVariants).where(eq(productVariants.productId, id)).orderBy(asc(productVariants.sortOrder)),
    categoryOptions(),
    productTypeSuggestions(),
  ]);
  return (
    <>
      <PageHeader title={p.name} description={p.isDemo ? "DEMO ürün — tasarım testi kaydı (npm run demo:clear ile silinir)." : undefined} back={{ label: "Ürünler", href: "/admin/urunler" }} />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {p.status === "active" ? (
          <Link href={`/urun/${p.slug}`} target="_blank" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm hover:border-ink">
            <ExternalLink aria-hidden="true" className="h-4 w-4" /> Sitede gör
          </Link>
        ) : null}
        <form action={duplicateProductAction.bind(null, p.id)}>
          <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm hover:border-ink">
            <Copy aria-hidden="true" className="h-4 w-4" /> Kopyala
          </button>
        </form>
        <ConfirmAction title={`“${p.name}” silinsin mi?`} description="Ürün, görsel bağlantıları ve varyantları silinir. Geçmiş siparişlerdeki kayıtlar korunur." action={deleteProductAction.bind(null, p.id)} redirectTo="/admin/urunler" />
      </div>
      <Flash message={sp.kaydedildi ? "Ürün oluşturuldu." : sp.kopya ? "Ürün kopyalandı (taslak). SKU ve barkodu güncelleyin." : null} />
      <ProductForm
        action={saveProductAction.bind(null, p.id)}
        product={p}
        images={imgs.map((i) => ({ url: i.imageUrl, alt: i.alt }))}
        variants={vars.map((v) => ({ name: v.name, value: v.value, sku: v.sku ?? "", priceAdjustment: String(v.priceAdjustment), stock: String(v.stock) }))}
        categories={categories}
        productTypes={productTypes}
      />
    </>
  );
}
