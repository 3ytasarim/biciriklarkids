"use client";

import { AdminForm, SaveBar } from "@/components/admin/AdminForm";
import { Checkbox, Section, SelectInput, TextInput } from "@/components/admin/fields";
import type { ActionState } from "@/lib/admin/form";
import type { coupons } from "@/lib/db/schema";

type Coupon = typeof coupons.$inferSelect;
const local = (d: Date | null | undefined) => (d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "");

export function CouponForm({ action, coupon: c, categories }: { action: (p: ActionState, fd: FormData) => Promise<ActionState>; coupon?: Coupon | null; categories: { value: string; label: string }[] }) {
  return (
    <AdminForm action={action} className="max-w-3xl space-y-6">
      <Section title="Kupon">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput name="code" label="Kod" required defaultValue={c?.code ?? ""} className="uppercase" hint="Müşterinin gireceği kod (ör. HOSGELDIN10)." />
          <SelectInput
            name="type"
            label="Tür"
            defaultValue={c?.type ?? "percent"}
            options={[
              { value: "percent", label: "Yüzde indirim (%)" },
              { value: "fixed", label: "Sabit tutar (₺)" },
              { value: "free_shipping", label: "Ücretsiz kargo" },
            ]}
          />
          <TextInput name="value" label="Değer" inputMode="decimal" defaultValue={c?.value ? String(c.value) : ""} hint="Yüzde için 10 = %10; sabit için ₺." />
          <TextInput name="description" label="Açıklama (iç)" defaultValue={c?.description ?? ""} />
        </div>
      </Section>
      <Section title="Koşullar">
        <div className="grid gap-5 sm:grid-cols-2">
          <TextInput name="minOrderAmount" label="En az sepet tutarı (₺)" inputMode="decimal" defaultValue={c?.minOrderAmount != null ? String(c.minOrderAmount) : ""} />
          <TextInput name="maxDiscountAmount" label="En fazla indirim (₺)" inputMode="decimal" defaultValue={c?.maxDiscountAmount != null ? String(c.maxDiscountAmount) : ""} />
          <SelectInput name="categoryId" label="Yalnızca bu kategori" defaultValue={c?.categoryId ?? ""} placeholder="Tüm ürünler" options={categories} />
          <TextInput name="usageLimit" label="Toplam kullanım limiti" inputMode="numeric" defaultValue={c?.usageLimit != null ? String(c.usageLimit) : ""} hint={c ? `Şu ana kadar ${c.usedCount} kez kullanıldı.` : undefined} />
          <TextInput name="startsAt" label="Başlangıç" type="datetime-local" defaultValue={local(c?.startsAt)} />
          <TextInput name="endsAt" label="Bitiş" type="datetime-local" defaultValue={local(c?.endsAt)} />
        </div>
        <input type="hidden" name="usagePerCustomer" value={c?.usagePerCustomer != null ? String(c.usagePerCustomer) : ""} />
        <Checkbox name="isActive" label="Aktif" defaultChecked={c?.isActive ?? true} />
      </Section>
      <SaveBar />
    </AdminForm>
  );
}
