import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Küçük marka işareti (favicon, admin, OG): logo mavisinde yuvarlak kare içinde beyaz bulut.
 * Ana logo (bulut harfli wordmark) raster dosyadan gelir: /public/brand/biciriklar-logo.webp
 */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <linearGradient id="bk-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38a3ff" />
          <stop offset="1" stopColor="#0067d1" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#bk-mark)" />
      <path d="M14.5 33.5h19.2a6.3 6.3 0 0 0 .9-12.54 8.6 8.6 0 0 0-16.37-2.1A6.9 6.9 0 0 0 14.5 33.5Z" fill="#fff" />
      <path d="M17.5 30.2h13.8" stroke="#a0e0ff" strokeWidth="1.6" strokeLinecap="round" strokeDasharray="2.4 2.6" />
    </svg>
  );
}

/** Header/footer logosu: yalnızca gerçek marka logosu (ek etiket yok). */
export function Logo({ className }: { className?: string; tone?: "light" | "dark" }) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/brand/biciriklar-logo.webp"
        alt="Bıcırıklar Kids"
        width={600}
        height={189}
        priority
        sizes="(min-width: 1024px) 200px, 170px"
        className="h-12 w-auto drop-shadow-[0_6px_12px_rgb(0_103_209/0.12)] sm:h-[52px] lg:h-[62px]"
      />    </span>
  );
}
