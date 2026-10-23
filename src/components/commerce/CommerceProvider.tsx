"use client";

import dynamic from "next/dynamic";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { CartView } from "@/lib/commerce/cart";
import { toGaItem, trackEcommerce, type GaItem } from "@/lib/analytics/events";

// Ağır/etkileşimli paneller ilk yüklemede indirilmez; yalnızca açıldıklarında yüklenir.
const CartDrawer = dynamic(() => import("./CartDrawer").then((m) => m.CartDrawer), { ssr: false });
const QuickView = dynamic(() => import("@/components/product/QuickView").then((m) => m.QuickView), { ssr: false });
const SearchDialog = dynamic(() => import("@/components/layout/SearchDialog").then((m) => m.SearchDialog), { ssr: false });

type Toast = { id: number; message: string; tone: "success" | "error" };

type CommerceCtx = {
  cart: CartView | null;
  cartCount: number;
  busy: boolean;
  wishlist: Set<string>;
  addToCart: (productId: string, quantity?: number, item?: GaItem, opts?: { variantId?: string | null; openDrawer?: boolean }) => Promise<boolean>;
  updateLine: (lineId: string, quantity: number) => Promise<void>;
  applyCoupon: (code: string | null) => Promise<string | null>;
  toggleWishlist: (productId: string, item?: GaItem) => Promise<void>;
  openCart: () => void;
  openQuickView: (slug: string) => void;
  openSearch: () => void;
  notify: (message: string, tone?: Toast["tone"]) => void;
  refreshCart: () => Promise<void>;
};

const Ctx = createContext<CommerceCtx | null>(null);

export function useCommerce(): CommerceCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCommerce, CommerceProvider içinde kullanılmalı.");
  return ctx;
}

async function api<T>(url: string, init?: RequestInit): Promise<T & { ok: boolean; error?: string }> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    credentials: "same-origin",
    cache: "no-store",
  });
  return res.json().catch(() => ({ ok: false, error: "Bağlantı hatası. Lütfen tekrar deneyin." }));
}

export function CommerceProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartView | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [quickSlug, setQuickSlug] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);

  const notify = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  const refreshCart = useCallback(async () => {
    const res = await api<{ cart: CartView }>("/api/cart");
    if (res.ok) setCart(res.cart);
  }, []);

  // İlk yükleme: sepet ve favoriler (sayfa HTML'i statik/ISR kalır; kişisel veri istemcide gelir).
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const [c, w] = await Promise.all([api<{ cart: CartView }>("/api/cart"), api<{ ids: string[] }>("/api/wishlist")]);
      if (!alive) return;
      if (c.ok) setCart(c.cart);
      if (w.ok) setWishlist(new Set(w.ids));
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (idle) idle(() => void load());
    else window.setTimeout(() => void load(), 1);
    return () => {
      alive = false;
    };
  }, []);

  const addToCart = useCallback<CommerceCtx["addToCart"]>(
    async (productId, quantity = 1, item, opts) => {
      setBusy(true);
      const res = await api<{ cart: CartView }>("/api/cart", { method: "POST", body: JSON.stringify({ productId, quantity, variantId: opts?.variantId ?? null }) });
      setBusy(false);
      if (!res.ok) {
        notify(res.error ?? "Ürün sepete eklenemedi.", "error");
        return false;
      }
      setCart(res.cart);
      if (item) trackEcommerce("add_to_cart", { value: Math.round(item.price * quantity * 100) / 100, items: [{ ...item, quantity }] });
      if (opts?.openDrawer !== false) setDrawerOpen(true);
      else notify("Ürün sepete eklendi.");
      return true;
    },
    [notify],
  );

  const updateLine = useCallback<CommerceCtx["updateLine"]>(
    async (lineId, quantity) => {
      const before = cart?.items.find((l) => l.id === lineId);
      setBusy(true);
      const res = await api<{ cart: CartView }>("/api/cart", { method: "PATCH", body: JSON.stringify({ lineId, quantity }) });
      setBusy(false);
      if (!res.ok) return notify(res.error ?? "Sepet güncellenemedi.", "error");
      setCart(res.cart);
      if (before) {
        const diff = quantity - before.quantity;
        const item = toGaItem({ id: before.productId, sku: before.sku, name: before.name, price: before.unitPrice, category: before.categoryName, variant: before.variantLabel });
        if (diff < 0) trackEcommerce("remove_from_cart", { value: Math.round(before.unitPrice * -diff * 100) / 100, items: [{ ...item, quantity: -diff }] });
        if (diff > 0) trackEcommerce("add_to_cart", { value: Math.round(before.unitPrice * diff * 100) / 100, items: [{ ...item, quantity: diff }] });
      }
    },
    [cart, notify],
  );

  const applyCoupon = useCallback<CommerceCtx["applyCoupon"]>(async (code) => {
    setBusy(true);
    const res = await api<{ cart: CartView }>("/api/cart/coupon", { method: "POST", body: JSON.stringify({ code }) });
    setBusy(false);
    if (!res.ok) return res.error ?? "Kupon uygulanamadı.";
    setCart(res.cart);
    return null;
  }, []);

  const toggleWishlist = useCallback<CommerceCtx["toggleWishlist"]>(
    async (productId, item) => {
      // İyimser güncelleme
      setWishlist((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) next.delete(productId);
        else next.add(productId);
        return next;
      });
      const res = await api<{ saved: boolean; ids: string[] }>("/api/wishlist", { method: "POST", body: JSON.stringify({ productId }) });
      if (!res.ok) {
        notify(res.error ?? "Favoriler güncellenemedi.", "error");
        return;
      }
      setWishlist(new Set(res.ids));
      if (res.saved && item) trackEcommerce("add_to_wishlist", { value: item.price, items: [item] });
      notify(res.saved ? "Favorilere eklendi." : "Favorilerden çıkarıldı.");
    },
    [notify],
  );

  const value = useMemo<CommerceCtx>(
    () => ({
      cart,
      cartCount: cart?.count ?? 0,
      busy,
      wishlist,
      addToCart,
      updateLine,
      applyCoupon,
      toggleWishlist,
      openCart: () => setDrawerOpen(true),
      openQuickView: (slug) => setQuickSlug(slug),
      openSearch: () => setSearchOpen(true),
      notify,
      refreshCart,
    }),
    [cart, busy, wishlist, addToCart, updateLine, applyCoupon, toggleWishlist, notify, refreshCart],
  );

  // Klavye kısayolu: "/" veya Ctrl/Cmd+K → arama
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Ctx.Provider value={value}>
      {children}
      {drawerOpen ? <CartDrawer open={drawerOpen} onOpenChange={setDrawerOpen} /> : null}
      {quickSlug ? <QuickView slug={quickSlug} onClose={() => setQuickSlug(null)} /> : null}
      {searchOpen ? <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} /> : null}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[80] flex flex-col items-center gap-2 px-4 max-lg:bottom-24">
        {toasts.map((t) => (
          <p
            key={t.id}
            role={t.tone === "error" ? "alert" : "status"}
            className={`animate-rise rounded-full px-5 py-3 text-sm font-bold shadow-pop ${t.tone === "error" ? "bg-danger text-white" : "bg-ink text-white"}`}
          >
            {t.message}
          </p>
        ))}
      </div>
    </Ctx.Provider>
  );
}
