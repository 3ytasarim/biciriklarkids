/**
 * Çerez izni (KVKK). Kategoriler: necessary (her zaman açık), analytics, marketing.
 * Tercih 1. taraf çerezde (bk_consent, 180 gün) saklanır; değişince "bk:consent" olayı yayınlanır.
 */
export type Consent = { v: 1; analytics: boolean; marketing: boolean; ts: number };

export const CONSENT_COOKIE = "bk_consent";
export const CONSENT_EVENT = "bk:consent";
export const OPEN_CONSENT_EVENT = "bk:open-consent";

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(raw.slice(CONSENT_COOKIE.length + 1))) as Consent;
    return parsed.v === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function writeConsent(c: Omit<Consent, "v" | "ts">) {
  const value: Consent = { v: 1, analytics: c.analytics, marketing: c.marketing, ts: Date.now() };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${60 * 60 * 24 * 180}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: value }));
}
