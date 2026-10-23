/**
 * Para yardımcıları. Hesaplamalar kuruş (tam sayı) üzerinden yapılır → kayan nokta hatası yok.
 * DB'de numeric(12,2) olarak saklanır, JS'te number gelir.
 */
export const toKurus = (tl: number): number => Math.round(tl * 100);
export const fromKurus = (kurus: number): number => Math.round(kurus) / 100;

const fmt = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1250 → "₺1.250,00" */
export function formatPrice(tl: number): string {
  return fmt.format(tl);
}

/** İndirim yüzdesi (yalnızca gerçek eski fiyat > fiyat ise). */
export function discountPercent(price: number, compareAt: number | null | undefined): number | null {
  if (!compareAt || compareAt <= price || price <= 0) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
