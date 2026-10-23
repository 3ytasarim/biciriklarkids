import { requireAdmin } from "@/lib/auth/admin";
import { PageHeader } from "@/components/admin/ui";
import { categoryOptions } from "../../urunler/data";
import { CategoryForm } from "../CategoryForm";
import { saveCategoryAction } from "../actions";

export const metadata = { title: "Yeni kategori" };

export default async function NewCategory() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Yeni kategori" back={{ label: "Kategoriler", href: "/admin/kategoriler" }} />
      <CategoryForm action={saveCategoryAction.bind(null, null)} parents={await categoryOptions()} />
    </>
  );
}
