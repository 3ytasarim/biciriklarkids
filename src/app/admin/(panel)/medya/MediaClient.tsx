"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2, Upload } from "lucide-react";
import { updateMediaAltAction, uploadImageAction, uploadVideoAction } from "./actions";

export function MediaUploader() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    setMsg(null);
    const errors: string[] = [];
    for (const f of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", f);
      fd.set("nameHint", f.name.replace(/\.[^.]+$/, ""));
      const res = f.type.startsWith("video/") ? await uploadVideoAction(fd) : await uploadImageAction(fd);
      if (!res.ok) errors.push(`${f.name}: ${res.error}`);
    }
    setBusy(false);
    setMsg(errors.length ? errors.join(" · ") : "Yüklendi.");
    router.refresh();
  }
  return (
    <div className="mb-4 rounded-lg border border-dashed border-neutral-300 bg-white p-5">
      <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-ink-soft">
        {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Upload aria-hidden="true" className="h-4 w-4" />}
        {busy ? "Yükleniyor…" : "Görsel / video yükle"}
        <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm" className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files).then(() => (e.target.value = ""))} />
      </label>
      <p className="mt-2 text-xs text-neutral-500">JPG, PNG, WebP, AVIF (en fazla 10 MB) · MP4, WebM (en fazla 80 MB). Dosya adını yüklemeden önce açıklayıcı yapın: “avokado-figurlu-kece-canta.jpg”.</p>
      {msg ? <p className="mt-2 text-sm font-semibold">{msg}</p> : null}
    </div>
  );
}

export function AltEditor({ id, initial }: { id: string; initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          await updateMediaAltAction(id, value);
          setSaved(true);
        });
      }}
      className="flex gap-1"
    >
      <label className="sr-only" htmlFor={`alt-${id}`}>
        Alt metin
      </label>
      <input
        id={`alt-${id}`}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setSaved(false);
        }}
        placeholder="Alt metin"
        maxLength={250}
        className={`min-h-8 w-full min-w-0 rounded-xs border px-1.5 ${value ? "border-neutral-300" : "border-amber-400 bg-amber-50"}`}
      />
      <button type="submit" disabled={pending} aria-label="Alt metni kaydet" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xs bg-neutral-100 hover:bg-neutral-200">
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className={`h-3.5 w-3.5 ${saved ? "text-emerald-600" : ""}`} />}
      </button>
    </form>
  );
}
