import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/lib/db/schema";
import { cn } from "@/lib/utils";
import { RevealText } from "@/components/ui/RevealText";

/**
 * SSS — "text reveal" (JS'siz, details/summary ile):
 * soru açılınca cevabın harfleri sırayla bulanıktan netleşerek belirir.
 * - Yerel <details>/<summary>: JS gerektirmez, klavye erişilebilir; içerik ilk HTML'de (SEO/GEO)
 * - Animasyon saf CSS (her açılışta yeniden oynar); kelimeler bölünmez (kelime grupları nowrap)
 * - Ekran okuyucu tam cümleyi okur (görsel harf kopyası aria-hidden)
 * - prefers-reduced-motion: harf animasyonu yok
 * FAQPage şeması yalnızca bu bileşen sayfada görünürken eklenir.
 */
export function FaqList({ items, className, headingLevel: H = "h3", openFirst = false }: { items: FaqItem[]; className?: string; headingLevel?: "h2" | "h3"; openFirst?: boolean }) {
  const list = items.filter((f) => f.question.trim() && f.answer.trim());
  if (!list.length) return null;
  return (
    <div className={cn("space-y-3", className)}>
      {list.map((f, i) => {
        const isHtml = f.answer.includes("<");
        return (
          <details key={f.question} open={openFirst && i === 0} className="faq-item reveal group" style={{ "--reveal-delay": `${i * 70}ms` } as React.CSSProperties}>
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-6 px-5 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
              <H className="font-sans text-[16px] leading-snug font-extrabold sm:text-[17px]">{f.question}</H>
              <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cream text-ink transition-[transform,background-color,color] duration-500 ease-(--ease-premium) group-open:rotate-180 group-open:bg-brand-ink group-open:text-white">
                <ChevronDown className="h-4 w-4" />
              </span>
            </summary>
            <div className="px-5 pb-5 text-[15px] leading-relaxed text-ink-soft sm:px-6 sm:text-base">
              {isHtml ? (
                <div className="faq-fade" dangerouslySetInnerHTML={{ __html: f.answer }} />
              ) : (
                <p>
                  <span className="sr-only">{f.answer}</span>
                  <RevealText text={f.answer} charClass="faq-ch" by="word" />
                </p>
              )}
            </div>
          </details>
        );
      })}
    </div>
  );
}
