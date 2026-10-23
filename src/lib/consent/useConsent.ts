"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CONSENT_COOKIE, CONSENT_EVENT, type Consent } from "./index";

function subscribe(cb: () => void) {
  window.addEventListener(CONSENT_EVENT, cb);
  return () => window.removeEventListener(CONSENT_EVENT, cb);
}

/** Ham çerez değeri (string → referans eşitliği korunur, gereksiz render yok). */
function getSnapshot(): string {
  return document.cookie.split("; ").find((c) => c.startsWith(`${CONSENT_COOKIE}=`)) ?? "";
}

/**
 * Çerez izni durumu. Sunucuda ve hidrasyon sırasında `undefined` (henüz bilinmiyor), istemcide
 * izin yoksa `null`, varsa Consent. Değişiklikler CONSENT_EVENT ile anında yansır.
 */
export function useConsent(): Consent | null | undefined {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "__server__");
  return useMemo(() => {
    if (raw === "__server__") return undefined;
    if (!raw) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(raw.slice(CONSENT_COOKIE.length + 1))) as Consent;
      return parsed.v === 1 ? parsed : null;
    } catch {
      return null;
    }
  }, [raw]);
}
