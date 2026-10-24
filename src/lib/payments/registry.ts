import "server-only";
import type { SiteSettings } from "@/lib/settings";
import type { PaymentMethodOption, PaymentProvider } from "./types";
import { bankTransferProvider } from "./providers/bank-transfer";
import { devTestProvider } from "./providers/dev-test";
import { iyzicoProvider } from "./providers/iyzico";

/**
 * Kayıtlı ödeme sağlayıcıları (sıra = ödeme sayfasındaki sıra). iyzico yalnızca anahtarlar (ENV ya da
 * Admin › Ayarlar › Kartla ödeme) tanımlıyken görünür. Başka sağlayıcı (PayTR, sanal POS) providers/ altına eklenir (bkz. types.ts).
 */
const PROVIDERS: PaymentProvider[] = [iyzicoProvider, bankTransferProvider, devTestProvider];

export function getProvider(id: string): PaymentProvider | null {
  return PROVIDERS.find((p) => p.id === id) ?? null;
}

export function enabledPaymentMethods(settings: SiteSettings): PaymentMethodOption[] {
  return PROVIDERS.filter((p) => p.isEnabled(settings)).map(({ id, label, description }) => ({ id, label, description }));
}

export const PAYMENT_LABELS: Record<string, string> = Object.fromEntries(PROVIDERS.map((p) => [p.id, p.label]));
