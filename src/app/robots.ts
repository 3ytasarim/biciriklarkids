import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";

/**
 * robots.txt — özel/işlem sayfaları taranmaz (admin, hesap, sepet, ödeme, sipariş, API, arama sonuçları,
 * filtre/sıralama varyasyonları). Tüm tarayıcılar için
 * ayrı kural yok → genel kurala tabidir (GEO: herkese açık içerik alıntılanabilir).
 */
export default function robots(): MetadataRoute.Robots {
  const disallow = ["/admin", "/api/", "/hesabim", "/sepet", "/odeme", "/siparis/", "/siparis-takibi", "/favoriler", "/arama", "/*?*siralama="];
  return {
    rules: [{ userAgent: "*", allow: "/", disallow }],
    sitemap: `${getSiteUrl()}/sitemap.xml`,
    host: getSiteUrl(),
  };
}
