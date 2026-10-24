import { getSiteSettings, resolveAnalyticsIds } from "@/lib/settings";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommerceProvider } from "@/components/commerce/CommerceProvider";
import { CookieConsent } from "@/components/marketing/CookieConsent";
import { Analytics } from "@/components/marketing/Analytics";
import { RevealObserver } from "@/components/ui/RevealObserver";
import { InductionButtons } from "@/components/ui/induction-button";
import { PromoPopup, type PromoPopupData } from "@/components/marketing/PromoPopup";
import { getMediaDimensions } from "@/lib/upload";

/** Mağaza kabuğu: duyuru çubuğu, sticky header, footer, sepet/arama durumu, çerez izni ve analitik. */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
  const popup = await popupData(settings.popup);
  return (
    <CommerceProvider>
      <a href="#icerik" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:font-bold focus:text-white">
        İçeriğe geç
      </a>
      <AnnouncementBar announcement={settings.announcement} />
      <Header contact={{ phone: settings.contact.phone, email: settings.contact.email }} />
      <main id="icerik" className="min-h-[60vh]">
        {children}
      </main>
      <Footer settings={settings} />
      <CookieConsent />
      <Analytics ids={resolveAnalyticsIds(settings.analytics)} />
      <RevealObserver />
      <InductionButtons />
      {popup ? <PromoPopup data={popup} /> : null}
    </CommerceProvider>
  );
}

/** İstanbul saati (UTC+3, yaz saati yok) ile girilen tarihi ISO'ya çevirir. */
const istanbulIso = (v: string | null) => (v ? `${v}:00+03:00` : null);

async function popupData(p: Awaited<ReturnType<typeof getSiteSettings>>["popup"]): Promise<PromoPopupData | null> {
  if (!p.enabled || !p.imageUrl) return null;
  const endsAt = istanbulIso(p.endsAt);
  if (endsAt && Date.parse(endsAt) < Date.now()) return null;
  const dims = (await getMediaDimensions([p.imageUrl]).catch(() => null))?.get(p.imageUrl);
  return {
    imageUrl: p.imageUrl,
    alt: p.alt,
    href: p.href,
    startsAt: istanbulIso(p.startsAt),
    endsAt,
    delaySeconds: p.delaySeconds,
    hideDays: p.hideDays,
    width: dims?.width ?? 1080,
    height: dims?.height ?? 1350,
  };
}
