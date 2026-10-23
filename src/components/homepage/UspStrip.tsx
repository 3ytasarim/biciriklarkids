import { BookOpen, Package, RotateCcw, Scissors, Truck } from "lucide-react";
import type { SiteSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/commerce/money";
import { cn } from "@/lib/utils";

/**
 * Güven / avantaj kartları. Yalnızca doğrulanabilir maddeler (mevcut sitede yazan ürün özellikleri, yasal cayma
 * hakkı; ücretsiz kargo yalnızca admin'de eşik tanımlıysa).
 * Hareket: ekrana girince sırayla yükselme (.reveal), ikonlarda kademeli yumuşak süzülme, hover'da kalkma +
 * ikon kıpırtısı + ışık geçişi. prefers-reduced-motion'da tümü durur (globals.css).
 */
export function UspStrip({ settings }: { settings: SiteSettings }) {
  const items = [
    { icon: Scissors, title: "Çocuklara uygun", text: "Plastik güvenli iğne ile dikiş", tint: "tint-sky" },
    { icon: BookOpen, title: "Adım adım anlatım", text: "İlk kez dikenler için bile kolay", tint: "tint-sun" },
    { icon: Package, title: "Özenle paketlenir", text: "Hediye etmeye hazır kutular", tint: "tint-berry" },
    settings.shipping.freeThreshold != null
      ? { icon: Truck, title: "Ücretsiz kargo", text: `${formatPrice(settings.shipping.freeThreshold)} ve üzeri siparişlerde`, tint: "tint-leaf" }
      : { icon: RotateCcw, title: `${settings.commerce.returnDays} gün cayma hakkı`, text: "Kolay iade süreci", tint: "tint-leaf" },
  ];
  return (
    <section aria-label="Avantajlar" className="relative py-6 sm:py-10">
      <ul className="shell grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
        {items.map(({ icon: Icon, title, text, tint }, i) => (
          <li key={title} className="reveal" style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}>
            <div className={cn("usp-card group relative flex h-full flex-col gap-3 overflow-hidden rounded-lg bg-white p-4 ring-1 ring-line sm:flex-row sm:items-center sm:gap-4 sm:p-5", tint)}>
              {/* ışık geçişi (hover) */}
              <span aria-hidden="true" className="usp-sheen pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/70 to-transparent" />
              {/* köşe renk lekesi */}
              <span aria-hidden="true" className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-100" style={{ background: "var(--tint)" }} />
              <span
                aria-hidden="true"
                className="usp-icon relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] sm:h-14 sm:w-14"
                style={{ background: "var(--tint)", color: "var(--tint-ink)", animationDelay: `${i * 0.6}s` }}
              >
                <Icon className="h-6 w-6 transition-transform duration-500 ease-(--ease-premium) group-hover:scale-110 group-hover:-rotate-6" />
              </span>
              <span className="relative min-w-0">
                <span className="block text-[15px] leading-tight font-extrabold">{title}</span>
                <span className="mt-1 block text-[13px] leading-snug text-ink-soft sm:text-sm">{text}</span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
