import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { CATALOG_TAG } from "@/lib/catalog/queries";

/**
 * İçerik değiştiğinde tüm public ISR sayfalarını (ana sayfa, listeler, detaylar, sitemap, feed, OG, llms.txt)
 * tazeler. Mağaza ölçeğinde seçici invalidation yerine güvenli ve basit tam yenileme tercih edildi.
 */
export function revalidateSite() {
  revalidateTag(CATALOG_TAG, { expire: 0 }); // katalog sorgu önbelleği (lib/catalog/queries.ts)
  revalidatePath("/", "layout");
}
