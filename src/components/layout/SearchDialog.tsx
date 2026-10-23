"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2, Search, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { formatPrice } from "@/lib/commerce/money";
import { trackEvent } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

type Result = {
  products: { id: string; slug: string; name: string; price: number; compareAtPrice: number | null; image: { url: string; alt: string } | null; category: string | null; inStock: boolean }[];
  categories: { name: string; slug: string }[];
};

const QUICK = [
  { label: "Tüm Ürünler", href: "/urunler" },
  { label: "En Çok Satanlar", href: "/en-cok-satanlar" },
  { label: "Yeni Ürünler", href: "/yeni-urunler" },
  { label: "Hediyelik", href: "/hediyelik" },
];

/** Komut paleti tarzı hızlı arama: debounce (220 ms) + iptal edilebilir istek + ok tuşlarıyla gezinme. */
export function SearchDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  // Sonuç, ait olduğu arama terimiyle saklanır → "yükleniyor" ve "eski sonuç" durumu türetilir (effect'te senkron setState yok).
  const [result, setResult] = useState<{ term: string; data: Result } | null>(null);
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLUListElement>(null);
  const term = q.trim();
  const searching = term.length >= 2;
  const data = searching && result?.term === term ? result.data : null;
  const loading = searching && result?.term !== term;

  useEffect(() => {
    if (term.length < 2) return;
    const ctrl = new AbortController();
    const t = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal });
        const json = (await res.json()) as Result & { ok: boolean };
        if (json.ok) {
          setResult({ term, data: { products: json.products, categories: json.categories } });
          setActive(-1);
          trackEvent("search", { search_term: term });
        } else setResult({ term, data: { products: [], categories: [] } });
      } catch {
        /* iptal edildi */
      }
    }, 220);
    return () => {
      ctrl.abort();
      window.clearTimeout(t);
    };
  }, [term]);

  const links = data ? [...data.categories.map((c) => `/kategori/${c.slug}`), ...data.products.map((p) => `/urun/${p.slug}`)] : [];

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown" && links.length) {
      e.preventDefault();
      setActive((a) => (a + 1) % links.length);
    } else if (e.key === "ArrowUp" && links.length) {
      e.preventDefault();
      setActive((a) => (a <= 0 ? links.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0 && links[active]) go(links[active]!);
      else if (q.trim().length >= 2) go(`/arama?q=${encodeURIComponent(q.trim())}`);
    }
  };

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  let idx = -1;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-ink/45 backdrop-blur-[2px] data-[state=open]:animate-fade" />
        <Dialog.Content
          onKeyDown={onKeyDown}
          className="fixed inset-x-0 top-0 z-[70] flex max-h-dvh flex-col bg-paper shadow-pop outline-none data-[state=open]:animate-[pop-in_.35s_var(--ease-premium)] sm:top-[8vh] sm:mx-auto sm:max-h-[80vh] sm:w-[min(680px,calc(100vw-2rem))] sm:rounded-lg"
        >
          <Dialog.Title className="sr-only">Ürün ara</Dialog.Title>
          <Dialog.Description className="sr-only">Ürün adı, SKU veya kategori yazın. Ok tuşlarıyla sonuçlar arasında gezinin.</Dialog.Description>
          <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
            {loading ? <Loader2 aria-hidden="true" className="h-5 w-5 shrink-0 animate-spin text-muted" /> : <Search aria-hidden="true" className="h-5 w-5 shrink-0" />}
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ürün adı, SKU veya kategori…"
              aria-label="Arama"
              role="combobox"
              aria-expanded={Boolean(data)}
              aria-controls="search-results"
              aria-activedescendant={active >= 0 ? `sr-${active}` : undefined}
              enterKeyHint="search"
              className="h-12 min-w-0 flex-1 bg-transparent text-[17px] font-semibold outline-none placeholder:font-normal placeholder:text-muted"
            />
            <Dialog.Close className="icon-btn shrink-0" aria-label="Aramayı kapat">
              <X aria-hidden="true" className="h-5 w-5" />
            </Dialog.Close>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 sm:px-3">
            {!data ? (
              <div className="px-3 py-2">
                <p className="label-caps mb-3">Hızlı erişim</p>
                <ul className="flex flex-wrap gap-2">
                  {QUICK.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} onClick={() => onOpenChange(false)} className="inline-flex min-h-10 items-center rounded-full bg-cream px-4 text-sm font-bold hover:bg-sand">
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : data.products.length === 0 && data.categories.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="font-display text-xl font-extrabold">“{q.trim()}” için sonuç bulunamadı</p>
                <p className="mt-2 text-sm text-ink-soft">Farklı bir kelime deneyin ya da tüm ürünlere göz atın.</p>
                <Link href="/urunler" onClick={() => onOpenChange(false)} className="btn-outline btn-sm mt-5">
                  Tüm Ürünler
                </Link>
              </div>
            ) : (
              <ul id="search-results" ref={listRef} role="listbox" aria-label="Arama sonuçları" className="space-y-1">
                {data.categories.map((c) => {
                  idx++;
                  const i = idx;
                  return (
                    <li key={c.slug} id={`sr-${i}`} role="option" aria-selected={active === i}>
                      <Link href={`/kategori/${c.slug}`} onClick={() => onOpenChange(false)} className={cn("flex min-h-12 items-center justify-between rounded-sm px-3 font-bold", active === i ? "bg-cream" : "hover:bg-cream")}>
                        <span>
                          <span className="mr-2 text-xs font-extrabold tracking-wider text-brand-ink uppercase">Kategori</span>
                          {c.name}
                        </span>
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </li>
                  );
                })}
                {data.products.map((p) => {
                  idx++;
                  const i = idx;
                  return (
                    <li key={p.id} id={`sr-${i}`} role="option" aria-selected={active === i}>
                      <Link href={`/urun/${p.slug}`} onClick={() => onOpenChange(false)} className={cn("flex items-center gap-3 rounded-sm p-2", active === i ? "bg-cream" : "hover:bg-cream")}>
                        <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xs bg-sand">
                          {p.image ? <SafeImage src={p.image.url} alt={p.image.alt || p.name} fill sizes="56px" className="object-cover" /> : null}
                        </span>
                        <span className="min-w-0 flex-1">
                          {p.category ? <span className="block truncate text-xs font-bold text-muted">{p.category}</span> : null}
                          <span className="line-clamp-2 text-[15px] leading-snug font-bold">{p.name}</span>
                        </span>
                        <span className="shrink-0 text-right">
                          <span className={cn("block text-[15px] font-extrabold tabular-nums", p.compareAtPrice && p.compareAtPrice > p.price && "text-coral-ink")}>{formatPrice(p.price)}</span>
                          {!p.inStock ? <span className="text-xs font-bold text-muted">Tükendi</span> : null}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {data && data.products.length ? (
            <div className="border-t border-line p-3">
              <Link href={`/arama?q=${encodeURIComponent(q.trim())}`} onClick={() => onOpenChange(false)} className="btn-dark btn-sm w-full">
                Tüm sonuçları gör <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          ) : null}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
