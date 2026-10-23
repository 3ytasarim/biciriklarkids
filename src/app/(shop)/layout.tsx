import { getSiteSettings, resolveAnalyticsIds } from "@/lib/settings";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CommerceProvider } from "@/components/commerce/CommerceProvider";
import { CookieConsent } from "@/components/marketing/CookieConsent";
import { Analytics } from "@/components/marketing/Analytics";
import { RevealObserver } from "@/components/ui/RevealObserver";

/** Mağaza kabuğu: duyuru çubuğu, sticky header, footer, sepet/arama durumu, çerez izni ve analitik. */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();
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
    </CommerceProvider>
  );
}
