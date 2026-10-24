import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Gift } from "lucide-react";
import { SkyDrift, SoftClouds } from "@/components/ui/Clouds";
import { KitCard } from "./KitCard";

export type HeroContent = {
  eyebrow: string;
  title: string;
  /** Başlıkta vurgulanacak kısım (başlığın içinde geçmeli). */
  highlight?: string | null;
  subtitle: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string };
  image?: { url: string; alt: string; mobileUrl?: string | null } | null;
};

export const DEFAULT_HERO: HeroContent = {
  eyebrow: "Çocuklar için keçe dikiş ve DIY kitleri",
  title: "Minik eller için büyük hayaller.",
  highlight: "büyük hayaller",
  subtitle:
    "Çantasını kendi diken, oyuncağını kendi dolduran çocuğun gururu başka. Bıcırıklar Kids kitleri; hazır keçe parçaları, çocuk dostu plastik iğne ve adım adım anlatımla kutudan çıktığı gibi üretmeye hazır.",
  primary: { label: "Ürünleri Keşfet", href: "/urunler" },
  secondary: { label: "Hediyelik Setler", href: "/hediyelik" },
};

const TRUST = ["Çocuk dostu plastik iğne", "Adım adım anlatım", "Özenle paketlenir"];
const KIT = ["Hazır keçe parçalar", "Plastik güvenli iğne", "Dikiş ipi", "Adım adım rehber"];

function Title({ title, highlight }: { title: string; highlight?: string | null }) {
  if (!highlight || !title.includes(highlight)) return <>{title}</>;
  const [before, after] = title.split(highlight);
  return (
    <>
      {before}
      <span className="relative inline-block pb-3 text-brand-ink sm:pb-4 lg:pb-5">
        <span className="text-rainbow">{highlight}</span>
        {/* Dikiş çizgisi: harf uzantılarının (y, ç) altında; açılışta soldan çizilir, sonra dikişler yavaşça akar. */}
        <svg aria-hidden="true" viewBox="0 0 300 16" preserveAspectRatio="none" className="hero-stitch absolute bottom-0 left-0 h-3 w-full text-sun sm:h-4">
          <path d="M3 10 C 60 3, 120 14, 180 7 S 270 4, 297 9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeDasharray="14 9" />
        </svg>
      </span>
      {after}
    </>
  );
}

/**
 * Ana sayfa hero'su — editoryal kompozisyon: güçlü H1 + değer önerisi + 2 CTA + güven satırı; sağda büyük
 * görsel karosu, "kutunun içinde" kartı ve ikincil keçe karosu. Görsel admin'den (Admin › Bannerlar) gelir;
 * yoksa marka illüstrasyonu (stok fotoğraf yok). LCP: görsel varsa priority, yoksa H1 metni.
 */
export function Hero({ content }: { content: HeroContent }) {
  return (
    <section aria-labelledby="hero-title" className="sky-wash relative overflow-hidden">
      <SoftClouds />
      <SkyDrift />
      <div className="shell relative pt-5 pb-14 sm:pt-10 lg:pt-12 lg:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-6 xl:col-span-6">
            <p className="eyebrow animate-rise">
              {content.eyebrow}
            </p>
            <h1 id="hero-title" className="display-1 mt-4 animate-rise [animation-delay:60ms] sm:mt-5">
              <Title title={content.title} highlight={content.highlight} />
            </h1>
            <p className="lead mt-4 max-w-xl animate-rise text-base [animation-delay:120ms] sm:mt-6 sm:text-lg">{content.subtitle}</p>
            <div className="mt-6 flex animate-rise flex-col gap-3 [animation-delay:180ms] min-[420px]:flex-row sm:mt-8">
              <Link href={content.primary.href} className="btn-primary min-h-13 px-8 text-base sm:min-h-14">
                {content.primary.label} <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </Link>
              <Link href={content.secondary.href} className="btn-outline min-h-13 px-7 text-base sm:min-h-14">
                <Gift aria-hidden="true" className="h-5 w-5 text-berry-ink" /> {content.secondary.label}
              </Link>
            </div>
            <ul className="mt-8 flex animate-rise flex-wrap gap-x-6 gap-y-2 text-sm font-bold text-ink-soft [animation-delay:240ms]">
              {TRUST.map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-leaf-50 text-leaf-ink">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative lg:col-span-6 xl:col-span-6">
            <div className="relative grid grid-cols-6 grid-rows-6 gap-3 sm:gap-4 [aspect-ratio:1/1.02] lg:[aspect-ratio:1/1.05]">
              {/* Büyük karo */}
              <div className="relative col-span-6 row-span-6 overflow-hidden rounded-xl bg-sky-50 shadow-lift sm:col-span-4">
                {content.image ? (
                  <Image src={content.image.url} alt={content.image.alt} fill priority sizes="(min-width: 1024px) 34vw, (min-width: 640px) 66vw, 100vw" className="object-cover" />
                ) : (
                  // Banner yoksa: stüdyo formatında gerçek ürün (beyaz fon multiply ile karo zeminine karışır, kırpılmaz)
                  <Image src="/images/home/hero-canta.webp" alt="Avokado figürlü keçe çanta: Bıcırıklar Kids çanta dikiş kitiyle çocuğun diktiği çanta" fill priority sizes="(min-width: 1024px) 34vw, (min-width: 640px) 66vw, 100vw" className="object-contain p-4 mix-blend-multiply sm:p-6" />
                )}
              </div>
              {/* İkincil karolar (sm+) */}
              <div className="relative col-span-2 row-span-3 hidden overflow-hidden rounded-lg bg-sun-50 sm:block">
                <Image src="/images/home/hero-zurafa.webp" alt="Zürafa figürlü elyaf dolgulu keçe oyuncak" fill sizes="(min-width: 1024px) 16vw, 30vw" className="object-contain p-2 mix-blend-multiply" />
              </div>
              <div className="relative col-span-2 row-span-3 hidden overflow-hidden rounded-lg bg-berry-50 sm:block">
                <Image src="/images/home/hero-denizanasi.webp" alt="Denizanası figürlü elyaf dolgulu keçe oyuncak" fill sizes="(min-width: 1024px) 16vw, 30vw" className="object-contain p-2 mix-blend-multiply" />
              </div>
            </div>

            {/* Kutunun içinde kartı: mobilde görselin altında (ürünü örtmesin), sm+ karonun köşesinde */}
            <div className="relative mx-auto mt-4 w-full max-w-[340px] sm:absolute sm:-bottom-8 sm:-left-6 sm:mx-0 sm:mt-0 sm:w-[250px] sm:max-w-none lg:-left-10">
              <KitCard items={KIT} note="Tam içerik her ürün sayfasında listelenir." />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
