"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Search, Upload, X } from "lucide-react";
import { listMediaAction, uploadImageAction, type MediaItem } from "@/app/admin/(panel)/medya/actions";
import { currentTitle } from "./form-title";

/**
 * Medya kütüphanesi seçim penceresi (native <dialog>): arama, sayfalama, yeni yükleme.
 * `multiple` ise birden fazla görsel seçilebilir (galeri).
 */
export function MediaLibrary({
  open,
  onClose,
  onSelect,
  multiple,
  nameHint,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (items: MediaItem[]) => void;
  multiple?: boolean;
  nameHint?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [uploading, setUploading] = useState(false);

  const load = useCallback((q: string, p: number) => {
    startLoading(async () => {
      const res = await listMediaAction(q, p);
      setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
      setHasMore(res.hasMore);
      setPage(p);
    });
  }, []);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      setSelected([]);
      setError(null);
      load("", 1);
    }
    if (!open && d.open) d.close();
  }, [open, load]);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    const uploaded: MediaItem[] = [];
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.set("file", file);
      const hint = currentTitle(ref.current?.parentElement ?? null) || nameHint;
      if (hint) fd.set("nameHint", hint);
      const res = await uploadImageAction(fd);
      if (res.ok) uploaded.push(res.data);
      else setError(`${file.name}: ${res.error}`);
    }
    setUploading(false);
    if (uploaded.length) {
      setItems((prev) => [...uploaded, ...prev]);
      setSelected((prev) => (multiple ? [...prev, ...uploaded] : uploaded.slice(-1)));
    }
  }

  const toggle = (m: MediaItem) =>
    setSelected((prev) => (prev.some((x) => x.id === m.id) ? prev.filter((x) => x.id !== m.id) : multiple ? [...prev, m] : [m]));

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label="Medya kütüphanesi"
      className="m-auto h-[min(92dvh,860px)] w-[min(96vw,1100px)] max-w-none overflow-hidden bg-white p-0 backdrop:bg-black/60"
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b border-neutral-200 p-4">
          <h2 className="mr-auto text-base font-semibold">Medya kütüphanesi</h2>
          {/* <form> değil: bu pencere admin formlarının içinde açılır (iç içe form geçersiz HTML). */}
          <div className="relative" role="search">
            <Search aria-hidden="true" className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  load(query, 1);
                }
              }}
              placeholder="Ara… (Enter)"
              aria-label="Görsellerde ara"
              className="h-10 w-48 rounded-full border border-neutral-300 pr-3 pl-9 text-sm outline-none focus:border-ink"
            />
          </div>
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 bg-ink px-4 text-sm font-semibold text-white hover:bg-ink-soft">
            {uploading ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Upload aria-hidden="true" className="h-4 w-4" />}
            {uploading ? "Yükleniyor…" : "Bilgisayardan yükle"}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={multiple} className="sr-only" disabled={uploading} onChange={(e) => upload(e.target.files).then(() => (e.target.value = ""))} />
          </label>
          <button type="button" onClick={onClose} aria-label="Kapat" className="flex h-10 w-10 items-center justify-center hover:bg-neutral-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        {error ? <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p> : null}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 && !loading ? (
            <p className="py-16 text-center text-sm text-neutral-500">Henüz görsel yok. “Bilgisayardan yükle” ile başlayın.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {items.map((m) => {
                const isSel = selected.some((x) => x.id === m.id);
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => toggle(m)}
                      onDoubleClick={() => {
                        onSelect([m]);
                        onClose();
                      }}
                      aria-pressed={isSel}
                      className={`group relative block aspect-square w-full overflow-hidden bg-neutral-100 ${isSel ? "ring-3 ring-brand" : "hover:ring-2 hover:ring-neutral-300"}`}
                    >
                      <Image src={m.url} alt={m.alt ?? ""} fill sizes="180px" className="object-cover" />
                      <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-left text-[11px] text-white">
                        {m.width}×{m.height}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {loading ? <Loader2 aria-label="Yükleniyor" className="mx-auto mt-6 h-6 w-6 animate-spin text-neutral-400" /> : null}
          {hasMore && !loading ? (
            <button type="button" onClick={() => load(query, page + 1)} className="mx-auto mt-6 block border border-neutral-300 px-4 py-2 text-sm hover:border-ink">
              Daha fazla yükle
            </button>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-neutral-200 p-4">
          <p className="text-sm text-neutral-500">{selected.length ? `${selected.length} görsel seçildi` : "Seçmek için tıklayın"}</p>
          <button
            type="button"
            disabled={!selected.length}
            onClick={() => {
              onSelect(selected);
              onClose();
            }}
            className="inline-flex min-h-10 items-center bg-brand-ink px-5 text-sm font-semibold text-white hover:bg-ink disabled:opacity-50"
          >
            Seç
          </button>
        </div>
      </div>
    </dialog>
  );
}
