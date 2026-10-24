import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

/**
 * Bulut dili — logodaki puf bulutlarla bağ kuran, kasıtlı olarak SADE dekoratif öğeler.
 * Tümü aria-hidden; hareket yok (yalnızca prefers-reduced-motion dışında çok yavaş süzülme isteğe bağlı).
 */

/** Tek bulut silüeti (yuvarlak loblar). */
export function Cloud({ className, fill = "currentColor" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 120 60" className={className} aria-hidden="true" focusable="false">
      <path d="M22 56h78a18 18 0 0 0 2.6-35.8A26 26 0 0 0 53.5 12 20 20 0 0 0 22 56Z" fill={fill} />
    </svg>
  );
}

/** Hero arka planı: birkaç yumuşak bulut, çok düşük kontrast. */
export function SoftClouds({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <Cloud className="absolute -top-6 right-[8%] w-56 text-white opacity-90 drop-shadow-[0_18px_30px_rgb(0_103_209/0.08)] sm:w-72" />
      <Cloud className="absolute top-[38%] -left-16 w-48 text-white opacity-80 drop-shadow-[0_18px_30px_rgb(0_103_209/0.06)] sm:w-64" />
      <Cloud className="absolute right-[42%] bottom-10 hidden w-40 text-white opacity-70 lg:block" />
    </div>
  );
}

/** Kabarık, hacimli bulut (logo bulutlarına yakın): üstten alta hafif ton geçişi ile derinlik. */
export function PuffCloud({ className, id }: { className?: string; id: string }) {
  return (
    <svg viewBox="0 0 240 120" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#e3efff" />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`}>
        <circle cx="62" cy="78" r="34" />
        <circle cx="104" cy="54" r="44" />
        <circle cx="152" cy="62" r="38" />
        <circle cx="190" cy="82" r="28" />
        <circle cx="34" cy="92" r="22" />
        <rect x="34" y="80" width="170" height="34" rx="17" />
      </g>
    </svg>
  );
}

/**
 * Hero gökyüzü: büyük bulutlar arka katmanda soldan sağa sürekli akar (görsel karolarının arkasından geçer).
 * Negatif gecikmeler → sayfa açıldığında bulutlar zaten ekrana dağılmış olur. Yalnızca transform animasyonu.
 */
export function SkyDrift({ className }: { className?: string }) {
  const clouds = [
    { top: "6%", w: "w-[300px] sm:w-[440px]", dur: "70s", delay: "-12s", op: "opacity-95" },
    { top: "34%", w: "w-[220px] sm:w-[320px]", dur: "95s", delay: "-60s", op: "opacity-80" },
    { top: "58%", w: "w-[340px] sm:w-[520px]", dur: "120s", delay: "-30s", op: "opacity-90" },
    { top: "18%", w: "w-[160px] sm:w-[220px]", dur: "85s", delay: "-75s", op: "opacity-70" },
    { top: "78%", w: "w-[200px] sm:w-[280px]", dur: "105s", delay: "-95s", op: "opacity-75" },
  ];
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {clouds.map((c, i) => (
        <div key={i} className="sky-drift absolute left-0" style={{ top: c.top, animationDuration: c.dur, animationDelay: c.delay }}>
          <PuffCloud id={`sky-g${i}`} className={cn(c.w, c.op, "h-auto drop-shadow-[0_22px_34px_rgb(0_103_209/0.10)]")} />
        </div>
      ))}
    </div>
  );
}

/**
 * Footer: beyaz bulutlar alttan yukarı süzülür (yalnızca footer'da). Sarmalayıcı footer yüksekliğinde;
 * translateY(%) sarmalayıcının kendi yüksekliğine göre → bulut footer'ın altından girip üstünden çıkar.
 * Düşük opaklık: metin okunurluğunu etkilemez.
 */
export function RisingClouds({ className }: { className?: string }) {
  const clouds = [
    { left: "4%", w: "w-28 sm:w-40", dur: "26s", delay: "-4s", op: "opacity-[0.13]" },
    { left: "22%", w: "w-20 sm:w-28", dur: "34s", delay: "-18s", op: "opacity-[0.10]" },
    { left: "41%", w: "w-36 sm:w-52", dur: "30s", delay: "-11s", op: "opacity-[0.12]" },
    { left: "60%", w: "w-24 sm:w-32", dur: "38s", delay: "-27s", op: "opacity-[0.12]" },
    { left: "78%", w: "w-32 sm:w-44", dur: "28s", delay: "-8s", op: "opacity-[0.12]" },
    { left: "90%", w: "w-16 sm:w-24", dur: "36s", delay: "-21s", op: "opacity-[0.11]" },
  ];
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {clouds.map((c, i) => (
        <div key={i} className="rise-cloud absolute inset-x-0 top-0 h-full" style={{ animationDuration: c.dur, animationDelay: c.delay }}>
          <div className="rise-sway absolute top-0" style={{ left: c.left, animationDelay: c.delay }}>
            <PuffCloud id={`rise-g${i}`} className={cn(c.w, c.op, "h-auto")} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Bölüm geçişi: üst kenarı bulut lobları şeklinde biten bant (footer üstü). */
export function CloudEdge({ className, fill = "var(--color-ink)" }: { className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 1440 80" preserveAspectRatio="none" className={cn("block h-10 w-full sm:h-14 lg:h-20", className)} aria-hidden="true" focusable="false">
      <g fill={fill}>
        <circle cx="-20" cy="62" r="46" />
        <circle cx="37" cy="70" r="62" />
        <circle cx="114" cy="59" r="40" />
        <circle cx="164" cy="74" r="70" />
        <circle cx="251" cy="65" r="52" />
        <circle cx="316" cy="61" r="44" />
        <circle cx="371" cy="72" r="66" />
        <circle cx="453" cy="63" r="48" />
        <circle cx="513" cy="68" r="58" />
        <circle cx="585" cy="60" r="42" />
        <circle cx="637" cy="71" r="64" />
        <circle cx="717" cy="64" r="50" />
        <circle cx="779" cy="67" r="56" />
        <circle cx="849" cy="62" r="46" />
        <circle cx="906" cy="73" r="68" />
        <circle cx="991" cy="61" r="44" />
        <circle cx="1046" cy="69" r="60" />
        <circle cx="1121" cy="65" r="52" />
        <circle cx="1186" cy="62" r="46" />
        <circle cx="1243" cy="70" r="62" />
        <circle cx="1320" cy="59" r="40" />
        <circle cx="1370" cy="74" r="70" />
        <circle cx="1457" cy="65" r="52" />
        <rect x="0" y="60" width="1440" height="20" />
      </g>
    </svg>
  );
}

const RAINBOW = ["#ff6b5b", "#ffb347", "#ffe066", "#6fdc8c", "#5ab8ff", "#9f8cff"];

/**
 * Footer alt köşesi: iki bulutun arasından yükselen gökkuşağı. Bantlar sırayla çizilir,
 * ardından sakin bir parıltı dalgası bantlar üzerinde gezinir; bulutlar hafifçe salınır.
 * Tamamen dekoratif; reduced-motion'da sabit, tam çizili hâlde görünür.
 */
export function FooterRainbow({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute", className)}>
      <svg viewBox="0 0 420 220" className="footer-rainbow block h-auto w-full" focusable="false">
        {RAINBOW.map((c, i) => {
          const r = 190 - i * 14;
          return (
            <path
              key={c}
              d={`M ${210 - r} 214 A ${r} ${r} 0 0 1 ${210 + r} 214`}
              fill="none"
              stroke={c}
              strokeWidth="13"
              strokeLinecap="round"
              pathLength={100}
              className="rb-band"
              style={{ "--rb-i": i } as CSSProperties}
            />
          );
        })}
      </svg>
      <div className="rb-cloud absolute bottom-[-6%] left-[-8%] w-[34%]">
        <PuffCloud id="rb-cloud-l" className="h-auto w-full" />
      </div>
      <div className="rb-cloud rb-cloud-b absolute right-[-8%] bottom-[-6%] w-[34%]">
        <PuffCloud id="rb-cloud-r" className="h-auto w-full" />
      </div>
    </div>
  );
}
