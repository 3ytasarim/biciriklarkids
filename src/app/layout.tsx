import type { Metadata, Viewport } from "next";
import { Nunito, Nunito_Sans } from "next/font/google";
import { getSiteUrl, SITE_NAME } from "@/lib/seo/site";
import "./globals.css";

// next/font: build sırasında indirilip self-host edilir (çalışma zamanında Google'a istek yok), size-adjust
// fallback ile CLS oluşmaz. latin-ext → Türkçe karakterler (ğ, ş, ı, İ).
// Başlık: Nunito (yuvarlak uçlar → logodaki "puf" harflerle akraba, ama çizgi film fontu değil). Metin: Nunito Sans.
const nunitoDisplay = Nunito({ subsets: ["latin", "latin-ext"], variable: "--font-nunito-display", display: "swap" });
const nunito = Nunito_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-nunito", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  applicationName: SITE_NAME,
  formatDetection: { telephone: false, address: false, email: false },
  appleWebApp: { title: SITE_NAME },
};

export const viewport: Viewport = {
  themeColor: "#fbfdff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${nunitoDisplay.variable} ${nunito.variable}`} suppressHydrationWarning>
      <head>
        {/* JS çalışıyorsa işaretle: kaydırmayla beliren içerik yalnızca bu durumda gizli başlar (JS'siz tarayıcı/bot her şeyi görür). */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
