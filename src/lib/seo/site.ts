const DEV_FALLBACK_ORIGIN = "http://localhost:3000";
const LOCAL_HOST = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|\[::1\])$/i;

export const SITE_NAME = "Bıcırıklar Kids";
export const SITE_LOCALE = "tr_TR";
export const SITE_LANG = "tr-TR";

/**
 * Sitenin kanonik origin'i — canonical, sitemap, robots, OG/Twitter ve JSON-LD'deki tüm mutlak URL'lerin
 * TEK kaynağı. Production'da tanımsız, http:// veya localhost ise hata fırlatır: yanlış origin ile sessizce
 * yayına çıkmaktansa build başarısız olsun.
 *
 * Canlı build için: NEXT_PUBLIC_SITE_URL="https://www.biciriklar.com.tr".
 * `SITE_URL_ALLOW_INSECURE=1` yalnızca yerelde production build'i denemek içindir.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const strict = process.env.NODE_ENV === "production" && process.env.SITE_URL_ALLOW_INSECURE !== "1";

  if (!raw) {
    if (strict) throw new Error("NEXT_PUBLIC_SITE_URL tanımlı değil (production'da zorunlu).");
    return DEV_FALLBACK_ORIGIN;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL geçerli bir URL değil.");
  }
  if (strict && (url.protocol !== "https:" || LOCAL_HOST.test(url.hostname))) {
    throw new Error("Production'da NEXT_PUBLIC_SITE_URL https:// ile başlamalı ve localhost olmamalı.");
  }
  return url.origin;
}

/** Göreli yolu (veya zaten mutlak URL'yi) mutlak URL'ye çevirir. */
export function absoluteUrl(pathOrUrl: string): string {
  return new URL(pathOrUrl, getSiteUrl()).toString();
}

/**
 * Self canonical: sorgu dizesi ve hash ASLA canonical'a girmez (filtre/sayfalama/utm duplicate URL üretmesin).
 * Admin'in girdiği özel canonical yalnızca aynı origin'e işaret ediyorsa kabul edilir.
 */
export function canonicalUrl(path: string, override?: string | null): string {
  const site = getSiteUrl();
  if (override) {
    try {
      const custom = new URL(override, site);
      if (custom.origin === site) return `${custom.origin}${stripTrailingSlash(custom.pathname)}`;
    } catch {
      // geçersiz override → self canonical
    }
  }
  const clean = new URL(path, site);
  return `${clean.origin}${stripTrailingSlash(clean.pathname)}`;
}

function stripTrailingSlash(pathname: string): string {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
}
