"use client";

import { AdminForm, SaveBar } from "@/components/admin/AdminForm";
import { TextInput } from "@/components/admin/fields";
import { saveBlogCategoryAction } from "./actions";

export function BlogCategoryForm() {
  return (
    <AdminForm action={saveBlogCategoryAction.bind(null, null)} resetOnSuccess className="mt-4 space-y-3">
      <TextInput name="name" label="Yeni kategori" required />
      <TextInput name="description" label="Açıklama" />
      <input type="hidden" name="sortOrder" value="0" />
      <SaveBar label="Ekle" />
    </AdminForm>
  );
}
