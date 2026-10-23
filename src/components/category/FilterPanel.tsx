"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { AGE_GROUPS, SORT_OPTIONS } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

export type FacetData = {
  categories?: { slug: string; name: string; count: number }[];
  types: string[];
  priceRange: { min: number; max: number };
};

/**
 * Filtre paneli — GET formu olarak çalışır (JS kapalıyken "Uygula" ile), JS varsa her değişiklikte URL'yi
 * günceller (sunucu yeni sonuçları render eder; istemcide filtreleme yok → SEO ve tutarlılık).
 * Masaüstünde yan panel, mobilde alttan açılan çekmece.
 */
export function FilterPanel({ facets, total, mode }: { facets: FacetData; total: number; mode: "desktop" | "mobile" }) {
  const [open, setOpen] = useState(false);
  const sp = useSearchParams();
  const active = ["yas", "tur", "kategori", "fiyat-min", "fiyat-max", "stok", "yeni", "indirim"].filter((k) => sp.get(k)).length;
  if (mode === "desktop") return <FilterForm facets={facets} />;
  return (
    <>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        side="bottom"
        title="Filtrele"
        trigger={
          <button type="button" className="btn-outline btn-sm lg:hidden">
            <SlidersHorizontal aria-hidden="true" className="h-4 w-4" /> Filtrele{active ? <span className="ml-1 rounded-full bg-brand-ink px-1.5 text-xs text-white">{active}</span> : null}
          </button>
        }
        footer={
          <button type="button" className="btn-dark w-full" onClick={() => setOpen(false)}>
            {total} ürünü göster
          </button>
        }
      >
        <div className="px-5 py-4">
          <FilterForm facets={facets} />
        </div>
      </Sheet>
    </>
  );
}

function FilterForm({ facets }: { facets: FacetData }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  const values = (k: string) => (sp.get(k) ?? "").split(",").filter(Boolean);
  const push = (params: URLSearchParams) => {
    params.delete("sayfa");
    const s = params.toString();
    startTransition(() => router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false }));
  };
  const toggleMulti = (k: string, v: string) => {
    const params = new URLSearchParams(sp.toString());
    const set = new Set(values(k));
    if (set.has(v)) set.delete(v);
    else set.add(v);
    if (set.size) params.set(k, [...set].join(","));
    else params.delete(k);
    push(params);
  };
  const toggleFlag = (k: string) => {
    const params = new URLSearchParams(sp.toString());
    if (params.get(k) === "1") params.delete(k);
    else params.set(k, "1");
    push(params);
  };
  const setPrice = (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const params = new URLSearchParams(sp.toString());
    for (const k of ["fiyat-min", "fiyat-max"]) {
      const v = String(fd.get(k) ?? "").trim();
      if (v && Number(v) >= 0) params.set(k, String(Math.floor(Number(v))));
      else params.delete(k);
    }
    push(params);
  };

  return (
    <form
      method="get"
      action={pathname}
      onSubmit={(e) => {
        e.preventDefault();
        setPrice(e.currentTarget);
      }}
      className="space-y-8"
    >
      {sp.get("siralama") ? <input type="hidden" name="siralama" value={sp.get("siralama")!} /> : null}

      {facets.categories?.length ? (
        <Group title="Kategori">
          {facets.categories.map((c) => (
            <Check key={c.slug} name="kategori" value={c.slug} label={c.name} count={c.count} checked={values("kategori").includes(c.slug)} onChange={() => toggleMulti("kategori", c.slug)} />
          ))}
        </Group>
      ) : null}

      <Group title="Fiyat (₺)">
        <div className="flex items-end gap-2">
          <label className="flex-1">
            <span className="mb-1 block text-xs font-bold text-muted">En az</span>
            <input name="fiyat-min" type="number" inputMode="numeric" min={0} defaultValue={sp.get("fiyat-min") ?? ""} placeholder={String(facets.priceRange.min)} className="field min-h-11 px-3" />
          </label>
          <span aria-hidden="true" className="pb-3 text-muted">–</span>
          <label className="flex-1">
            <span className="mb-1 block text-xs font-bold text-muted">En çok</span>
            <input name="fiyat-max" type="number" inputMode="numeric" min={0} defaultValue={sp.get("fiyat-max") ?? ""} placeholder={String(facets.priceRange.max)} className="field min-h-11 px-3" />
          </label>
        </div>
        <button type="submit" className="btn-outline btn-sm mt-3 w-full">
          Fiyatı uygula
        </button>
      </Group>

      <Group title="Yaş grubu">
        {AGE_GROUPS.map((g) => (
          <Check key={g.value} name="yas" value={g.value} label={g.label} checked={values("yas").includes(g.value)} onChange={() => toggleMulti("yas", g.value)} />
        ))}
      </Group>

      {facets.types.length ? (
        <Group title="Ürün türü">
          {facets.types.map((t) => (
            <Check key={t} name="tur" value={t} label={t} checked={values("tur").includes(t)} onChange={() => toggleMulti("tur", t)} />
          ))}
        </Group>
      ) : null}

      <Group title="Durum">
        <Check name="stok" value="1" label="Yalnızca stoktakiler" checked={sp.get("stok") === "1"} onChange={() => toggleFlag("stok")} />
        <Check name="yeni" value="1" label="Yeni ürünler" checked={sp.get("yeni") === "1"} onChange={() => toggleFlag("yeni")} />
        <Check name="indirim" value="1" label="İndirimli ürünler" checked={sp.get("indirim") === "1"} onChange={() => toggleFlag("indirim")} />
      </Group>
    </form>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="mb-3 text-sm font-extrabold tracking-wide uppercase">{title}</legend>
      <div className="space-y-1">{children}</div>
    </fieldset>
  );
}

function Check({ name, value, label, count, checked, onChange }: { name: string; value: string; label: string; count?: number; checked: boolean; onChange: () => void }) {
  return (
    <label className={cn("flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-2 transition-colors hover:bg-cream", checked && "font-bold")}>
      <input type="checkbox" name={name} value={value} checked={checked} onChange={onChange} className="h-5 w-5 shrink-0 accent-brand-ink" />
      <span className="flex-1">{label}</span>
      {count != null ? <span className="text-xs text-muted tabular-nums">{count}</span> : null}
    </label>
  );
}

/** Sıralama seçimi (URL'yi günceller). */
export function SortSelect() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return (
    <label className="flex items-center gap-2 text-sm font-bold">
      <span className="hidden sm:inline">Sırala:</span>
      <select
        value={sp.get("siralama") ?? "onerilen"}
        onChange={(e) => {
          const params = new URLSearchParams(sp.toString());
          if (e.target.value === "onerilen") params.delete("siralama");
          else params.set("siralama", e.target.value);
          params.delete("sayfa");
          const s = params.toString();
          router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
        }}
        aria-label="Sıralama"
        className="min-h-10 rounded-full border-[1.5px] border-line-strong bg-white px-3 pr-8 font-bold outline-none focus:border-ink"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
