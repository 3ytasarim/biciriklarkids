import type { Metadata } from "next";
import ShopLayout from "./(shop)/layout";
import { NotFoundContent } from "@/components/ui/NotFoundContent";

export const metadata: Metadata = { title: { absolute: "Sayfa bulunamadı | Bıcırıklar Kids" }, robots: { index: false } };

/** Eşleşmeyen tüm URL'ler: mağaza kabuğu (header/footer) ile 404. */
export default function NotFound() {
  return (
    <ShopLayout>
      <NotFoundContent />
    </ShopLayout>
  );
}
