"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2 } from "lucide-react";

type Result = { ok: true } | { ok: false; error: string };

/**
 * Onay diyaloğu ile geri alınamaz işlem (silme). Server action'ı çalıştırır; hata dönerse diyalogda gösterir,
 * başarılıysa `redirectTo` adresine gider ya da sayfayı yeniler.
 */
export function ConfirmAction({
  action,
  title,
  description,
  confirmLabel = "Sil",
  triggerLabel = "Sil",
  redirectTo,
  compact,
  tone = "danger",
}: {
  action: () => Promise<Result>;
  title: string;
  description: string;
  confirmLabel?: string;
  triggerLabel?: string;
  redirectTo?: string;
  compact?: boolean;
  tone?: "danger" | "default";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const titleId = useId();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          ref.current?.showModal();
        }}
        aria-label={compact ? `${triggerLabel}: ${title}` : undefined}
        className={compact ? "flex h-9 w-9 items-center justify-center rounded-full text-red-700 hover:bg-red-50" : tone === "danger" ? "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold text-red-700 hover:bg-red-50" : "inline-flex min-h-11 items-center gap-2 rounded-full bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"}
      >
        {tone === "danger" ? <Trash2 aria-hidden="true" className="h-4 w-4" /> : <Check aria-hidden="true" className="h-4 w-4" />}
        {compact ? null : triggerLabel}
      </button>
      <dialog ref={ref} aria-labelledby={titleId} className="m-auto w-[min(92vw,460px)] overflow-hidden rounded-lg bg-white p-0 backdrop:bg-black/50">
        <div className="p-6">
          <h2 id={titleId} className="text-lg font-semibold text-ink">
            {title}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">{description}</p>
          {error ? <p role="alert" className="mt-4 border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-neutral-200 bg-neutral-50 p-4">
          <button type="button" onClick={() => ref.current?.close()} className="min-h-10 px-4 text-sm hover:bg-neutral-200">
            Vazgeç
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await action();
                if (!res.ok) return setError(res.error);
                ref.current?.close();
                if (redirectTo) router.push(redirectTo);
                else router.refresh();
              })
            }
            className={`inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white disabled:opacity-60 ${tone === "danger" ? "bg-red-700 hover:bg-red-800" : "bg-emerald-700 hover:bg-emerald-800"}`}
          >
            {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
