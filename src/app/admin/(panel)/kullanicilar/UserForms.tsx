"use client";

import { AdminForm, SaveBar } from "@/components/admin/AdminForm";
import { Section, SelectInput, TextInput } from "@/components/admin/fields";
import { changePasswordAction, createAdminUserAction } from "./actions";

export function CreateUserForm() {
  return (
    <AdminForm action={createAdminUserAction} resetOnSuccess className="space-y-4">
      <Section title="Yeni yönetici">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput name="name" label="Ad soyad" required />
          <TextInput name="email" label="E-posta" type="email" required />
          <SelectInput
            name="role"
            label="Rol"
            defaultValue="editor"
            options={[
              { value: "editor", label: "Editör (içerik, ürün, sipariş)" },
              { value: "admin", label: "Yönetici (+ ayarlar, silme)" },
              { value: "owner", label: "Sahip (+ kullanıcılar)" },
            ]}
          />
          <TextInput name="password" label="Geçici şifre" type="password" autoComplete="new-password" required hint="En az 10 karakter. Kişiye güvenli kanaldan iletin." />
        </div>
      </Section>
      <SaveBar label="Ekle" />
    </AdminForm>
  );
}

export function PasswordForm() {
  return (
    <AdminForm action={changePasswordAction} resetOnSuccess className="max-w-xl space-y-4">
      <Section title="Şifremi değiştir">
        <TextInput name="current" label="Mevcut şifre" type="password" autoComplete="current-password" required />
        <TextInput name="next" label="Yeni şifre" type="password" autoComplete="new-password" required />
        <TextInput name="confirm" label="Yeni şifre (tekrar)" type="password" autoComplete="new-password" required />
      </Section>
      <SaveBar label="Şifreyi güncelle" />
    </AdminForm>
  );
}
