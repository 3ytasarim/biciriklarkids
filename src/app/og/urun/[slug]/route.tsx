import { getProductBySlug } from "@/lib/catalog/queries";
import { formatPrice } from "@/lib/commerce/money";
import { renderOg, renderSiteOg } from "@/lib/seo/og";

export const runtime = "nodejs";
export const revalidate = 3600;

/** Ürün OG: ürün fotoğrafı + ad + marka + fiyat (gerçek veriden; ürün yoksa marka görseli). */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const p = await getProductBySlug((await params).slug);
  if (!p) return renderSiteOg("Minik Eller İçin Büyük Hayaller");
  const discounted = p.compareAtPrice && p.compareAtPrice > p.price;
  return renderOg({
    eyebrow: p.category?.name ?? "Bıcırıklar Kids",
    title: p.name,
    price: formatPrice(p.price),
    oldPrice: discounted ? formatPrice(p.compareAtPrice!) : null,
    image: p.images[0]?.imageUrl,
  });
}
