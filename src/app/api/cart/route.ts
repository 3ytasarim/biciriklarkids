import { z } from "zod";
import { addToCart, getCurrentCart, updateCartLine } from "@/lib/commerce/cart";
import { jsonError, jsonOk, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

const uuid = z.uuid("Geçersiz ürün.");

export async function GET() {
  return jsonOk({ cart: await getCurrentCart() });
}

export async function POST(req: Request) {
  const body = await readJson(req, z.object({ productId: uuid, variantId: uuid.nullable().optional(), quantity: z.number().int().min(1).max(99).default(1) }));
  if ("response" in body) return body.response;
  const res = await addToCart(body.data.productId, body.data.variantId ?? null, body.data.quantity);
  if (!res.ok) return jsonError(res.error, 409);
  return jsonOk({ cart: await getCurrentCart() });
}

export async function PATCH(req: Request) {
  const body = await readJson(req, z.object({ lineId: uuid, quantity: z.number().int().min(0).max(99) }));
  if ("response" in body) return body.response;
  await updateCartLine(body.data.lineId, body.data.quantity);
  return jsonOk({ cart: await getCurrentCart() });
}
