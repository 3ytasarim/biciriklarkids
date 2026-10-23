import { privateMetadata } from "@/lib/seo/metadata";
import { FavoritesView } from "@/components/commerce/FavoritesView";

export const metadata = privateMetadata("Favorilerim");

export default function FavoritesPage() {
  return <FavoritesView />;
}
