"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  ExternalLink,
  FileText,
  FolderTree,
  Gauge,
  Home,
  Images,
  Inbox,
  LogOut,
  Mail,
  Menu,
  MessageSquareQuote,
  Package,
  Receipt,
  Search,
  Settings,
  StickyNote,
  Ticket,
  UserCog,
  Users,
  Video,
  X,
} from "lucide-react";
import { logoutAdminAction } from "@/app/admin/giris/actions";

type Badges = { orders: number; reviews: number; messages: number };

const NAV: { group: string; items: { href: string; label: string; icon: typeof Gauge; badge?: keyof Badges; minRole?: "admin" | "owner" }[] }[] = [
  {
    group: "Genel",
    items: [
      { href: "/admin", label: "Panel", icon: Gauge },
      { href: "/admin/siparisler", label: "Siparişler", icon: Receipt, badge: "orders" },
      { href: "/admin/musteriler", label: "Müşteriler", icon: Users },
      { href: "/admin/mesajlar", label: "Mesajlar", icon: Inbox, badge: "messages" },
    ],
  },
  {
    group: "Katalog",
    items: [
      { href: "/admin/urunler", label: "Ürünler", icon: Package },
      { href: "/admin/kategoriler", label: "Kategoriler", icon: FolderTree },
      { href: "/admin/kuponlar", label: "Kuponlar", icon: Ticket },
      { href: "/admin/yorumlar", label: "Yorumlar", icon: MessageSquareQuote, badge: "reviews" },
    ],
  },
  {
    group: "İçerik",
    items: [
      { href: "/admin/ana-sayfa", label: "Ana sayfa", icon: Home },
      { href: "/admin/videolar", label: "Videolar", icon: Video },
      { href: "/admin/blog", label: "Blog", icon: FileText },
      { href: "/admin/sayfalar", label: "Sayfalar", icon: StickyNote },
      { href: "/admin/medya", label: "Medya", icon: Images },
    ],
  },
  {
    group: "Site",
    items: [
      { href: "/admin/seo", label: "SEO & Yönlendirme", icon: Search },
      { href: "/admin/bulten", label: "Bülten", icon: Mail },
      { href: "/admin/ayarlar", label: "Ayarlar", icon: Settings, minRole: "admin" },
      { href: "/admin/kullanicilar", label: "Hesap & yöneticiler", icon: UserCog },
    ],
  },
];

const RANK = { editor: 0, admin: 1, owner: 2 } as const;

export function AdminShell({ user, badges, children }: { user: { name: string; email: string; role: keyof typeof RANK }; badges: Badges; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  const nav = (
    <nav aria-label="Yönetim menüsü" className="flex-1 overflow-y-auto px-3 py-3">
      {NAV.map((g) => (
        <div key={g.group} className="mb-4">
          <p className="px-3 text-[10.5px] font-extrabold tracking-[0.2em] text-ink/40 uppercase">{g.group}</p>
          <ul className="mt-1.5 space-y-0.5">
            {g.items
              .filter((it) => !it.minRole || RANK[user.role] >= RANK[it.minRole])
              .map((it) => {
                const Icon = it.icon;
                const active = isActive(it.href);
                const count = it.badge ? badges[it.badge] : 0;
                return (
                  <li key={it.href}>
                    <Link
                      href={it.href}
                      aria-current={active ? "page" : undefined}
                      className={`group flex min-h-10 items-center gap-3 rounded-xl px-3 text-[14px] transition-all duration-200 ${active ? "bg-white font-bold text-ink shadow-[0_8px_20px_-12px_rgb(16_40_74/0.45)] ring-1 ring-white" : "font-semibold text-ink/70 hover:bg-white/60 hover:text-ink"}`}
                    >
                      <span className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${active ? "bg-brand text-white" : "bg-white/60 text-ink/60 group-hover:text-brand-ink"}`}>
                        <Icon aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <span className="flex-1">{it.label}</span>
                      {count > 0 ? <span className="min-w-6 rounded-full bg-coral px-1.5 text-center text-xs font-extrabold text-white">{count}</span> : null}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toLocaleUpperCase("tr-TR");
  const footer = (
    <div className="m-3 rounded-2xl bg-white/60 p-3 ring-1 ring-white">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-deep text-sm font-extrabold text-white">{initials}</span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-extrabold text-ink">{user.name}</span>
          <span className="block truncate text-xs text-ink/55">{user.email}</span>
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <a href="/" target="_blank" className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-xs font-bold text-ink/80 ring-1 ring-ink/10 hover:text-brand-ink">
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" /> Siteyi aç
        </a>
        <form action={logoutAdminAction} className="flex-1">
          <button type="submit" className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full bg-white text-xs font-bold text-ink/80 ring-1 ring-ink/10 hover:text-coral-ink">
            <LogOut aria-hidden="true" className="h-3.5 w-3.5" /> Çıkış
          </button>
        </form>
      </div>
    </div>
  );

  const brand = (
    <Link href="/admin" className="flex h-16 items-center gap-2 px-4">
      <Image src="/brand/biciriklar-logo.webp" alt="Bıcırıklar Kids" width={600} height={189} priority className="h-10 w-auto drop-shadow-[0_6px_12px_rgb(0_103_209/0.15)]" />
      <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-brand-ink uppercase ring-1 ring-white">Yönetim</span>
    </Link>
  );

  return (
    <div className="lg:grid lg:min-h-screen lg:grid-cols-[284px_1fr]">
      <aside className="glass-panel sticky top-3 m-3 hidden h-[calc(100vh-1.5rem)] flex-col overflow-hidden rounded-[28px] lg:flex">
        {brand}
        {nav}
        {footer}
      </aside>
      <header className="glass-panel sticky top-2 z-30 mx-2 mt-2 flex h-14 items-center justify-between rounded-2xl pr-1 lg:hidden">
        {brand}
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={open ? "Menüyü kapat" : "Menüyü aç"} className="flex h-11 w-11 items-center justify-center rounded-xl text-ink">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {open ? (
        <div className="glass-panel fixed inset-x-2 top-[4.5rem] bottom-2 z-30 flex flex-col overflow-hidden rounded-2xl lg:hidden">
          {nav}
          {footer}
        </div>
      ) : null}
      <main className="min-w-0 px-4 py-6 sm:px-8 sm:py-9 lg:pl-5">{children}</main>
    </div>
  );
}
