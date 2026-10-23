/**
 * GA4 e-ticaret olay mimarisi (istemci). Olaylar her zaman `window.dataLayer`'a GA4 standardında yazılır;
 * GTM varsa oradan, yoksa doğrudan gtag ile GA4/Google Ads'e gider. Meta Pixel varsa eşdeğer standart olay
 * da gönderilir. Kullanıcı analitik/pazarlama izni vermediyse script'ler hiç yüklenmez → dataLayer'a yazılan
 * olaylar hiçbir yere gitmez (bkz. components/marketing/Analytics.tsx, Consent Mode v2).
 */

export type GaItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  discount?: number;
  quantity?: number;
  index?: number;
  item_list_id?: string;
  item_list_name?: string;
};

export type EcommerceEvent =
  | "view_item_list"
  | "select_item"
  | "view_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "begin_checkout"
  | "add_shipping_info"
  | "add_payment_info"
  | "purchase"
  | "add_to_wishlist";

type Payload = {
  currency?: "TRY";
  value?: number;
  items: GaItem[];
  item_list_id?: string;
  item_list_name?: string;
  transaction_id?: string;
  shipping?: number;
  tax?: number;
  coupon?: string;
  payment_type?: string;
  shipping_tier?: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

const META_EVENT: Partial<Record<EcommerceEvent, string>> = {
  view_item: "ViewContent",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  add_payment_info: "AddPaymentInfo",
  purchase: "Purchase",
  add_to_wishlist: "AddToWishlist",
};

export function trackEcommerce(event: EcommerceEvent, payload: Payload) {
  if (typeof window === "undefined") return;
  const ecommerce = { currency: "TRY" as const, ...payload };
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ ecommerce: null }); // önceki ecommerce nesnesini temizle (GA4 önerisi)
  window.dataLayer.push({ event, ecommerce });

  const metaName = META_EVENT[event];
  if (metaName && typeof window.fbq === "function") {
    window.fbq("track", metaName, {
      currency: "TRY",
      value: payload.value,
      content_type: "product",
      content_ids: payload.items.map((i) => i.item_id),
      contents: payload.items.map((i) => ({ id: i.item_id, quantity: i.quantity ?? 1 })),
      num_items: payload.items.reduce((s, i) => s + (i.quantity ?? 1), 0),
    });
  }
}

/** Sayfa dışı genel olaylar (form gönderimi, arama, bülten…). */
export function trackEvent(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push({ event, ...params });
}

export function toGaItem(p: {
  id: string;
  sku?: string | null;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  category?: string | null;
  variant?: string | null;
  quantity?: number;
  index?: number;
  listId?: string;
  listName?: string;
}): GaItem {
  const discount = p.compareAtPrice && p.compareAtPrice > p.price ? Math.round((p.compareAtPrice - p.price) * 100) / 100 : undefined;
  return {
    item_id: p.sku || p.id,
    item_name: p.name,
    item_brand: "Bıcırıklar Kids",
    item_category: p.category ?? undefined,
    item_variant: p.variant ?? undefined,
    price: p.price,
    discount,
    quantity: p.quantity ?? 1,
    index: p.index,
    item_list_id: p.listId,
    item_list_name: p.listName,
  };
}
