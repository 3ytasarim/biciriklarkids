import type { ShippingRule } from "./pricing";

/**
 * Kargo firmaları — admin'de (Ayarlar › Kargo) tanımlanır; ödeme adımında müşteri seçer.
 * Logo: admin'den yüklenen görsel varsa o, yoksa firmanın varsayılan logosu (public/brand/kargo/*.webp);
 * logosu olmayan ("Diğer") firma adı marka rengiyle etiket olarak gösterilir.
 */
export const CARRIER_BRANDS = [
  { key: "aras", label: "Aras Kargo", bg: "#E30613", fg: "#FFFFFF", logo: "/brand/kargo/aras.webp" },
  { key: "yurtici", label: "Yurtiçi Kargo", bg: "#003B7A", fg: "#FFCB05", logo: "/brand/kargo/yurtici.webp" },
  { key: "mng", label: "MNG Kargo", bg: "#14286E", fg: "#F7A600", logo: "/brand/kargo/mng.webp" },
  { key: "ptt", label: "PTT Kargo", bg: "#FFD200", fg: "#1B2A6B", logo: "/brand/kargo/ptt.webp" },
  { key: "surat", label: "Sürat Kargo", bg: "#C8102E", fg: "#FFFFFF", logo: "/brand/kargo/surat.webp" },
  { key: "hepsijet", label: "HepsiJet", bg: "#FF6000", fg: "#FFFFFF", logo: "/brand/kargo/hepsijet.webp" },
  { key: "sendeo", label: "Sendeo", bg: "#1F3C88", fg: "#FFFFFF", logo: "/brand/kargo/sendeo.webp" },
  { key: "ups", label: "UPS", bg: "#351C15", fg: "#FFB500", logo: "/brand/kargo/ups.webp" },
  { key: "dhl", label: "DHL", bg: "#FFCC00", fg: "#D40511", logo: "/brand/kargo/dhl.webp" },
  { key: "other", label: "Diğer", bg: "#10284A", fg: "#FFFFFF", logo: null },
] as const;

export type CarrierBrandKey = (typeof CARRIER_BRANDS)[number]["key"];
export const CARRIER_BRAND_KEYS = CARRIER_BRANDS.map((b) => b.key) as unknown as [CarrierBrandKey, ...CarrierBrandKey[]];
export const carrierBrand = (key: string) => CARRIER_BRANDS.find((b) => b.key === key) ?? CARRIER_BRANDS[CARRIER_BRANDS.length - 1]!;

export type ShippingCarrier = {
  id: string;
  brand: CarrierBrandKey;
  name: string;
  /** Kargo ücreti (TL). 0 → her zaman ücretsiz. */
  fee: number;
  /** Bu firmaya özel ücretsiz kargo eşiği; null → genel eşik kullanılır. */
  freeThreshold: number | null;
  /** Kısa not (ör. "1–3 iş günü teslimat"). */
  note: string | null;
  logoUrl: string | null;
  active: boolean;
};

/** Ödeme adımında gösterilen seçenek: firma + bu sepet için hesaplanmış kargo ve toplam. */
export type ShippingOption = Pick<ShippingCarrier, "id" | "brand" | "name" | "note" | "logoUrl"> & { shipping: number; total: number };

type ShippingSettings = { flatFee: number | null; freeThreshold: number | null; carriers?: ShippingCarrier[] };

export const activeCarriers = (s: ShippingSettings) => (s.carriers ?? []).filter((c) => c.active && c.name.trim());

/** Seçili firma (yoksa null). Aktif firma tanımlıysa seçim zorunludur — kontrol çağıranda. */
export const findCarrier = (s: ShippingSettings, id: string | null | undefined) => (id ? (activeCarriers(s).find((c) => c.id === id) ?? null) : null);

/** Varsayılan (en ucuz) aktif firma — sepet özetindeki tahmini kargo için. */
export const defaultCarrier = (s: ShippingSettings) => [...activeCarriers(s)].sort((a, b) => a.fee - b.fee)[0] ?? null;

/** Firma seçildiyse onun ücreti/eşiği; firma tanımlı değilse genel sabit ücret. */
export function shippingRuleFor(s: ShippingSettings, carrier: ShippingCarrier | null): ShippingRule {
  if (!carrier) return { flatFee: s.flatFee, freeThreshold: s.freeThreshold };
  return { flatFee: carrier.fee, freeThreshold: carrier.freeThreshold ?? s.freeThreshold };
}
