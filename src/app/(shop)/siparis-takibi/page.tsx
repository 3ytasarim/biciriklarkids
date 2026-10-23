import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { TrackForm } from "./TrackForm";

export const metadata: Metadata = {
  title: { absolute: "Sipariş Takibi | Bıcırıklar Kids" },
  description: "Sipariş numaranız ve e-posta adresinizle Bıcırıklar Kids siparişinizin durumunu sorgulayın.",
  robots: { index: false, follow: true },
};

export default function TrackPage() {
  return (
    <div className="shell pt-4 pb-16 sm:pt-6">
      <Breadcrumbs items={[{ name: "Ana Sayfa", path: "/" }, { name: "Sipariş Takibi", path: "/siparis-takibi" }]} className="mb-6" />
      <h1 className="display-2">Sipariş takibi</h1>
      <p className="lead mt-4 max-w-2xl">Sipariş numaranızı ve sipariş verirken kullandığınız e-posta adresini girerek siparişinizin güncel durumunu görebilirsiniz.</p>
      <TrackForm />
    </div>
  );
}
