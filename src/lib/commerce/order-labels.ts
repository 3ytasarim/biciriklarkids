/** Sipariş/ödeme durum etiketleri (sunucu ve istemci ortak). */
export const ORDER_STATUS_LABELS = {
  pending: "Ödeme bekleniyor",
  confirmed: "Onaylandı",
  processing: "Hazırlanıyor",
  shipped: "Kargoya verildi",
  delivered: "Teslim edildi",
  cancelled: "İptal edildi",
  refunded: "İade edildi",
} as const;

export const PAYMENT_STATUS_LABELS = {
  pending: "Bekleniyor",
  awaiting_transfer: "Havale/EFT bekleniyor",
  paid: "Ödendi",
  failed: "Başarısız",
  refunded: "İade edildi",
  partially_refunded: "Kısmi iade",
  cancelled: "İptal edildi",
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS_LABELS;
export type PaymentStatus = keyof typeof PAYMENT_STATUS_LABELS;

export const STATUS_TONE: Record<OrderStatus, "neutral" | "green" | "amber" | "red" | "ember"> = {
  pending: "amber",
  confirmed: "ember",
  processing: "ember",
  shipped: "neutral",
  delivered: "green",
  cancelled: "red",
  refunded: "red",
};
