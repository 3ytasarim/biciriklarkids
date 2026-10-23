import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Gerçek video eklenene kadar gösterilen yer tutucu. Gerçek videoyla AYNI oran kutusunu kullanır
 * (desktop/mobil oranlar CSS değişkeniyle) → video URL'si girildiğinde layout değişmez.
 * Geliştirme sırasında yalnızca "VideoTest" etiketi görünür; video eklenince yer tutucu kalkar.
 */
export function VideoPlaceholder({
  label = "VideoTest",
  aspectRatio = "16/9",
  mobileAspectRatio,
  slot,
  className,
  rounded = true,
}: {
  label?: string;
  aspectRatio?: string;
  mobileAspectRatio?: string;
  slot?: string;
  className?: string;
  rounded?: boolean;
}) {
  return (
    <div
      role="img"
      aria-label={`${label} — video alanı${slot ? ` (${slot})` : ""}`}
      data-video-slot={slot}
      style={{ "--ar": aspectRatio, "--ar-m": mobileAspectRatio ?? aspectRatio } as React.CSSProperties}
      className={cn(
        "relative isolate w-full overflow-hidden bg-ink text-white [aspect-ratio:var(--ar-m)] md:[aspect-ratio:var(--ar)]",
        rounded && "rounded-lg",
        className,
      )}
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_20%_10%,rgb(30_140_245/0.45),transparent_60%),radial-gradient(70%_60%_at_90%_90%,rgb(160_224_255/0.28),transparent_60%),radial-gradient(50%_50%_at_60%_40%,rgb(246_183_60/0.14),transparent_70%)]" />
      <div aria-hidden="true" className={cn("absolute inset-3 border-2 border-dashed border-white/25 sm:inset-5", rounded && "rounded-[calc(var(--radius-lg)-10px)]")} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
        <span aria-hidden="true" className="flex h-16 w-16 items-center justify-center rounded-full bg-white/12 ring-1 ring-white/30 backdrop-blur sm:h-20 sm:w-20">
          <Play className="ml-1 h-7 w-7 fill-white sm:h-8 sm:w-8" />
        </span>
        <span className="font-display text-4xl font-extrabold tracking-[-0.02em] sm:text-6xl lg:text-7xl">{label}</span>
        {slot ? <span className="rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] tracking-wider text-white/70">{slot} · {aspectRatio}</span> : null}
      </div>
    </div>
  );
}
