"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { SafeImage } from "@/components/ui/SafeImage";
import { LazyVideo } from "@/components/video/LazyVideo";
import { cn } from "@/lib/utils";

export type GalleryImage = { url: string; alt: string; width: number | null; height: number | null };

/** 4:5 kareye uyan görsel doldurur; farklı oranlı görsel (ör. bilgi afişi) kırpılmadan sığdırılır. */
function fitClass(img: GalleryImage) {
  if (!img.width || !img.height) return "object-cover";
  return Math.abs(img.width / img.height - 0.8) < 0.04 ? "object-cover" : "object-contain";
}
export type GalleryVideo = { src: string; mobileSrc?: string | null; poster?: string | null; title: string; aspectRatio: string };

/**
 * Ürün galerisi.
 * - Masaüstü: büyük görsel + küçük resimler; fareyle üzerine gelince yakınlaştırma (zoom lens, transform-origin)
 * - Mobil: kaydırmalı (scroll-snap) galeri + nokta göstergesi
 * - Tıklayınca tam ekran lightbox (ok tuşları, Esc)
 * - Ürün videosu varsa galerinin son öğesi olarak (yalnızca gerçek video)
 * İlk görsel priority (LCP), width/height ile CLS yok.
 */
export function ProductGallery({ images, video, name }: { images: GalleryImage[]; video?: GalleryVideo | null; name: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const total = images.length + (video ? 1 : 0);
  const isVideo = (i: number) => Boolean(video) && i === images.length;

  const go = (i: number) => {
    const next = (i + total) % total;
    setActive(next);
    const el = scrollerRef.current?.children[next] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  };

  if (!total) {
    return <div className="aspect-[4/5] rounded-lg bg-cream" aria-hidden="true" />;
  }

  return (
    <div className="lg:grid lg:grid-cols-[84px_1fr] lg:gap-4">
      {/* Küçük resimler (masaüstü) */}
      {total > 1 ? (
        <ul className="hidden max-h-[680px] flex-col gap-3 overflow-y-auto no-scrollbar lg:flex" aria-label="Ürün görselleri">
          {images.map((img, i) => (
            <li key={img.url}>
              <button type="button" onClick={() => setActive(i)} aria-label={`Görsel ${i + 1}`} aria-current={active === i} className={cn("shot relative block aspect-[4/5] w-full overflow-hidden rounded-sm ring-2 ring-offset-2 ring-offset-paper transition", active === i ? "ring-ink" : "ring-transparent opacity-75 hover:opacity-100")}>
                <SafeImage src={img.url} alt="" fill sizes="84px" className="object-cover" />
              </button>
            </li>
          ))}
          {video ? (
            <li>
              <button type="button" onClick={() => setActive(images.length)} aria-label="Ürün videosu" aria-current={isVideo(active)} className={cn("flex aspect-[4/5] w-full items-center justify-center rounded-sm bg-ink text-xs font-extrabold text-white ring-2 ring-offset-2 ring-offset-paper", isVideo(active) ? "ring-ink" : "ring-transparent")}>
                ▶ Video
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className={cn("relative", total <= 1 && "lg:col-span-2")}>
        {/* Masaüstü ana görsel + zoom */}
        <div className="hidden lg:block">
          {isVideo(active) && video ? (
            <LazyVideo src={video.src} mobileSrc={video.mobileSrc} poster={video.poster} aspectRatio="4/5" title={video.title} autoplay />
          ) : (
            <button
              type="button"
              onClick={() => setLightbox(true)}
              onMouseMove={(e) => {
                const r = e.currentTarget.getBoundingClientRect();
                setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
              }}
              onMouseLeave={() => setZoom(null)}
              className="shot relative block aspect-[4/5] w-full cursor-zoom-in overflow-hidden rounded-lg"
              aria-label={`${name} — görseli büyüt`}
            >
              <SafeImage
                src={images[active]!.url}
                alt={images[active]!.alt || name}
                fill
                priority={active === 0}
                sizes="(min-width: 1024px) 50vw, 100vw"
                quality={90}
                className={cn(fitClass(images[active]!), "transition-transform duration-200 ease-out")}
                style={zoom ? { transform: "scale(1.9)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
              />
              <span aria-hidden="true" className="absolute right-4 bottom-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-soft">
                <Expand className="h-5 w-5" />
              </span>
            </button>
          )}
        </div>

        {/* Mobil kaydırmalı galeri */}
        <div className="-mx-4 sm:-mx-6 lg:hidden">
          <ul
            ref={scrollerRef}
            className="flex snap-x snap-mandatory overflow-x-auto no-scrollbar"
            onScroll={(e) => {
              const el = e.currentTarget;
              const i = Math.round(el.scrollLeft / el.clientWidth);
              if (i !== active) setActive(i);
            }}
            aria-label="Ürün görselleri"
          >
            {images.map((img, i) => (
              <li key={img.url} className="w-full shrink-0 snap-start">
                <button type="button" onClick={() => setLightbox(true)} className="shot relative block aspect-[4/5] w-full" aria-label={`Görsel ${i + 1} — büyüt`}>
                  <SafeImage src={img.url} alt={img.alt || name} fill priority={i === 0} sizes="(min-width: 1024px) 50vw, 100vw" quality={75} className={fitClass(img)} />
                </button>
              </li>
            ))}
            {video ? (
              <li className="w-full shrink-0 snap-start">
                <LazyVideo src={video.src} mobileSrc={video.mobileSrc} poster={video.poster} aspectRatio="4/5" title={video.title} autoplay rounded={false} />
              </li>
            ) : null}
          </ul>
          {total > 1 ? (
            <div className="mt-3 flex justify-center gap-1.5" aria-hidden="true">
              {Array.from({ length: total }, (_, i) => (
                <span key={i} className={cn("h-1.5 rounded-full transition-all duration-300", i === active ? "w-6 bg-ink" : "w-1.5 bg-line-strong")} />
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <Dialog.Root open={lightbox} onOpenChange={setLightbox}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[80] bg-ink/95 data-[state=open]:animate-fade" />
          <Dialog.Content
            className="fixed inset-0 z-[90] flex items-center justify-center outline-none"
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") go(Math.min(active + 1, images.length - 1));
              if (e.key === "ArrowLeft") go(Math.max(active - 1, 0));
            }}
          >
            <Dialog.Title className="sr-only">{name} — görsel {Math.min(active, images.length - 1) + 1} / {images.length}</Dialog.Title>
            <Dialog.Description className="sr-only">Ok tuşlarıyla görseller arasında geçiş yapın.</Dialog.Description>
            <div className="relative h-[86dvh] w-[min(92vw,1100px)]">
              {images[Math.min(active, images.length - 1)] ? (
                <SafeImage src={images[Math.min(active, images.length - 1)]!.url} alt={images[Math.min(active, images.length - 1)]!.alt || name} fill sizes="92vw" quality={75} className="object-contain" />
              ) : null}
            </div>
            <Dialog.Close className="icon-btn absolute top-4 right-4 bg-white text-ink" aria-label="Kapat">
              <X aria-hidden="true" className="h-5 w-5" />
            </Dialog.Close>
            {images.length > 1 ? (
              <>
                <button type="button" onClick={() => go(Math.max(active - 1, 0))} className="icon-btn absolute top-1/2 left-3 -translate-y-1/2 bg-white text-ink sm:left-6" aria-label="Önceki görsel">
                  <ChevronLeft aria-hidden="true" className="h-6 w-6" />
                </button>
                <button type="button" onClick={() => go(Math.min(active + 1, images.length - 1))} className="icon-btn absolute top-1/2 right-3 -translate-y-1/2 bg-white text-ink sm:right-6" aria-label="Sonraki görsel">
                  <ChevronRight aria-hidden="true" className="h-6 w-6" />
                </button>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
