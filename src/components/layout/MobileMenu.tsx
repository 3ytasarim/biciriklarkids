"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Heart, Mail, Menu, Phone, Search, UserRound } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { useCommerce } from "@/components/commerce/CommerceProvider";
import { toAccent } from "@/lib/catalog/types";
import { MAIN_NAV, type NavCategory } from "./nav";

/** Mobil/tablet menü (lg altı): soldan açılan erişilebilir çekmece. */
export function MobileMenu({ categories, contact }: { categories: NavCategory[]; contact: { phone: string | null; email: string | null } }) {
  const [open, setOpen] = useState(false);
  const { openSearch } = useCommerce();
  const pathname = usePathname();
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      side="left"
      title="Menü"
      trigger={
        <button type="button" className="icon-btn -ml-2 lg:hidden" aria-label="Menüyü aç">
          <Menu aria-hidden="true" className="h-6 w-6" />
        </button>
      }
      footer={
        <div className="space-y-2 text-sm text-ink-soft">
          {contact.phone ? (
            <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="flex min-h-11 items-center gap-3 font-bold text-ink">
              <Phone aria-hidden="true" className="h-4 w-4" /> {contact.phone}
            </a>
          ) : null}
          {contact.email ? (
            <a href={`mailto:${contact.email}`} className="flex min-h-11 items-center gap-3 font-bold text-ink">
              <Mail aria-hidden="true" className="h-4 w-4" /> {contact.email}
            </a>
          ) : null}
        </div>
      }
    >
      <div className="px-5 py-4">
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            openSearch();
          }}
          className="flex h-12 w-full items-center gap-3 rounded-full border-[1.5px] border-line-strong bg-white px-4 text-left text-muted"
        >
          <Search aria-hidden="true" className="h-5 w-5 text-ink" /> Ürün, kategori ara…
        </button>

        <nav aria-label="Mobil menü" className="mt-6">
          <ul className="divide-y divide-line border-y border-line">
            {MAIN_NAV.filter((i) => !("mega" in i)).map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="flex min-h-14 items-center justify-between font-display text-xl font-extrabold">
                  {item.label}
                  <ChevronRight aria-hidden="true" className="h-5 w-5 text-muted" />
                </Link>
              </li>
            ))}
          </ul>

          {categories.length ? (
            <>
              <p className="label-caps mt-8 mb-3">Kategoriler</p>
              <ul className="grid grid-cols-1 gap-2">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/kategori/${c.slug}`} className={`tint-${toAccent(c.accent)} flex min-h-12 items-center justify-between rounded-sm px-4 py-2 font-bold`} style={{ background: "var(--tint)" }}>
                      <span>{c.name}</span>
                      {c.productCount ? <span className="text-xs font-extrabold" style={{ color: "var(--tint-ink)" }}>{c.productCount}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          <ul className="mt-8 grid grid-cols-2 gap-2">
            <li>
              <Link href="/hesabim" className="btn-outline btn-sm w-full">
                <UserRound aria-hidden="true" className="h-4 w-4" /> Hesabım
              </Link>
            </li>
            <li>
              <Link href="/favoriler" className="btn-outline btn-sm w-full">
                <Heart aria-hidden="true" className="h-4 w-4" /> Favoriler
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </Sheet>
  );
}
