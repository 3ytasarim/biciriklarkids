"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import { FeltArt, motifFor } from "@/components/ui/FeltArt";
import { toAccent } from "@/lib/catalog/types";
import { cn, isStudioShot } from "@/lib/utils";
import { MAIN_NAV, type NavCategory } from "./nav";

/** Masaüstü navigasyon + görselli mega menü (hover + tıklama + klavye; Esc kapatır). */
export function DesktopNav({ categories }: { categories: NavCategory[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const timer = useRef<number | undefined>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Rota değişince kapat (render sırasında durum eşitleme; effect içinde setState yok)
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  const hoverOpen = (v: boolean) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(v), v ? 90 : 160);
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
  const featured = categories.slice(0, 3);

  return (
    <nav aria-label="Ana menü" className="hidden flex-1 justify-center lg:flex">
      <div ref={wrapRef} className="contents">
        <ul className="flex items-center gap-0.5 xl:gap-1">
          {MAIN_NAV.map((item) =>
            "mega" in item && item.mega ? (
              <li key={item.href} onPointerEnter={(e) => e.pointerType === "mouse" && hoverOpen(true)} onPointerLeave={(e) => e.pointerType === "mouse" && hoverOpen(false)}>
                <button
                  ref={buttonRef}
                  type="button"
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() => setOpen((v) => !v)}
                  className={cn(
                    "inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-full px-2 text-[14px] font-bold transition-colors hover:bg-ink/5 xl:px-4 xl:text-[15px]",
                    (open || pathname.startsWith("/kategori")) && "bg-ink/5",
                  )}
                >
                  {item.label}
                  <ChevronDown aria-hidden="true" className={cn("h-4 w-4 transition-transform duration-300", open && "rotate-180")} />
                </button>
                <div
                  id={panelId}
                  hidden={!open}
                  className="absolute inset-x-0 top-full border-t border-line bg-paper shadow-[0_30px_60px_-30px_rgb(35_31_58/0.35)] data-[open]:animate-[pop-in_.35s_var(--ease-premium)]"
                  data-open={open || undefined}
                >
                  <div className="shell grid grid-cols-12 gap-8 py-8">
                    <div className="col-span-4 xl:col-span-3">
                      <p className="label-caps mb-4">Kategoriler</p>
                      <ul className="space-y-0.5">
                        {categories.map((c) => (
                          <li key={c.slug}>
                            <Link href={`/kategori/${c.slug}`} className="group flex items-center justify-between gap-3 rounded-sm px-3 py-2.5 font-bold transition-colors hover:bg-cream">
                              <span className="flex items-center gap-3">
                                <span aria-hidden="true" className={cn("h-2.5 w-2.5 rounded-full", `tint-${toAccent(c.accent)}`)} style={{ background: "var(--tint-base)" }} />
                                {c.name}
                              </span>
                              <ArrowRight aria-hidden="true" className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                            </Link>
                            {c.children.length ? (
                              <ul className="mb-2 ml-9 space-y-0.5">
                                {c.children.map((ch) => (
                                  <li key={ch.slug}>
                                    <Link href={`/kategori/${ch.slug}`} className="block rounded-sm px-2 py-1.5 text-sm text-ink-soft hover:text-brand-ink">
                                      {ch.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                      <Link href="/urunler" className="btn-dark btn-sm mt-6">
                        Tüm Ürünler <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </div>
                    <ul className="col-span-8 grid grid-cols-3 gap-4 xl:col-span-9">
                      {featured.map((c) => {
                        const accent = toAccent(c.accent);
                        return (
                          <li key={c.slug}>
                            <Link href={`/kategori/${c.slug}`} className="group block">
                              <div className="shot relative aspect-[4/3] overflow-hidden rounded-md">
                                {c.image ? (
                                  <Image src={c.image} alt={c.imageAlt || c.name} fill sizes="25vw" className={cn("transition-transform duration-700 ease-(--ease-premium) group-hover:scale-105", isStudioShot(c.image) ? "object-contain" : "object-cover")} />
                                ) : (
                                  <FeltArt accent={accent} motif={motifFor(c.slug)} className="transition-transform duration-700 ease-(--ease-premium) group-hover:scale-105" />
                                )}
                              </div>
                              <p className="mt-3 font-display text-lg leading-tight font-extrabold group-hover:text-brand-ink">{c.name}</p>
                              {c.productCount ? <p className="text-sm text-muted">{c.productCount} ürün</p> : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </li>
            ) : (
              <li key={item.href} className={cn("wide" in item && item.wide && "hidden xl:block")}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn("inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-2 text-[14px] font-bold transition-colors hover:bg-ink/5 xl:px-4 xl:text-[15px]", isActive(item.href) && "text-brand-ink")}
                >
                  {item.label}
                </Link>
              </li>
            ),
          )}
        </ul>
      </div>
    </nav>
  );
}
