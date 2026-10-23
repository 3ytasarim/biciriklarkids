import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "../ProductForm";
import { saveProductAction } from "../actions";
import { categoryOptions, productTypeSuggestions } from "../data";

export const metadata = { title: "Yeni ürün" };

export default async function NewProductPage() {
  await requireAdmin();
  const [categories, productTypes] = await Promise.all([categoryOptions(), productTypeSuggestions()]);
  return (
    <>
      <PageHeader title="Yeni ürün" back={{ label: "Ürünler", href: "/admin/urunler" }} />
      <ProductForm action={saveProductAction.bind(null, null)} images={[]} variants={[]} categories={categories} productTypes={productTypes} />
    </>
  );
}
