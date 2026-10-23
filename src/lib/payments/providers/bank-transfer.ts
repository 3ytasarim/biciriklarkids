import type { PaymentProvider } from "../types";

/**
 * Havale / EFT. Harici API yoktur: sipariş "awaiting_transfer" durumunda oluşur, müşteri onay sayfasında
 * admin'e girilmiş GERÇEK banka bilgilerini görür. Ödeme admin tarafından hesaba geçtiği kontrol edilerek
 * "Ödendi" işaretlenir. IBAN girilmeden yöntem görünmez.
 */
export const bankTransferProvider: PaymentProvider = {
  id: "bank_transfer",
  label: "Havale / EFT",
  description: "Sipariş sonrası gösterilen banka hesabına ödeme yapın; ödemeniz onaylanınca siparişiniz hazırlanır.",
  isEnabled: (s) => Boolean(s.payments.bankTransfer.enabled && s.payments.bankTransfer.iban && s.payments.bankTransfer.accountHolder),
  async initiate() {
    return { kind: "instructions", paymentStatus: "awaiting_transfer" };
  },
};
