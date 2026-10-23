"use client";

import Script from "next/script";
import { useEffect } from "react";
import type { Consent } from "@/lib/consent";
import { useConsent } from "@/lib/consent/useConsent";

export type AnalyticsIds = { gtmId: string | null; ga4Id: string | null; googleAdsId: string | null; metaPixelId: string | null };

const SAFE_ID = /^[A-Za-z0-9-]{4,40}$/;

/**
 * Pazarlama/analitik script yükleyici.
 * - ID tanımlı değilse hiçbir şey yüklenmez
 * - Kullanıcı izin vermeden HİÇBİR üçüncü taraf script yüklenmez
 * - Google Consent Mode v2: izin durumu gtag('consent', 'update') ile bildirilir
 * - GTM varsa GA4/Ads etiketleri GTM içinden yönetilir; yoksa doğrudan gtag.js
 */
export function Analytics({ ids }: { ids: AnalyticsIds }) {
  const consent = useConsent();

  const gtm = ids.gtmId && SAFE_ID.test(ids.gtmId) ? ids.gtmId : null;
  const ga4 = ids.ga4Id && SAFE_ID.test(ids.ga4Id) ? ids.ga4Id : null;
  const ads = ids.googleAdsId && SAFE_ID.test(ids.googleAdsId) ? ids.googleAdsId : null;
  const pixel = ids.metaPixelId && /^\d{6,20}$/.test(ids.metaPixelId) ? ids.metaPixelId : null;

  const analyticsOk = Boolean(consent?.analytics);
  const marketingOk = Boolean(consent?.marketing);
  const googleNeeded = (gtm || ga4 || ads) && (analyticsOk || marketingOk);

  // İzin değişikliğini Consent Mode'a bildir (script zaten yüklüyse).
  useEffect(() => {
    if (!consent || typeof window.gtag !== "function") return;
    window.gtag("consent", "update", consentState(consent));
  }, [consent]);

  if (!consent) return null;

  const consentJson = JSON.stringify(consentState(consent));
  const gtagConfig = [ga4 && analyticsOk ? `gtag('config','${ga4}',{send_page_view:true});` : "", ads && marketingOk ? `gtag('config','${ads}');` : ""].join("");

  return (
    <>
      {googleNeeded ? (
        <Script id="bk-consent-default" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('consent','default',${consentJson});gtag('set','ads_data_redaction',${!marketingOk});`}
        </Script>
      ) : null}

      {googleNeeded && gtm ? (
        <Script id="bk-gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtm}');`}
        </Script>
      ) : null}

      {googleNeeded && !gtm && (ga4 || ads) ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4 ?? ads}`} strategy="afterInteractive" />
          <Script id="bk-gtag" strategy="afterInteractive">
            {`gtag('js',new Date());${gtagConfig}`}
          </Script>
        </>
      ) : null}

      {pixel && marketingOk ? (
        <Script id="bk-meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel}');fbq('track','PageView');`}
        </Script>
      ) : null}
    </>
  );
}

function consentState(c: Consent) {
  return {
    analytics_storage: c.analytics ? "granted" : "denied",
    ad_storage: c.marketing ? "granted" : "denied",
    ad_user_data: c.marketing ? "granted" : "denied",
    ad_personalization: c.marketing ? "granted" : "denied",
    functionality_storage: "granted",
    security_storage: "granted",
  };
}
