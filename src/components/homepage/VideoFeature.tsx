import type { VideoSlot as VideoRow } from "@/lib/content/queries";
import { Hand, Scissors } from "lucide-react";
import { VideoSlot } from "@/components/video/VideoSlot";
import { cn } from "@/lib/utils";
import { HowToSteps, type HowToStep } from "./HowToSteps";

/** Yapım adımları — keçe oyuncak kitinin videoda görülen akışı (kit içeriği: delikli keçe parçalar, plastik iğne, ip, elyaf). */
const HOWTO_STEPS: HowToStep[] = [
  { title: "Parçaları masaya yayın", text: "Keçe figürün ön ve arka yüzünü, plastik iğneyi, ipi ve elyafı hazırlayın; bitince nasıl görüneceğine birlikte bakın." },
  { title: "İğneye ipi geçirin", text: "İpi plastik güvenli iğneden geçirip ucunu düğümleyin. İğne, minik ellerin rahatça tutabileceği boyuttadır." },
  { title: "Delikleri takip ederek dikin", text: "Ön ve arka yüzü üst üste getirin, kenardaki delikleri sırayla izleyerek dikin. Doldurmak için küçük bir açıklık bırakın." },
  { title: "Elyafı doldurun", text: "Açıklıktan elyafı azar azar doldurun; kulak ve kol gibi uçlara da itmeyi unutmayın." },
  { title: "Kapatın ve sergileyin", text: "Açıklığı dikip ipi düğümleyin. Kendi yaptığı oyuncak artık oynamaya ve sergilemeye hazır!" },
];

/**
 * Video bölümleri.
 * - wide: başlık üstte, tam genişlik geniş video (lifestyle / marka)
 * - steps: solda video, sağda kullanım adımları (Nasıl kullanılır?)
 * Video yoksa aynı ölçüde "VideoTest" yer tutucusu.
 */
export function VideoFeature({
  id,
  slot,
  video,
  eyebrow,
  title,
  subtitle,
  variant = "wide",
}: {
  id: string;
  slot: string;
  video: VideoRow | undefined;
  eyebrow?: string | null;
  title: string;
  subtitle?: string | null;
  variant?: "wide" | "steps";
}) {
  if (variant === "steps") {
    // Dikey video (ör. telefon çekimi 9:16): video sütunu daralır, adımlar genişler
    const portrait = isPortrait(video?.aspectRatio);
    return (
      <section id="nasil-kullanilir" aria-labelledby={`${id}-title`} className="bg-cream py-12 sm:py-24">
        <div className="shell grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Video: beyaz çerçeveli, hafif eğik kart + arkada dikiş çizgili gölge çerçeve + yüzen etiketler */}
          <div className={cn("howto-media reveal relative mx-auto w-full", portrait ? "max-w-[300px] sm:max-w-[340px] lg:col-span-5 lg:max-w-[360px]" : "max-w-2xl lg:col-span-7 lg:max-w-none")}>
            <span aria-hidden="true" className="absolute -inset-8 -z-10 rounded-[48px] bg-[radial-gradient(60%_60%_at_30%_30%,var(--color-brand-100),transparent_70%),radial-gradient(50%_50%_at_80%_80%,var(--color-sun-50),transparent_70%)] blur-2xl" />
            <span aria-hidden="true" className="absolute inset-0 translate-x-3 translate-y-3 rounded-[30px] border-2 border-dashed border-brand/35 sm:translate-x-4 sm:translate-y-4" />
            <div className="howto-frame relative rounded-[30px] bg-white p-2.5 shadow-[0_40px_80px_-40px_rgb(16_40_74/0.45)] ring-1 ring-brand/15 sm:p-3">
              <div className="overflow-hidden rounded-[22px]">
                <VideoSlot slot={slot} video={video} aspectRatio="4/3" mobileAspectRatio="4/3" fallbackTitle={title} rounded={false} />
              </div>
            </div>
            <span className="animate-float-a absolute -top-4 left-4 flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-extrabold text-ink shadow-lift ring-1 ring-line sm:-top-5 sm:left-6 sm:text-[13px]">
              <span aria-hidden="true" className="relative flex h-2.5 w-2.5"><span className="absolute inset-0 animate-ping rounded-full bg-coral/60" /><span className="relative h-2.5 w-2.5 rounded-full bg-coral" /></span>
              Gerçek çekim
            </span>
            <span className="animate-float-b absolute right-3 -bottom-6 flex items-center gap-3 rounded-2xl bg-white py-2.5 pr-4 pl-2.5 shadow-lift ring-1 ring-line sm:right-8 sm:-bottom-7">
              <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-berry-50 text-berry-ink"><Scissors className="h-5 w-5" /></span>
              <span className="leading-tight"><span className="block text-[13px] font-extrabold text-ink">Keçe tavşan dikiliyor</span><span className="flex items-center gap-1 text-xs text-ink-soft"><Hand aria-hidden="true" className="h-3.5 w-3.5" /> Küçük ellerle, adım adım</span></span>
            </span>
          </div>
          <div className={portrait ? "lg:col-span-7 lg:pl-6 xl:pl-10" : "lg:col-span-5"}>
            {eyebrow ? <p className="eyebrow reveal mb-3">{eyebrow}</p> : null}
            <h2 id={`${id}-title`} className="display-2 reveal">
              {title}
            </h2>
            {subtitle ? <p className="lead reveal mt-4">{subtitle}</p> : null}
            <HowToSteps steps={HOWTO_STEPS} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section aria-labelledby={`${id}-title`} className="py-10 sm:py-20">
      <div className="shell">
        <div className="reveal mx-auto mb-10 max-w-3xl text-center sm:mb-12">
          {eyebrow ? <p className="eyebrow mb-3 justify-center">{eyebrow}</p> : null}
          <h2 id={`${id}-title`} className="display-2">
            {title}
          </h2>
          {subtitle ? <p className="lead mx-auto mt-4 max-w-2xl">{subtitle}</p> : null}
        </div>
        <div className="reveal">
          <VideoSlot slot={slot} video={video} aspectRatio="21/9" mobileAspectRatio="4/5" fallbackTitle={title} />
        </div>
      </div>
    </section>
  );
}

/** "9/16" gibi oran yazısı dikey mi? */
function isPortrait(ratio: string | null | undefined) {
  const [w, h] = (ratio ?? "").split("/").map(Number);
  return Boolean(w && h && h > w);
}
