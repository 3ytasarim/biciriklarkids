"use client";

import { createContext, startTransition, useActionState, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export type ActionState = { status: "idle" | "error" | "success"; message?: string; errors?: Record<string, string> };
type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

/** Hata özetinde teknik alan adları yerine okunur etiketler. */
const FIELD_LABELS: Record<string, string> = {
  name: "Ad",
  title: "Başlık",
  slug: "URL (slug)",
  categoryId: "Kategori",
  parentId: "Üst kategori",
  description: "Açıklama",
  content: "İçerik",
  image: "Görsel",
  coverImage: "Kapak görseli",
  desktopImage: "Masaüstü görseli",
  metaTitle: "Meta başlık",
  metaDescription: "Meta açıklama",
  canonicalUrl: "Canonical URL",
  ogImage: "Paylaşım görseli",
  ctaUrl: "Birincil buton bağlantısı",
  secondaryCtaUrl: "İkincil buton bağlantısı",
  sortOrder: "Sıra",
  email: "E-posta",
  password: "Şifre",
};

const ErrorsContext = createContext<Record<string, string>>({});
const PendingContext = createContext(false);
const DirtyContext = createContext<() => void>(() => {});

/** Gizli input'la değer tutan editörler (görsel, galeri, özellik satırları) değişince çağırır. */
export function useMarkDirty(): () => void {
  return useContext(DirtyContext);
}

export function useFieldError(name: string): string | undefined {
  return useContext(ErrorsContext)[name];
}
export function useFormPending(): boolean {
  return useContext(PendingContext);
}

/**
 * Admin formu:
 * - Sunucu action'ı useActionState ile; alan hataları context üzerinden alanların altında gösterilir.
 * - onSubmit + startTransition: React 19'un action sonrası otomatik form sıfırlaması devre dışı → hata
 *   dönse de kullanıcının girdiği veriler kaybolmaz.
 * - Kaydedilmemiş değişiklik: sekme kapatma/yenilemede tarayıcı uyarısı, uygulama içi bağlantılarda onay.
 * - Gönderim sırasında buton kilitli (çift kayıt yok).
 */
export function AdminForm({ action, children, className = "", id, resetOnSuccess }: { action: Action; children: React.ReactNode; className?: string; id?: string; resetOnSuccess?: boolean }) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, { status: "idle" });
  const [dirty, setDirty] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const markDirty = useCallback(() => setDirty(true), []);

  // Hata dönerse değişiklikler hâlâ kaydedilmemiştir (render sırasında durum geçişi; effect içinde setState yok).
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.status === "error") setDirty(true);
  }
  useEffect(() => {
    if (state.status === "success" && resetOnSuccess) formRef.current?.reset();
    if (state.status === "error") bannerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state, resetOnSuccess]);

  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest("a[href]");
      if (!a || a.getAttribute("target") === "_blank" || e.defaultPrevented) return;
      if (!window.confirm("Kaydedilmemiş değişiklikler var. Sayfadan ayrılmak istiyor musunuz?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  return (
    <form
      ref={formRef}
      id={id}
      noValidate
      className={className}
      onInput={() => setDirty(true)}
      onChange={() => setDirty(true)}
      onSubmit={(e) => {
        e.preventDefault();
        if (pending) return;
        const fd = new FormData(e.currentTarget);
        setDirty(false);
        startTransition(() => formAction(fd));
      }}
    >
      <PendingContext.Provider value={pending}>
        <DirtyContext.Provider value={markDirty}>
        <ErrorsContext.Provider value={state.errors ?? {}}>
          <div ref={bannerRef} aria-live="assertive" className="[grid-column:1/-1] empty:hidden">
            {state.status === "error" && state.message ? (
              <p role="alert" className="mb-6 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {state.message}
                  {state.errors && Object.keys(state.errors).length ? (
                    <ul className="mt-1 list-disc pl-4">
                      {Object.entries(state.errors).map(([k, v]) => (
                        <li key={k}>
                          <span className="font-semibold">{FIELD_LABELS[k] ?? k}:</span> {v}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </span>
              </p>
            ) : null}
            {state.status === "success" && state.message ? (
              <p role="status" className="mb-6 flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                {state.message}
              </p>
            ) : null}
          </div>
          {children}
        </ErrorsContext.Provider>
        </DirtyContext.Provider>
      </PendingContext.Provider>
    </form>
  );
}

/** Formun altında sabit kaydet çubuğu. */
export function SaveBar({ label = "Kaydet", extra }: { label?: string; extra?: React.ReactNode }) {
  const pending = useFormPending();
  return (
    <div className="save-bar sticky bottom-4 z-20 mt-10 flex flex-wrap items-center justify-end gap-3 rounded-2xl px-4 py-3 sm:px-5">
      <p className="mr-auto hidden text-sm text-ink-soft sm:block">Değişiklikler kaydedilene kadar sitede görünmez.</p>
      {extra}
      <button type="submit" disabled={pending} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[linear-gradient(135deg,var(--color-brand-ink),var(--color-brand-deep))] px-6 text-sm font-bold text-white shadow-[0_10px_24px_-10px_rgb(0_103_209/0.8)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-10px_rgb(0_103_209/0.9)] disabled:translate-y-0 disabled:opacity-60">
        {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
        {pending ? "Kaydediliyor…" : label}
      </button>
    </div>
  );
}
