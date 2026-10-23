import type { Metadata } from "next";
import { GlassBackdrop } from "@/components/admin/GlassBackdrop";

export const metadata: Metadata = {
  title: { default: "Yönetim", template: "%s · Bıcırıklar Yönetim" },
  robots: { index: false, follow: false, nocache: true },
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
