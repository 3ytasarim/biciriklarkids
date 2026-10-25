import type { Metadata } from "next";
import { GlassBackdrop } from "@/components/admin/GlassBackdrop";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s · Bıcırıklar Yönetim" },
  robots: { index: false, follow: false, nocache: true },
  // Panel bağlantısı paylaşılınca (WhatsApp vb.) sitenin marka görseli görünsün; panel yine indekslenmez.
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "Bıcırıklar Kids",
    title: "Bıcırıklar Kids · Yönetim Paneli",
    description: "Bıcırıklar Kids mağaza yönetim paneli.",
    images: [{ url: "/og/site", width: 1200, height: 630, type: "image/png", alt: "Bıcırıklar Kids — Minik Eller İçin Büyük Hayaller" }],
  },
  twitter: { card: "summary_large_image", title: "Bıcırıklar Kids · Yönetim Paneli", images: ["/og/site"] },
};

/** Yönetim kökü: açık cam tema (stiller globals.css › "Yönetim paneli — açık glass tema"). */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-glass relative isolate min-h-screen text-ink">
      <GlassBackdrop />
      {children}
    </div>
  );
}
