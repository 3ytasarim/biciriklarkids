"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { OPEN_CONSENT_EVENT, readConsent, writeConsent } from "@/lib/consent";
import { useConsent } from "@/lib/consent/useConsent";
import { cn } from "@/lib/utils";

/**
 * KVKK çerez izni: zorunlu (her zaman açık) / analitik / pazarlama. "Yalnızca zorunlu" ve "Tümünü kabul et"
 * eşit ağırlıkta sunulur (karanlık desen yok). İzin verilmeden analitik/pazarlama script'i yüklenmez.
 */
export function CookieConsent() {
  const consent = useConsent();
  const [delayPassed, setDelayPassed] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  // İzin yoksa bildirim kısa gecikmeyle açılır (LCP'yi engellemesin); izin verilince kendiliğinden kapanır.
  const bannerOpen = delayPassed && consent === null;

  useEffect(() => {
    const t = window.setTimeout(() => setDelayPassed(true), 600);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const open = () => {
      const c = readConsent();
      setAnalytics(c?.analytics ?? false);
      setMarketing(c?.marketing ?? false);
      setPrefsOpen(true);
    };
    window.addEventListener(OPEN_CONSENT_EVENT, open);
    return () => window.removeEventListener(OPEN_CONSENT_EVENT, open);
  }, []);

  const save = (a: boolean, m: boolean) => {
    writeConsent({ analytics: a, marketing: m });
    setAnalytics(a);
    setMarketing(m);
    setPrefsOpen(false);
  };

  return (
    <>
      {bannerOpen && !prefsOpen ? (
        <section
          aria-label="Çerez bildirimi"
          className="fixed inset-x-3 bottom-3 z-[55] animate-[pop-in_.45s_var(--ease-premium)] rounded-lg bg-white p-4 shadow-pop sm:p-5 ring-1 ring-line sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-[420px] max-lg:bottom-[calc(env(safe-area-inset-bottom)+0.75rem)]"
        >
          <div className="flex items-start gap-3">
            <span aria-hidden="true" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sun-50 text-sun-ink sm:flex">
              <Cookie className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-base font-extrabold sm:text-lg">Çerezleri sizin için ayarlayalım</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-soft sm:text-sm">
                Zorunlu çerezleri kullanırız; istatistik ve kampanya çerezlerini yalnızca izninizle etkinleştiririz.{" "}
                <Link href="/cerez-politikasi" className="font-bold text-ink underline underline-offset-2">
                  Çerez Politikası
                </Link>
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:mt-4">
            <button type="button" className="btn-outline btn-sm" onClick={() => save(false, false)}>
              Yalnızca zorunlu
            </button>
            <button type="button" className="btn-dark btn-sm" onClick={() => save(true, true)}>
              Tümünü kabul et
            </button>
          </div>
          <button type="button" onClick={() => setPrefsOpen(true)} className="mt-1 min-h-10 w-full text-sm font-bold text-ink-soft underline underline-offset-4 hover:text-ink">
            Tercihleri yönet
          </button>
        </section>
      ) : null}

      <Dialog.Root open={prefsOpen} onOpenChange={setPrefsOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/45 data-[state=open]:animate-fade" />
          <Dialog.Content className="fixed inset-x-3 bottom-3 z-[70] max-h-[90dvh] overflow-y-auto rounded-lg bg-paper p-6 shadow-pop outline-none data-[state=open]:animate-[pop-in_.35s_var(--ease-premium)] sm:inset-x-auto sm:top-1/2 sm:bottom-auto sm:left-1/2 sm:w-[min(520px,calc(100vw-2rem))] sm:-translate-x-1/2 sm:-translate-y-1/2">
            <div className="flex items-start justify-between gap-4">
              <Dialog.Title className="font-display text-2xl font-extrabold">Çerez tercihleri</Dialog.Title>
              <Dialog.Close className="icon-btn -mt-2 -mr-2" aria-label="Kapat">
                <X aria-hidden="true" className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="mt-2 text-sm text-ink-soft">Tercihinizi istediğiniz zaman sitenin alt kısmındaki “Çerez Tercihleri” bağlantısından değiştirebilirsiniz.</Dialog.Description>
            <ul className="mt-5 space-y-3">
              <Pref title="Zorunlu çerezler" text="Sepet, oturum, güvenlik ve çerez tercihinizin saklanması. Kapatılamaz." checked disabled />
              <Pref title="Analitik çerezler" text="Google Analytics ile anonim ziyaret istatistikleri; siteyi iyileştirmemize yardım eder." checked={analytics} onChange={setAnalytics} />
              <Pref title="Pazarlama çerezleri" text="Google Ads ve Meta (Facebook/Instagram) reklam ölçümü ve size uygun kampanyalar." checked={marketing} onChange={setMarketing} />
            </ul>
            <div className="mt-6 grid grid-cols-2 gap-2">
              <button type="button" className="btn-outline btn-sm" onClick={() => save(false, false)}>
                Yalnızca zorunlu
              </button>
              <button type="button" className="btn-dark btn-sm" onClick={() => save(analytics, marketing)}>
                Seçimi kaydet
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}

function Pref({ title, text, checked, disabled, onChange }: { title: string; text: string; checked: boolean; disabled?: boolean; onChange?: (v: boolean) => void }) {
  return (
    <li className="flex items-start justify-between gap-4 rounded-md bg-white p-4 ring-1 ring-line">
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-0.5 text-sm text-ink-soft">{text}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn("relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60", checked ? "bg-leaf-ink" : "bg-line-strong")}
      >
        <span className={cn("absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-300 ease-(--ease-premium)", checked && "translate-x-5")} />
      </button>
    </li>
  );
}
