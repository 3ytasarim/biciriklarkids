"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export type PromoPopupData = {
  imageUrl: string;
  alt: string;
  href: string | null;
  /** ISO (İstanbul saat dilimli) ya da null */
  startsAt: string | null;
  endsAt: string | null;
  delaySeconds: number;
  hideDays: number;
  width: number;
  height: number;
};

const STORE_KEY = "bk_promo_popup";
/** Alışverişi bölmemek için bu yollarda açılmaz. */
const SKIP = ["/sepet", "/odeme", "/siparis", "/hesabim", "/giris", "/kayit"];

const read = (store: Storage | undefined, key: string) => {
  try {
    return store?.getItem(key) ?? null;
  } catch {
    return null;
  }
};
const write = (store: Storage | undefined, key: string, v: string) => {
  try {
    store?.setItem(key, v);
  } catch {}
};

/**
 * Kampanya popup'ı (Admin › Ayarlar › Kampanya popup'ı). Tarih aralığı istemcide de kontrol edilir
 * (sayfa önbellekte kalsa bile süresi biten kampanya açılmaz). Oturum başına bir kez açılır; kapatan
 * ziyaretçiye `hideDays` boyunca gösterilmez. Yerel <dialog> sayesinde odak tuzağı ve Esc hazır gelir.
 */
export function PromoPopup({ data }: { data: PromoPopupData }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDialogElement>(null);
  const [armed, setArmed] = useState(false);
  const key = `${data.imageUrl}|${data.startsAt ?? ""}`;

  useEffect(() => {
    if (SKIP.some((p) => pathname === p || pathname.startsWith(p + "/"))) return;
    const now = Date.now();
    if (data.startsAt && now < Date.parse(data.startsAt)) return;
    if (data.endsAt && now > Date.parse(data.endsAt)) return;
    if (read(window.sessionStorage, STORE_KEY) === key) return;
    try {
      const saved = JSON.parse(read(window.localStorage, STORE_KEY) ?? "null") as { k: string; until: number } | null;
      if (saved?.k === key && saved.until > now) return;
    } catch {}

    // Görsel önceden yüklensin diye dialog hemen (kapalı) render edilir, süre dolunca açılır.
    const arm = window.setTimeout(() => setArmed(true), 0);
    const t = window.setTimeout(() => {
      const d = ref.current;
      if (!d || d.open || document.querySelector("dialog[open]")) return;
      d.showModal();
      d.querySelector<HTMLButtonElement>("[data-close]")?.focus();
      write(window.sessionStorage, STORE_KEY, key);
    }, Math.max(data.delaySeconds * 1000, 100));
    return () => {
      window.clearTimeout(arm);
      window.clearTimeout(t);
    };
  }, [pathname, data, key]);

  const close = () => {
    ref.current?.close();
  };

  const onClose = () => {
    if (data.hideDays > 0) write(window.localStorage, STORE_KEY, JSON.stringify({ k: key, until: Date.now() + data.hideDays * 86_400_000 }));
  };

  if (!armed) return null;

  const img = (
    <Image
      src={data.imageUrl}
      alt={data.alt}
      width={data.width}
      height={data.height}
      sizes="(min-width: 640px) 440px, 90vw"
      loading="eager"
      className="block h-auto max-h-[calc(100dvh-6rem)] w-full object-contain"
    />
  );

  return (
    <dialog
      ref={ref}
      aria-label={data.alt || "Kampanya"}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && close()}
      className="promo-popup m-auto w-[min(90vw,440px)] overflow-visible bg-transparent p-0"
    >
      <div className="relative">
        {data.href ? (
          <Link href={data.href} onClick={close} className="block overflow-hidden rounded-xl shadow-[0_30px_80px_-20px_rgb(16_40_74/0.6)]">
            {img}
          </Link>
        ) : (
          <div className="overflow-hidden rounded-xl shadow-[0_30px_80px_-20px_rgb(16_40_74/0.6)]">{img}</div>
        )}
        <button
          type="button"
          onClick={close}
          aria-label="Kampanyayı kapat"
          data-close
          className="absolute -top-3 -right-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink shadow-lg transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </button>
      </div>
    </dialog>
  );
}
