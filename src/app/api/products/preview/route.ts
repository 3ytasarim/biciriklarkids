import { z } from "zod";

import { getProductBySlug, getProductCardsByIds } from "@/lib/catalog/queries";
import { jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

/**
 * GET ?slug=… → Hızlı İncele verisi
 * GET ?ids=a,b,c → kart verisi (son görüntülenenler, favoriler)
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const ids = sp.get("ids");
  if (ids) {
    const list = z.array(z.uuid()).max(24).safeParse(ids.split(",").filter(Boolean));
    if (!list.success) return jsonError("Geçersiz liste.");
    return jsonOk({ products: await getProductCardsByIds(list.data) });
  }
  const slug = sp.get("slug") ?? "";
  if (!/^[a-z0-9-]{1,140}$/.test(slug)) return jsonError("Geçersiz ürün.");
  const p = await getProductBySlug(slug);
  if (!p) return jsonError("Ürün bulunamadı.", 404);
  return jsonOk({
    product: {
      id: p.id,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      inStock: !p.trackStock || p.stock > 0,
      maxQuantity: p.trackStock ? Math.min(p.stock, 99) : 99,
      ageMin: p.ageMin,
      ageMax: p.ageMax,
      category: p.category ? { name: p.category.name, slug: p.category.slug } : null,
      images: p.images.slice(0, 5).map((i) => ({ url: i.imageUrl, alt: i.alt, width: i.width, height: i.height })),
      hasVariants: p.variants.length > 0,
      isDemo: p.isDemo,
    },
  });
}
