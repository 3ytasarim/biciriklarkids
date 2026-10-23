"use client";

import { AdminForm, SaveBar } from "@/components/admin/AdminForm";
import { Checkbox, SelectInput, TextArea, TextInput } from "@/components/admin/fields";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/commerce/order-labels";
import { markPaidAction, updateOrderAction } from "../actions";

export function OrderUpdateForm({ id, status, carrier, trackingNumber }: { id: string; status: OrderStatus; carrier: string | null; trackingNumber: string | null }) {
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5">
      <h2 className="mb-4 font-semibold">Siparişi güncelle</h2>
      <AdminForm action={updateOrderAction.bind(null, id)} className="space-y-4">
        <SelectInput name="status" label="Durum" defaultValue={status} options={Object.entries(ORDER_STATUS_LABELS).map(([value, label]) => ({ value, label }))} hint="İptal/İade seçilirse stok otomatik geri eklenir." />
        <TextInput name="carrier" label="Kargo firması" defaultValue={carrier ?? ""} placeholder="ör. Yurtiçi Kargo" />
        <TextInput name="trackingNumber" label="Takip numarası" defaultValue={trackingNumber ?? ""} />
        <TextArea name="message" label="Not (isteğe bağlı)" rows={3} />
        <Checkbox name="isPublic" label="Notu müşteri sipariş takibinde göster" />
        <SaveBar label="Güncelle" />
      </AdminForm>
    </section>
  );
}

export function MarkPaidButton({ id }: { id: string }) {
  return (
    <div className="mt-4">
      <ConfirmAction
        title="Ödeme alındı olarak işaretlensin mi?"
        description="Havale/EFT tutarının hesabınıza geçtiğini kontrol ettiyseniz onaylayın. Sipariş “Onaylandı” durumuna geçer."
        confirmLabel="Ödendi olarak işaretle"
        triggerLabel="Ödeme alındı"
        tone="default"
        action={markPaidAction.bind(null, id)}
      />
    </div>
  );
}
