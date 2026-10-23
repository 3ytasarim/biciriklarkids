import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** Türkçe büyük/küçük harf duyarsız, aksan sadeleştirilmiş arama metni: "Keçe Çanta" → "kece canta". */
export function normalizeSearch(input: string): string {
  return input
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function pluralize(n: number, word: string): string {
  return `${n.toLocaleString("tr-TR")} ${word}`;
}

export function formatDate(d: Date | string | null | undefined, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }): string {
  if (!d) return "";
  return new Intl.DateTimeFormat("tr-TR", { timeZone: "Europe/Istanbul", ...opts }).format(new Date(d));
}

export function formatDateTime(d: Date | string | null | undefined): string {
  return formatDate(d, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Stüdyo formatına getirilmiş (beyaz fon, ortalanmış 4:5) ürün görseli mi? Bkz. scripts/lib/product-shot.ts */
export function isStudioShot(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith("/uploads/products/"));
}
