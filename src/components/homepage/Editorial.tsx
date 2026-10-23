import Link from "next/link";
import { ArrowRight, Award, Eye, Hand, Scissors, Sparkles, Target, type LucideIcon } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { VideoSlot as VideoRow } from "@/lib/content/queries";
import { LazyVideo } from "@/components/video/LazyVideo";

/**
 * Marka anlatısı: "Minik Eller İçin Büyük Hayaller". Dil bilinçli olarak ölçülü: tıbbi/bilimsel kanıt
 * iddiası yok; dikişin doğası gereği çocuğu davet ettiği beceriler anlatılır.
 * Düzen: ortalanmış başlık → masaüstünde ortada çerçeveli keçe görseli, iki yanda ikonlu maddeler (3 + 2).
 * Mobilde görsel üstte, maddeler altta tek sütun.
 */
type Pillar = { icon: LucideIcon; title: string; text: string; tint: string };

const PILLARS: Pillar[] = [
  { icon: Sparkles, title: "Hayal gücü", text: "Renkleri, figürü, hikâyeyi çocuk seçer; ortaya kendi tasarımı çıkar.", tint: "tint-sky" },
  { icon: Hand, title: "İnce motor becerileri", text: "İğneyi delikten geçirmek, ipi çekmek, düğüm atmak: küçük parmakların çalıştığı, sabır isteyen hareketler.", tint: "tint-sun" },
  { icon: Eye, title: "El-göz koordinasyonu", text: "Delikleri sırayla takip ederek ilerlemek, el ile gözü birlikte çalışmaya davet eder.", tint: "tint-leaf" },
  { icon: Target, title: "Odaklanma", text: "Bir parçayı bitirip diğerine geçmek; ekrandan uzak, sakin ve keyifli bir odak zamanı.", tint: "tint-lilac" },
  { icon: Award, title: "Üretme hissi", text: "“Bunu ben yaptım!” Bitmiş çanta ya da oyuncak, her gün kullanılan gerçek bir esere dönüşür.", tint: "tint-berry" },
];

function PillarItem({ pillar, index, align }: { pillar: Pillar; index: number; align: "left" | "right" }) {
  const { icon: Icon, title, text, tint } = pillar;
  const toFrame = align === "left"; // sol sütun: masaüstünde metin sağa yaslı, ikon görsele bakar
  return (
    <li className={cn("reveal group", tint, toFrame && "lg:text-right")} style={{ "--reveal-delay": `${index * 90}ms` } as React.CSSProperties}>
      <h3 className={cn("flex items-center gap-3.5", toFrame && "lg:flex-row-reverse")}>
        <span
          aria-hidden="true"
          className="pillar-icon relative flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-white shadow-[0_10px_24px_-14px_rgb(16_40_74/0.35)] ring-1 ring-(--tint-base)/30"
          style={{ color: "var(--tint-ink)" }}
        >
          <span className="absolute inset-1 rounded-[11px]" style={{ background: "var(--tint)" }} />
          <Icon className="relative h-5 w-5" />
        </span>
        <span className="font-display text-xl leading-tight font-extrabold tracking-[-0.01em] sm:text-[1.35rem]">{title}</span>
      </h3>
      <p className={cn("mt-3 max-w-sm text-[15px] leading-relaxed text-ink-soft sm:text-base", toFrame && "lg:ml-auto")}>{text}</p>
    </li>
  );
}

/** Orta çerçeve: `home-editorial` video slotu doluysa dikey (9:16) tanıtım videosu, değilse ürün görseli. */
export function Editorial({ eyebrow, title, video }: { eyebrow?: string | null; title: string; video?: VideoRow }) {
  const hasVideo = Boolean(video?.desktopUrl);
  const left = PILLARS.slice(0, 3);
  const right = PILLARS.slice(3);
  return (
    <section aria-labelledby="editorial-title" className="overflow-hidden py-10 sm:py-24 lg:py-28">
      <div className="shell">
        <header className="mx-auto max-w-3xl text-center">
          {eyebrow ? <p className="eyebrow reveal mb-4">{eyebrow}</p> : null}
          <h2 id="editorial-title" className="display-2 reveal">
            {title}
          </h2>
          <span aria-hidden="true" className="reveal mx-auto mt-5 block h-[3px] w-20 rounded-full bg-[repeating-linear-gradient(90deg,var(--color-brand)_0_10px,transparent_10px_16px)]" />
          <div className="reveal mt-6 space-y-3 text-[1.05rem] leading-relaxed text-ink-soft">
            <p>
              Bıcırıklar Kids’in dikiş kitleri, çocukların kendi çantalarını ve elyaf dolgulu keçe oyuncaklarını <strong className="text-ink">kendi elleriyle</strong> üretebilmesi için hazırlanır. Her sette renkli keçe parçalar, çocuklar
              için plastik iğne ve takip etmesi kolay bir anlatım bulunur.
            </p>
            <p>İster ilk el işi deneyimi olsun ister yeni bir beceri yolculuğu: amaç, keyifli vakit geçirirken üretmenin mutluluğunu yaşatmak.</p>
          </div>
        </header>

        <div className="mt-10 grid items-center gap-10 sm:mt-16 lg:grid-cols-[1fr_minmax(0,340px)_1fr] lg:gap-14 xl:gap-20">
          {/* Orta görsel/video — mobilde en üstte */}
          <div className={cn("reveal relative mx-auto w-full sm:max-w-[320px] lg:order-2 lg:max-w-none", hasVideo ? "max-w-[270px]" : "max-w-[300px]")}>
            <span aria-hidden="true" className="absolute -inset-10 -z-10 rounded-full bg-brand-50 blur-3xl" />
            <div className="relative rounded-[30px] bg-white p-3 shadow-[0_40px_80px_-40px_rgb(16_40_74/0.35)] ring-1 ring-brand/20">
              {hasVideo ? (
                <div className="overflow-hidden rounded-[22px]">
                  <LazyVideo src={video!.desktopUrl!} mobileSrc={video!.mobileUrl} poster={video!.posterUrl} mobilePoster={video!.mobilePosterUrl} aspectRatio="9/16" title={video!.title} autoplay={video!.autoplay} loop={video!.loop} rounded={false} />
                </div>
              ) : (
                <div className="relative aspect-[4/5] overflow-hidden rounded-[22px] bg-[#fcf1ed]">
                  <Image src="/images/home/seccade-pembe.webp" alt="Pembe keçe çocuk seccadesi: cami figürü ve “Mutluluk Namazda” yazısı" fill sizes="(min-width: 1024px) 340px, 320px" className="object-cover" />
                </div>
              )}
              <span aria-hidden="true" className="animate-float-a absolute -top-5 -right-5 flex h-14 w-14 items-center justify-center rounded-[16px] bg-white text-brand-ink shadow-lift ring-1 ring-brand/20">
                <Scissors className="h-6 w-6" />
              </span>
              <span aria-hidden="true" className="animate-float-b absolute -bottom-5 -left-5 flex h-14 w-14 items-center justify-center rounded-[16px] bg-white text-berry-ink shadow-lift ring-1 ring-brand/20">
                <Award className="h-6 w-6" />
              </span>
            </div>
          </div>

          <ol className="space-y-9 lg:order-1 lg:space-y-12">
            {left.map((p, i) => (
              <PillarItem key={p.title} pillar={p} index={i} align="left" />
            ))}
          </ol>
          <ol start={4} className="-mt-1 space-y-9 lg:order-3 lg:mt-0 lg:space-y-12">
            {right.map((p, i) => (
              <PillarItem key={p.title} pillar={p} index={i + 3} align="right" />
            ))}
          </ol>
        </div>

        <div className="reveal mt-12 flex justify-center sm:mt-16">
          <Link href="/urunler" className="btn-dark">
            Kitleri keşfedin <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
