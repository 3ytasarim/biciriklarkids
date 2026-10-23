import type { PaymentProvider } from "../types";

/**
 * YALNIZCA GELİŞTİRME: ödeme alınmadan sipariş akışını uçtan uca test etmek için. Ödeme durumunu
 * "ödendi" YAPMAZ  — sipariş "ödeme bekleniyor" olarak kalır. Production'da görünmez.
 */
export const devTestProvider: PaymentProvider = {
  id: "dev_test",
  label: "Geliştirme testi (ödeme alınmaz)",
  description: "Yalnızca geliştirme ortamında görünür. Sipariş oluşturulur, ödeme beklemede kalır.",
  // Yalnızca açıkça istenirse (ENABLE_DEV_PAYMENT=1) görünür; geliştirme ortamında bile varsayılan kapalı
  isEnabled: () => process.env.ENABLE_DEV_PAYMENT === "1",
  async initiate() {
    return { kind: "instructions", paymentStatus: "pending" };
  },
};
