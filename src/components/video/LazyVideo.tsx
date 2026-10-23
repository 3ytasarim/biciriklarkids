"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Performans odaklı video:
 * - Kaynak yalnızca görünüme ~300px kala yüklenir (IntersectionObserver rootMargin) — ilk yüklemede 0 bayt video
 * - Ekrandan çıkınca duraklar (CPU/pil harcamaz), dönünce devam eder
 * - Mobil/desktop için tek kaynak seçilir (iki dosya birden indirilmez)
 * - prefers-reduced-motion: otomatik oynatma yok; poster + oynat düğmesi
 * - autoplay için muted + playsInline (iOS)
 */
export function LazyVideo({
  src,
  mobileSrc,
  poster,
  mobilePoster,
  aspectRatio = "16/9",
  mobileAspectRatio,
  title,
  autoplay = true,
  loop = true,
  className,
  rounded = true,
}: {
  src: string;
  mobileSrc?: string | null;
  poster?: string | null;
  mobilePoster?: string | null;
  aspectRatio?: string;
  mobileAspectRatio?: string;
  title: string;
  autoplay?: boolean;
  loop?: boolean;
  className?: string;
  rounded?: boolean;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [source, setSource] = useState<{ src: string; poster?: string } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [reduced, setReduced] = useState(false);
  const userPaused = useRef(false);
  const inView = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(prefersReduced);
    const chosen = { src: isMobile && mobileSrc ? mobileSrc : src, poster: (isMobile && mobilePoster ? mobilePoster : poster) ?? undefined };

    // 1) Yaklaşınca kaynağı bağla
    const loader = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSource(chosen);
          loader.disconnect();
        }
      },
      { rootMargin: "300px 0px" },
    );
    loader.observe(el);

    // 2) Görünürlüğe göre oynat/duraklat
    const visibility = new IntersectionObserver(
      (entries) => {
        const v = videoRef.current;
        if (!v) return;
        const visible = entries.some((e) => e.isIntersecting);
        inView.current = visible;
        if (visible && autoplay && !prefersReduced && !userPaused.current) v.play().catch(() => {});
        if (!visible && !v.paused) v.pause();
      },
      { threshold: 0.25 },
    );
    visibility.observe(el);
    return () => {
      loader.disconnect();
      visibility.disconnect();
    };
  }, [src, mobileSrc, poster, mobilePoster, autoplay]);

  // Kaynak bağlandığında görünürdeyse oynatmayı başlat (görünürlük olayı kaynaktan önce gelmiş olabilir)
  useEffect(() => {
    const v = videoRef.current;
    if (!source || !v || !autoplay || reduced || userPaused.current || !inView.current) return;
    v.play().catch(() => {});
  }, [source, autoplay, reduced]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      userPaused.current = false;
      v.play().catch(() => {});
    } else {
      userPaused.current = true;
      v.pause();
    }
  };

  return (
    <div
      ref={wrapRef}
      style={{ "--ar": aspectRatio, "--ar-m": mobileAspectRatio ?? aspectRatio } as React.CSSProperties}
      className={cn("group/video relative w-full overflow-hidden bg-ink [aspect-ratio:var(--ar-m)] md:[aspect-ratio:var(--ar)]", rounded && "rounded-lg", className)}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-cover"
        src={source?.src}
        poster={source?.poster}
        muted
        playsInline
        loop={loop}
        preload={source ? "auto" : "none"}
        aria-label={title}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onLoadedData={(e) => {
          if (autoplay && !reduced && !userPaused.current) e.currentTarget.play().catch(() => {});
        }}
      />
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? `${title} videosunu duraklat` : `${title} videosunu oynat`}
        className={cn(
          "absolute right-4 bottom-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-ink shadow-soft backdrop-blur transition-opacity",
          playing ? "opacity-0 group-hover/video:opacity-100 focus-visible:opacity-100" : "opacity-100",
        )}
      >
        {playing ? <Pause aria-hidden="true" className="h-5 w-5" /> : <Play aria-hidden="true" className="ml-0.5 h-5 w-5 fill-ink" />}
      </button>
    </div>
  );
}
