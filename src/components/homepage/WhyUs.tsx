import { Gift, Heart, Lightbulb, Palette, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Güven bölümü — sertifika, rakam veya ödül iddiası YOK; yalnızca ürünün doğasından gelen gerçek nitelikler. */
const ITEMS = [
  { icon: ShieldCheck, title: "Çocuklara Uygun Tasarım", text: "Plastik güvenli iğne, kolay tutulan keçe parçalar ve yaşa uygun zorluk seviyeleri.", tint: "tint-leaf" },
  { icon: Heart, title: "Üretmenin Mutluluğu", text: "Hazır bir oyuncak yerine, çocuğun kendi elleriyle tamamladığı ve sahiplendiği bir eser.", tint: "tint-berry" },
  { icon: Lightbulb, title: "Eğlenceli Öğrenme", text: "Dikiş, sıralama ve sabır; oyun gibi geçen bir zamanın içinde kendiliğinden öğrenilir.", tint: "tint-sun" },
  { icon: Gift, title: "Hediye Etmeye Hazır", text: "Doğum günü, karne ya da bayram: özenle paketlenmiş, açıldığı an başlanabilen bir hediye.", tint: "tint-coral" },
  { icon: Palette, title: "Yaratıcılığı Destekleyen Aktiviteler", text: "Dikiş, punch, boyama ve kendin yap setleri: farklı ilgi alanları için farklı yollar.", tint: "tint-sky" },
];

/**
 * Çerçeveli kartlar: ofsetli ince dış çerçeve + kaydırılmış renk geçişi bloğu +
 * köşede süzülen ikon rozeti. Hover'da kart kalkar, çerçeve ve renk bloğu ayrışır.
 */
export function WhyUs({ eyebrow, title }: { eyebrow?: string | null; title: string }) {
  return (
    <section aria-labelledby="why-title" className="py-10 sm:py-24">
      <div className="shell">
        <div className="reveal max-w-3xl">
          {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
          <h2 id="why-title" className="display-2">
            {title}
          </h2>
        </div>
        <ul className="mt-10 grid gap-x-8 gap-y-12 sm:mt-14 sm:gap-y-14 sm:grid-cols-2 lg:grid-cols-6 lg:gap-x-10">
          {ITEMS.map(({ icon: Icon, title: t, text, tint }, i) => (
            <li key={t} className={cn("reveal lg:col-span-2", i === 3 && "lg:col-start-2", tint)} style={{ "--reveal-delay": `${i * 80}ms` } as React.CSSProperties}>
              <div className="why-card group relative isolate mx-3 mt-6 h-[calc(100%-1.5rem)]">
                {/* ofsetli dış çerçeve */}
                <div aria-hidden="true" className="why-frame absolute -inset-3 rounded-[1.75rem] border" style={{ borderColor: "color-mix(in srgb, var(--tint-base) 45%, transparent)" }} />
                {/* kaydırılmış renk geçişi bloğu */}
                <div aria-hidden="true" className="why-shade absolute -inset-3 -z-10 translate-x-3 translate-y-3 rounded-[1.75rem]" style={{ background: "linear-gradient(135deg, color-mix(in srgb, var(--tint-base) 28%, transparent), transparent 70%)" }} />
                {/* kart */}
                <div className="relative flex h-full flex-col rounded-[1.35rem] bg-white px-6 pt-10 pb-7 shadow-[0_24px_50px_-30px_rgb(16_40_74/0.35)] ring-1 ring-line">
                  <h3 className="font-display text-xl leading-snug font-extrabold">{t}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{text}</p>
                </div>
                {/* süzülen ikon rozeti */}
                <span
                  aria-hidden="true"
                  className={cn("absolute -top-6 -left-3 flex h-14 w-14 items-center justify-center rounded-2xl border bg-white/95 shadow-lg backdrop-blur", i % 2 ? "animate-float-b" : "animate-float-a")}
                  style={{ color: "var(--tint-ink)", borderColor: "color-mix(in srgb, var(--tint-base) 40%, transparent)" }}
                >
                  <Icon className="h-6 w-6 transition-transform duration-500 ease-(--ease-premium) group-hover:scale-110 group-hover:rotate-6" />
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
