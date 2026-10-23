"use server";

import { z } from "zod";
import { trackOrder } from "@/lib/commerce/orders";
import { consumeRateLimit } from "@/lib/rate-limit";
import { getIpHash } from "@/lib/request-meta";

export type TrackState = {
  error?: string;
  result?: { orderNumber: string; status: string; createdAt: string; carrier: string | null; trackingNumber: string | null; events: { message: string; at: string }[] };
};

const schema = z.object({ orderNumber: z.string().trim().min(4, "Sipariş numarasını girin.").max(24), email: z.email("Geçerli bir e-posta girin.").max(160) });

export async function trackOrderAction(_prev: TrackState, fd: FormData): Promise<TrackState> {
  const parsed = schema.safeParse({ orderNumber: fd.get("orderNumber"), email: fd.get("email") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  // Sipariş numarası tahminine karşı IP başına 10 dk'da 10 deneme.
  if (await consumeRateLimit([`track:${await getIpHash()}`], 10, 10 * 60_000)) return { error: "Çok fazla deneme yaptınız. Lütfen biraz sonra tekrar deneyin." };
  const found = await trackOrder(parsed.data.orderNumber, parsed.data.email);
  if (!found) return { error: "Bu bilgilerle eşleşen bir sipariş bulunamadı." };
  const { ORDER_STATUS_LABELS } = await import("@/lib/commerce/orders");
  return {
    result: {
      orderNumber: found.order.orderNumber,
      status: ORDER_STATUS_LABELS[found.order.status],
      createdAt: found.order.createdAt.toISOString(),
      carrier: found.order.carrier,
      trackingNumber: found.order.trackingNumber,
      events: found.events.map((e) => ({ message: e.message ?? "", at: e.createdAt.toISOString() })),
    },
  };
}
