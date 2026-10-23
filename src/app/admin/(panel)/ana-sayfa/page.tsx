import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { banners, homepageSectionProducts, homepageSections, products } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { categoryOptions } from "../urunler/data";
import { HeroForm, SectionRow } from "./HomeForms";

export const metadata = { title: "Ana sayfa" };

export default async function HomepageAdmin() {
  await requireAdmin();
  const [[hero], sections, picks, cats, prods] = await Promise.all([
    db.select().from(banners).where(eq(banners.placement, "hero")).orderBy(asc(banners.sortOrder)).limit(1),
    db.select().from(homepageSections).orderBy(asc(homepageSections.sortOrder)),
    db.select().from(homepageSectionProducts).orderBy(asc(homepageSectionProducts.sortOrder)),
    categoryOptions(),
    db.select({ id: products.id, name: products.name }).from(products).where(eq(products.status, "active")).orderBy(asc(products.name)),
  ]);
  return (
    <>
      <PageHeader title="Ana sayfa" description="Hero içeriği ve bölümlerin sırası, başlıkları, ürün kaynakları. Ürün bulunamayan bölüm sitede otomatik gizlenir." />
      <HeroForm hero={hero ?? null} />
      <h2 className="mt-10 mb-3 text-lg font-semibold">Bölümler (yukarıdan aşağıya)</h2>
      {sections.length ? (
        <ol className="space-y-2">
          {sections.map((s, i) => (
            <SectionRow key={s.id} section={{ ...s, productIds: picks.filter((p) => p.sectionId === s.id).map((p) => p.productId) }} index={i} total={sections.length} categories={cats} products={prods} />
          ))}
        </ol>
      ) : (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500">Bölüm kaydı yok — `npm run db:seed` çalıştırın (sitede varsayılan sıra kullanılıyor).</p>
      )}
    </>
  );
}
