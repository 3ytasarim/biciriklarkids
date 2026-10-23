import type { NextConfig } from "next";

/**
 * Güvenlik başlıkları. CSP bilinçli olarak sonraya bırakıldı: GTM/Meta Pixel izin sonrası dinamik yüklendiği ve
 * inline JSON-LD kullanıldığı için nonce tabanlı politika ayrı tasarlanıp test edilmeli (docs/SECURITY.md).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const noindex = [{ key: "X-Robots-Tag", value: "noindex, nofollow" }];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // canonical/description/OG etiketleri tüm istemcilere (tüm tarayıcılar ve botlar) <head> içinde gelsin.
  htmlLimitedBots: /.*/,
  images: {
    formats: ["image/avif", "image/webp"],
    // Ürün görselleri için yüksek kalite (gereksiz kalite düşürme yok).
    qualities: [75, 90],
    deviceSizes: [360, 414, 640, 768, 1024, 1280, 1536, 1920, 2560],
  },
  experimental: {
    // Admin görsel yükleme limiti (lib/upload.ts: 10 MB) + multipart ek yükü.
    serverActions: { bodySizeLimit: "12mb" },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Statik videolar/posterler: tarayıcı + CDN 30 gün önbellekte tutar (dosya değişirse adı değiştirilmeli)
      { source: "/videos/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }] },
      { source: "/admin/:path*", headers: noindex },
      { source: "/api/:path*", headers: noindex },
      { source: "/sepet", headers: noindex },
      { source: "/odeme/:path*", headers: noindex },
      { source: "/hesabim/:path*", headers: noindex },
      { source: "/siparis/:path*", headers: noindex },
    ];
  },
};

export default nextConfig;
