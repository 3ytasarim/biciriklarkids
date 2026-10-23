"use client";

import { OPEN_CONSENT_EVENT } from "@/lib/consent";

export function CookieSettingsLink({ className }: { className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}>
      Çerez Tercihleri
    </button>
  );
}
