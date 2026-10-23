import { privateMetadata } from "@/lib/seo/metadata";
import { CartPageView } from "@/components/commerce/CartPageView";

export const metadata = privateMetadata("Sepetim");

export default function CartPage() {
  return <CartPageView />;
}
