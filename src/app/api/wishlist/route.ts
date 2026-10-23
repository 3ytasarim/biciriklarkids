import { z } from "zod";
import { getWishlistProductIds, toggleWishlist } from "@/lib/commerce/wishlist";
import { jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  return jsonOk({ ids: await getWishlistProductIds() });
}

export async function POST(req: Request) {
  const body = await readJson(req, z.object({ productId: z.uuid() }));
  if ("response" in body) return body.response;
  const { saved } = await toggleWishlist(body.data.productId);
  return jsonOk({ saved, ids: await getWishlistProductIds() });
}
