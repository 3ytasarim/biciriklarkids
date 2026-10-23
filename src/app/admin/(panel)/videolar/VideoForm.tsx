"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { AdminForm, SaveBar, useMarkDirty } from "@/components/admin/AdminForm";
import { Checkbox, inputCls, Section, SelectInput, TextArea, TextInput } from "@/components/admin/fields";
import { ImagePicker } from "@/components/admin/ImagePicker";
import type { ActionState } from "@/lib/admin/form";
import type { videos } from "@/lib/db/schema";
import { uploadVideoAction } from "../medya/actions";

type Video = typeof videos.$inferSelect;

/** Video URL alanı: harici URL (https) yapıştırın ya da MP4/WebM yükleyin. */
function VideoUrlField({ name, label, defaultValue, hint }: { name: string; label: string; defaultValue?: string | null; hint?: string }) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const markDirty = useMarkDirty();
  const rootRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={rootRef}>
      <label htmlFor={`${name}-input`} className="mb-1.5 block text-sm font-medium text-neutral-800">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={`${name}-input`}
          name={name}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            markDirty();
          }}
          placeholder="/uploads/... veya https://cdn.../video.mp4"
          className={inputCls}
        />
        <label className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm hover:border-ink">
          {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Upload aria-hidden="true" className="h-4 w-4" />} Yükle
          <input
            type="file"
            accept="video/mp4,video/webm"
            className="sr-only"
            disabled={busy}
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setBusy(true);
              setError(null);
              const fd = new FormData();
              fd.set("file", f);
              fd.set("nameHint", (rootRef.current?.closest("form")?.querySelector<HTMLInputElement>("input[name=title]")?.value || f.name).slice(0, 80));
              const res = await uploadVideoAction(fd);
              setBusy(false);
              e.target.value = "";
              if (res.ok) {
                setUrl(res.data.url);
                markDirty();
              } else setError(res.error);
            }}
          />
        </label>
      </div>
      {hint ? <p className="mt-1.5 text-xs text-neutral-500">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}

const RATIOS = ["16/9", "21/9", "4/3", "1/1", "4/5", "9/16"].map((r) => ({ value: r, label: r }));

export function VideoForm({ action, video: v, products }: { action: (p: ActionState, fd: FormData) => Promise<ActionState>; video?: Video | null; products: { value: string; label: string }[] }) {
  return (
    <AdminForm action={action} className="max-w-4xl space-y-6">
      <Section title="Video alanı" description="URL boşken sitede aynı ölçülerde “VideoTest” yer tutucusu görünür; video eklendiğinde düzen değişmez.">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput name="slot" label="Alan adı (slot)" required defaultValue={v?.slot ?? ""} hint="Ana sayfa: home-lifestyle, home-howto, home-brand. Ürün videosu için ürün seçin." readOnly={Boolean(v && v.slot.startsWith("home-"))} />
          <TextInput name="title" label="Başlık" required defaultValue={v?.title ?? ""} hint="Erişilebilir ad ve VideoObject şeması için." />
        </div>
        <TextArea name="description" label="Açıklama" rows={2} defaultValue={v?.description ?? ""} />
        <VideoUrlField name="desktopUrl" label="Video (masaüstü)" defaultValue={v?.desktopUrl} hint="MP4 (H.264) önerilir; 1080p, sessiz döngü videoları için 5–15 sn ve 4–8 MB hedefleyin." />
        <VideoUrlField name="mobileUrl" label="Video (mobil, isteğe bağlı)" defaultValue={v?.mobileUrl} hint="Dikey / daha küçük dosya. Boşsa masaüstü videosu kullanılır." />
        <div className="grid gap-5 sm:grid-cols-2">
          <ImagePicker name="posterUrl" label="Poster (masaüstü)" defaultValue={v?.posterUrl} aspect="aspect-video" />
          <ImagePicker name="mobilePosterUrl" label="Poster (mobil)" defaultValue={v?.mobilePosterUrl} aspect="aspect-[4/5]" />
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <SelectInput name="aspectRatio" label="Masaüstü oranı" defaultValue={v?.aspectRatio ?? "16/9"} options={RATIOS} />
          <SelectInput name="mobileAspectRatio" label="Mobil oranı" defaultValue={v?.mobileAspectRatio ?? "4/5"} options={RATIOS} />
          <TextInput name="durationSeconds" label="Süre (sn)" inputMode="numeric" defaultValue={v?.durationSeconds != null ? String(v.durationSeconds) : ""} />
        </div>
        <SelectInput name="productId" label="Ürün videosu ise ürün" defaultValue={v?.productId ?? ""} placeholder="— Ürüne bağlı değil —" options={products} hint="Ürüne bağlanan video ürün galerisinin sonunda gösterilir." />
        <div className="flex flex-wrap gap-6">
          <Checkbox name="autoplay" label="Otomatik oynat (sessiz)" hint="Ekrana gelince oynar, çıkınca durur. “Hareketi azalt” tercihinde oynamaz." defaultChecked={v?.autoplay ?? true} />
          <Checkbox name="loop" label="Döngü" defaultChecked={v?.loop ?? true} />
          <Checkbox name="isActive" label="Aktif" defaultChecked={v?.isActive ?? true} />
        </div>
      </Section>
      <SaveBar />
    </AdminForm>
  );
}
