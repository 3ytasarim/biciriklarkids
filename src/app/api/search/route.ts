import { searchCategories, searchProducts } from "@/lib/catalog/search";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getIpHash } from "@/lib/request-meta";
import { jsonError, jsonOk } from "@/lib/http";

export const dynamic = "force-dynamic";

/** Hızlı arama (komut paleti). Sonuç: görsel + ad + fiyat. */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.slice(0, 80) ?? "";
  if (q.trim().length < 2) return jsonOk({ products: [], categories: [] });
  if (await consumeRateLimit([`search:${await getIpHash()}`], 120, 60_000)) return jsonError("Çok fazla istek.", 429);
  const [items, cats] = await Promise.all([searchProducts(q, 8), searchCategories(q, 4)]);
  return jsonOk({
    products: items.map((p) => ({ id: p.id, slug: p.slug, name: p.name, price: p.price, compareAtPrice: p.compareAtPrice, image: p.image, category: p.category?.name ?? null, inStock: p.inStock })),
    categories: cats,
  });
}
