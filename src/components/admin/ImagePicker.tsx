"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { uploadImageAction } from "@/app/admin/(panel)/medya/actions";
import { useFieldError, useMarkDirty } from "./AdminForm";
import { inputCls } from "./fields";
import { MediaLibrary } from "./MediaLibrary";
import { currentTitle } from "./form-title";

/**
 * Tek görsel alanı: önizleme + bilgisayardan yükle + kütüphaneden seç + kaldır. Değer gizli input'ta
 * (`name`) URL olarak tutulur. `altName` verilirse aynı yerde alt metin alanı gösterilir.
 */
export function ImagePicker({
  name,
  label,
  defaultValue,
  altName,
  altDefault,
  hint,
  aspect = "aspect-[16/10]",
  nameHint,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  altName?: string;
  altDefault?: string | null;
  hint?: string;
  aspect?: string;
  nameHint?: string;
  required?: boolean;
}) {
  const [url, setUrlState] = useState(defaultValue ?? "");
  const markDirty = useMarkDirty();
  const setUrl = (v: string) => {
    setUrlState(v);
    markDirty();
  };
  const [alt, setAlt] = useState(altDefault ?? "");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldError = useFieldError(name);
  const rootRef = useRef<HTMLDivElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("file", file);
    if (alt) fd.set("alt", alt);
    const hint = alt || currentTitle(rootRef.current) || nameHint;
    if (hint) fd.set("nameHint", hint);
    const res = await uploadImageAction(fd);
    setBusy(false);
    if (res.ok) {
      setUrl(res.data.url);
      if (!alt && res.data.alt) setAlt(res.data.alt);
    } else setError(res.error);
  }

  return (
    <div ref={rootRef}>
      <p className="mb-1.5 text-sm font-medium text-neutral-800">
        {label}
        {required ? <span className="text-brand-ink"> *</span> : null}
      </p>
      <input type="hidden" name={name} value={url} />
      <div
        className={`relative ${aspect} w-full overflow-hidden border border-dashed ${fieldError ? "border-red-500" : "border-neutral-300"} bg-neutral-50`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files[0]);
        }}
      >
        {url ? (
          <Image src={url} alt={alt || ""} fill sizes="480px" className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-sm text-neutral-500">
            <ImagePlus aria-hidden="true" className="h-7 w-7" />
            Görsel sürükleyin ya da seçin
          </div>
        )}
        {busy ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 aria-label="Yükleniyor" className="h-6 w-6 animate-spin" />
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 border border-neutral-300 bg-white px-3 text-sm hover:border-ink">
          Bilgisayardan yükle
          <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => upload(e.target.files?.[0]).then(() => (e.target.value = ""))} />
        </label>
        <button type="button" onClick={() => setOpen(true)} className="min-h-10 border border-neutral-300 bg-white px-3 text-sm hover:border-ink">
          Kütüphaneden seç
        </button>
        {url ? (
          <button type="button" onClick={() => setUrl("")} className="inline-flex min-h-10 items-center gap-1.5 px-3 text-sm text-red-700 hover:bg-red-50">
            <Trash2 aria-hidden="true" className="h-4 w-4" /> Kaldır
          </button>
        ) : null}
      </div>
      {altName ? (
        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-neutral-600" htmlFor={`${name}-alt`}>
            Alt metin (görseli anlatan kısa açıklama — SEO ve erişilebilirlik)
          </label>
          <input id={`${name}-alt`} name={altName} value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={250} className={inputCls} />
        </div>
      ) : null}
      {hint ? <p className="mt-1.5 text-xs text-neutral-500">{hint}</p> : null}
      {error || fieldError ? <p className="mt-1.5 text-sm text-red-700">{error || fieldError}</p> : null}
      <MediaLibrary
        open={open}
        onClose={() => setOpen(false)}
        nameHint={nameHint}
        onSelect={(items) => {
          const m = items[0];
          if (!m) return;
          setUrl(m.url);
          if (!alt && m.alt) setAlt(m.alt);
        }}
      />
    </div>
  );
}

