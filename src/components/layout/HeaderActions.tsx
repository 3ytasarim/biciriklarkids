"use client";

import Link from "next/link";
import { Heart, Search, ShoppingBag, UserRound } from "lucide-react";
import { useCommerce } from "@/components/commerce/CommerceProvider";

export function HeaderActions() {
  const { cartCount, wishlist, openCart, openSearch } = useCommerce();
  const wishCount = wishlist.size;
  return (
    <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
      <button type="button" onClick={openSearch} className="icon-btn 2xl:hidden" aria-label="Ürün ara">
        <Search aria-hidden="true" className="h-[21px] w-[21px]" />
      </button>
      <button
        type="button"
        onClick={openSearch}
        className="mr-2 hidden h-11 w-60 items-center gap-2.5 rounded-full border-[1.5px] border-line-strong bg-white px-4 text-left text-sm text-muted transition-colors hover:border-ink 2xl:flex"
      >
        <Search aria-hidden="true" className="h-[18px] w-[18px] text-ink" />
        <span className="flex-1">Ürün, kategori ara…</span>
        <kbd className="rounded border border-line-strong px-1.5 font-sans text-[11px] font-bold">/</kbd>
      </button>
      <Link href="/hesabim" className="icon-btn hidden lg:inline-flex" aria-label="Hesabım">
        <UserRound aria-hidden="true" className="h-[21px] w-[21px]" />
      </Link>
      <Link href="/favoriler" className="icon-btn hidden sm:inline-flex" aria-label={wishCount ? `Favoriler (${wishCount} ürün)` : "Favoriler"}>
        <Heart aria-hidden="true" className="h-[21px] w-[21px]" />
        {wishCount ? <Badge n={wishCount} tone="bg-berry-ink" /> : null}
      </Link>
      <button type="button" onClick={openCart} className="icon-btn" aria-label={cartCount ? `Sepet (${cartCount} ürün)` : "Sepet"}>
        <ShoppingBag aria-hidden="true" className="h-[21px] w-[21px]" />
        {cartCount ? <Badge n={cartCount} tone="bg-brand-ink" /> : null}
      </button>
    </div>
  );
}

function Badge({ n, tone }: { n: number; tone: string }) {
  return (
    <span aria-hidden="true" className={`absolute top-0.5 right-0.5 flex h-[19px] min-w-[19px] animate-[pop-in_.3s_var(--ease-premium)] items-center justify-center rounded-full px-1 text-[11px] leading-none font-extrabold text-white ring-2 ring-paper tabular-nums ${tone}`}>
      {n > 99 ? "99+" : n}
    </span>
  );
}
