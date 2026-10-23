"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2, Lock, ShieldCheck } from "lucide-react";
import { checkoutSchema, type CheckoutInput } from "@/lib/validation/checkout";
import { PROVINCES } from "@/lib/validation/tr";
import type { PaymentMethodOption } from "@/lib/payments/types";
import { formatPrice } from "@/lib/commerce/money";
import { toGaItem, trackEcommerce } from "@/lib/analytics/events";
import { placeOrderAction } from "@/app/(shop)/odeme/actions";
import { SafeImage } from "@/components/ui/SafeImage";
import { cn } from "@/lib/utils";
import { useCommerce } from "./CommerceProvider";
import { CartTotals } from "./CartSummary";
import { CouponForm } from "./CouponForm";
import { CarrierBadge } from "./CarrierBadge";

type Defaults = Pick<CheckoutInput, "email" | "phone" | "firstName" | "lastName" | "district" | "addressLine"> & { city: string; postalCode: string };

/**
 * Tek sayfa ödeme: iletişim → teslimat → fatura → ödeme → onay. React Hook Form + Zod (sunucuyla aynı şema).
 * Sürtünmeyi azaltmak için: otomatik doldurma (autocomplete) öznitelikleri, doğru klavye türleri, fatura = teslimat
 * varsayılanı, misafir sipariş (üyelik zorunlu değil).
 */
export function CheckoutForm({ paymentMethods, defaults, loggedIn, bankNote }: { paymentMethods: PaymentMethodOption[]; defaults: Defaults; loggedIn: boolean; bankNote: string | null }) {
  const router = useRouter();
  const { cart, refreshCart } = useCommerce();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const began = useRef(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    mode: "onTouched",
    defaultValues: {
      ...defaults,
      city: (defaults.city || undefined) as CheckoutInput["city"],
      billingSame: true,
      invoiceType: "individual",
      // Kartla ödeme varsa varsayılan seçili gelir; yoksa tek yöntem varsa o
      paymentMethod: paymentMethods.find((m) => m.id === "iyzico")?.id ?? (paymentMethods.length === 1 ? paymentMethods[0]!.id : ""),
      acceptTerms: false as unknown as true,
      marketingConsent: false,
      saveAddress: loggedIn,
    },
  });
  const { register, handleSubmit, watch, formState, setError, setValue, getValues } = form;
  const errors = formState.errors as Partial<Record<string, { message?: string }>>;
  const billingSame = watch("billingSame");
  const invoiceType = watch("invoiceType");
  const sellable = cart?.items.filter((l) => l.available) ?? [];
  // Kargo firması seçimi: sunucu her firma için kargo/toplamı hesaplar; seçime göre özet güncellenir
  const options = cart?.shippingOptions ?? [];
  const selectedCarrier = watch("shippingCarrier");
  const chosen = options.find((o) => o.id === selectedCarrier) ?? null;
  const view = cart && chosen ? { ...cart, shipping: chosen.shipping, total: chosen.total } : cart;
  useEffect(() => {
    if (!options.length) return;
    const cur = getValues("shippingCarrier");
    if (!cur || !options.some((o) => o.id === cur)) {
      const cheapest = [...options].sort((a, b) => a.shipping - b.shipping)[0]!;
      setValue("shippingCarrier", cheapest.id);
    }
  }, [options, getValues, setValue]);
  const gaItems = sellable.map((l) => toGaItem({ id: l.productId, sku: l.sku, name: l.name, price: l.unitPrice, category: l.categoryName, variant: l.variantLabel, quantity: l.quantity }));

  useEffect(() => {
    if (began.current || !cart?.items.length) return;
    began.current = true;
    trackEcommerce("begin_checkout", { value: cart.subtotal - cart.discount, coupon: cart.coupon?.applied ? cart.coupon.code : undefined, items: gaItems });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  const onSubmit = handleSubmit(async (values) => {
    if (!cart) return;
    setServerError(null);
    setSubmitting(true);
    const total = view?.total ?? cart.total;
    trackEcommerce("add_shipping_info", { value: total, items: gaItems, shipping_tier: chosen?.name ?? "standard" });
    trackEcommerce("add_payment_info", { value: total, items: gaItems, payment_type: values.paymentMethod });
    const res = await placeOrderAction(values);
    if (!res.ok) {
      setSubmitting(false);
      setServerError(res.error);
      for (const [k, v] of Object.entries(res.fieldErrors ?? {})) setError(k as FieldPath<CheckoutInput>, { message: v });
      void refreshCart();
      requestAnimationFrame(() => errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    if (res.html) {
      // 3D Secure / sağlayıcı formu: sunucudan gelen formu sayfaya ekleyip otomatik gönder.
      const host = document.createElement("div");
      host.innerHTML = res.html;
      document.body.appendChild(host);
      host.querySelector("form")?.submit();
      return;
    }
    if (/^https?:\/\//.test(res.redirectTo)) window.location.assign(res.redirectTo);
    else router.replace(res.redirectTo);
  });

  if (cart && sellable.length === 0) {
    return (
      <div className="shell py-20 text-center">
        <h1 className="display-2">Sepetiniz boş</h1>
        <p className="mt-3 text-ink-soft">Ödeme adımına geçmek için sepetinize ürün ekleyin.</p>
        <Link href="/urunler" className="btn-primary mt-8">
          Ürünleri Keşfet
        </Link>
      </div>
    );
  }

  const err = (name: string) =>
    errors[name]?.message ? (
      <p id={`${name}-err`} className="mt-1.5 text-sm font-bold text-danger">
        {errors[name]!.message}
      </p>
    ) : null;
  const a11y = (name: string) => ({ "aria-invalid": Boolean(errors[name]) || undefined, "aria-describedby": errors[name] ? `${name}-err` : undefined });

  return (
    <div className="shell pt-6 pb-24 sm:pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display-2">Ödeme</h1>
        <p className="flex items-center gap-2 text-sm font-bold text-leaf-ink">
          <ShieldCheck aria-hidden="true" className="h-5 w-5" /> Bilgileriniz SSL ile şifrelenir
        </p>
      </div>
      {!loggedIn ? (
        <p className="mt-3 text-sm text-ink-soft">
          Üye olmadan sipariş verebilirsiniz.{" "}
          <Link href="/hesabim?sonra=/odeme" className="font-bold text-brand-ink underline underline-offset-2">
            Hesabınız var mı? Giriş yapın
          </Link>
        </p>
      ) : null}

      <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-10 lg:col-span-7">
          <div ref={errorRef} aria-live="assertive">
            {serverError ? (
              <p role="alert" className="flex items-start gap-3 rounded-md bg-red-50 px-4 py-3 text-sm font-bold text-danger">
                <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" /> {serverError}
              </p>
            ) : null}
          </div>

          <Step n={1} title="İletişim bilgileri">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="E-posta" htmlFor="email" error={err("email")}>
                <input id="email" type="email" autoComplete="email" inputMode="email" className="field" {...register("email")} {...a11y("email")} />
              </Field>
              <Field label="Cep telefonu" htmlFor="phone" error={err("phone")}>
                <input id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="05xx xxx xx xx" className="field" {...register("phone")} {...a11y("phone")} />
              </Field>
            </div>
          </Step>

          <Step n={2} title="Teslimat adresi">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ad" htmlFor="firstName" error={err("firstName")}>
                <input id="firstName" autoComplete="given-name" className="field" {...register("firstName")} {...a11y("firstName")} />
              </Field>
              <Field label="Soyad" htmlFor="lastName" error={err("lastName")}>
                <input id="lastName" autoComplete="family-name" className="field" {...register("lastName")} {...a11y("lastName")} />
              </Field>
              <Field label="İl" htmlFor="city" error={err("city")}>
                <select id="city" autoComplete="address-level1" className="field" defaultValue={defaults.city} {...register("city")} {...a11y("city")}>
                  <option value="">Seçin</option>
                  {[...PROVINCES].sort((x, y) => x.localeCompare(y, "tr")).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="İlçe" htmlFor="district" error={err("district")}>
                <input id="district" autoComplete="address-level2" className="field" {...register("district")} {...a11y("district")} />
              </Field>
              <Field label="Açık adres" htmlFor="addressLine" error={err("addressLine")} className="sm:col-span-2">
                <textarea id="addressLine" rows={3} autoComplete="street-address" placeholder="Mahalle, cadde/sokak, bina no, daire no" className="field py-3" {...register("addressLine")} {...a11y("addressLine")} />
              </Field>
              <Field label="Posta kodu (isteğe bağlı)" htmlFor="postalCode" error={err("postalCode")}>
                <input id="postalCode" autoComplete="postal-code" inputMode="numeric" maxLength={5} className="field" {...register("postalCode")} {...a11y("postalCode")} />
              </Field>
            </div>
            {loggedIn ? (
              <label className="mt-4 flex items-center gap-3 text-sm">
                <input type="checkbox" className="h-5 w-5 accent-brand-ink" {...register("saveAddress")} /> Bu adresi hesabıma kaydet
              </label>
            ) : null}
          </Step>

          <Step n={3} title="Fatura bilgileri">
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Fatura türü">
              {[
                { v: "individual", l: "Bireysel" },
                { v: "corporate", l: "Kurumsal" },
              ].map((o) => (
                <label key={o.v} className={cn("inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] px-5 text-sm font-bold has-[:focus-visible]:outline-2", invoiceType === o.v ? "border-ink bg-ink text-white" : "border-line-strong bg-white")}>
                  <input type="radio" value={o.v} className="sr-only" {...register("invoiceType")} /> {o.l}
                </label>
              ))}
            </div>
            {invoiceType === "corporate" ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Firma ünvanı" htmlFor="companyName" error={err("companyName")} className="sm:col-span-2">
                  <input id="companyName" autoComplete="organization" className="field" {...register("companyName")} {...a11y("companyName")} />
                </Field>
                <Field label="Vergi dairesi" htmlFor="taxOffice" error={err("taxOffice")}>
                  <input id="taxOffice" className="field" {...register("taxOffice")} {...a11y("taxOffice")} />
                </Field>
                <Field label="Vergi numarası" htmlFor="taxNumber" error={err("taxNumber")}>
                  <input id="taxNumber" inputMode="numeric" maxLength={11} className="field" {...register("taxNumber")} {...a11y("taxNumber")} />
                </Field>
              </div>
            ) : null}
            <label className="mt-5 flex items-center gap-3 text-sm font-bold">
              <input type="checkbox" className="h-5 w-5 accent-brand-ink" {...register("billingSame")} /> Fatura adresim teslimat adresimle aynı
            </label>
            {!billingSame ? (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <Field label="Ad" htmlFor="billingFirstName" error={err("billingFirstName")}>
                  <input id="billingFirstName" autoComplete="billing given-name" className="field" {...register("billingFirstName")} {...a11y("billingFirstName")} />
                </Field>
                <Field label="Soyad" htmlFor="billingLastName" error={err("billingLastName")}>
                  <input id="billingLastName" autoComplete="billing family-name" className="field" {...register("billingLastName")} {...a11y("billingLastName")} />
                </Field>
                <Field label="İl" htmlFor="billingCity" error={err("billingCity")}>
                  <select id="billingCity" autoComplete="billing address-level1" className="field" {...register("billingCity")} {...a11y("billingCity")}>
                    <option value="">Seçin</option>
                    {[...PROVINCES].sort((x, y) => x.localeCompare(y, "tr")).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="İlçe" htmlFor="billingDistrict" error={err("billingDistrict")}>
                  <input id="billingDistrict" autoComplete="billing address-level2" className="field" {...register("billingDistrict")} {...a11y("billingDistrict")} />
                </Field>
                <Field label="Açık adres" htmlFor="billingAddressLine" error={err("billingAddressLine")} className="sm:col-span-2">
                  <textarea id="billingAddressLine" rows={3} autoComplete="billing street-address" className="field py-3" {...register("billingAddressLine")} {...a11y("billingAddressLine")} />
                </Field>
              </div>
            ) : null}
          </Step>

          {options.length ? (
            <Step n={4} title="Kargo firması">
              <div className="space-y-3" role="radiogroup" aria-label="Kargo firması">
                {options.map((o) => (
                  <label key={o.id} className="flex cursor-pointer items-center gap-4 rounded-md border-[1.5px] border-line-strong bg-white p-3 pr-4 has-[:checked]:border-ink has-[:checked]:bg-cream has-[:focus-visible]:outline-2 sm:p-4">
                    <input type="radio" value={o.id} className="h-5 w-5 shrink-0 accent-brand-ink" {...register("shippingCarrier")} />
                    <CarrierBadge brand={o.brand} name={o.name} logoUrl={o.logoUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-extrabold">{o.name}</span>
                      {o.note ? <span className="mt-0.5 block text-sm text-ink-soft">{o.note}</span> : null}
                    </span>
                    <span className={cn("shrink-0 font-extrabold tabular-nums", o.shipping === 0 && "text-leaf-ink")}>{o.shipping === 0 ? "Ücretsiz" : formatPrice(o.shipping)}</span>
                  </label>
                ))}
                {err("shippingCarrier")}
              </div>
            </Step>
          ) : null}

          <Step n={options.length ? 5 : 4} title="Ödeme yöntemi">
            {paymentMethods.length ? (
              <div className="space-y-3" role="radiogroup" aria-label="Ödeme yöntemi">
                {paymentMethods.map((m) => (
                  <label key={m.id} className="flex cursor-pointer items-start gap-4 rounded-md border-[1.5px] border-line-strong bg-white p-4 has-[:checked]:border-ink has-[:checked]:bg-cream has-[:focus-visible]:outline-2">
                    <input type="radio" value={m.id} className="mt-1 h-5 w-5 shrink-0 accent-brand-ink" {...register("paymentMethod")} />
                    <span>
                      <span className="block font-extrabold">{m.label}</span>
                      <span className="mt-0.5 block text-sm text-ink-soft">{m.description}</span>
                      {m.id === "bank_transfer" && bankNote ? <span className="mt-1 block text-xs text-muted">{bankNote}</span> : null}
                    </span>
                  </label>
                ))}
                {err("paymentMethod")}
              </div>
            ) : (
              <p className="rounded-md bg-sun-50 p-4 text-sm font-bold text-sun-ink">Online ödeme altyapısı henüz etkin değil. Siparişleriniz için lütfen bizimle iletişime geçin.</p>
            )}
          </Step>

          <Step n={options.length ? 6 : 5} title="Sipariş notu (isteğe bağlı)">
            <label htmlFor="note" className="sr-only">
              Sipariş notu
            </label>
            <textarea id="note" rows={3} maxLength={500} placeholder="Teslimatla ilgili eklemek istediğiniz bir not var mı?" className="field py-3" {...register("note")} />
          </Step>
        </div>

        <aside aria-label="Sipariş özeti" className="lg:col-span-5">
          <div className="space-y-6 rounded-lg bg-cream p-5 sm:p-6 lg:sticky lg:top-28">
            <h2 className="font-display text-2xl font-extrabold">Sipariş özeti</h2>
            {!cart ? (
              <div className="space-y-3" aria-busy="true">
                <div className="skeleton h-16 rounded-sm" />
                <div className="skeleton h-16 rounded-sm" />
              </div>
            ) : (
              <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
                {sellable.map((l) => (
                  <li key={l.id} className="flex items-center gap-3">
                    <span className="shot relative h-16 w-14 shrink-0 overflow-hidden rounded-xs">
                      {l.image ? <SafeImage src={l.image.url} alt={l.image.alt || l.name} fill sizes="56px" className="object-cover" /> : null}
                      <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ink px-1 text-[11px] font-extrabold text-white">{l.quantity}</span>
                    </span>
                    <span className="line-clamp-2 min-w-0 flex-1 text-sm font-bold">{l.name}</span>
                    <span className="text-sm font-extrabold tabular-nums">{formatPrice(l.lineTotal)}</span>
                  </li>
                ))}
              </ul>
            )}
            <CouponForm />
            {view ? <CartTotals cart={view} /> : null}

            <div className="space-y-3 border-t border-line-strong pt-5">
              <label className="flex items-start gap-3 text-sm leading-relaxed">
                <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-brand-ink" {...register("acceptTerms")} {...a11y("acceptTerms")} />
                <span>
                  <Link href="/on-bilgilendirme-formu" target="_blank" className="font-bold underline underline-offset-2">
                    Ön Bilgilendirme Formu
                  </Link>{" "}
                  ve{" "}
                  <Link href="/mesafeli-satis-sozlesmesi" target="_blank" className="font-bold underline underline-offset-2">
                    Mesafeli Satış Sözleşmesi
                  </Link>
                  ’ni okudum, kabul ediyorum.
                </span>
              </label>
              {err("acceptTerms")}
              <label className="flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
                <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0 accent-brand-ink" {...register("marketingConsent")} />
                <span>Kampanya ve yeniliklerden e-posta/SMS ile haberdar olmak istiyorum (isteğe bağlı).</span>
              </label>
            </div>

            <button type="submit" disabled={submitting || !cart || !paymentMethods.length} className="btn-primary min-h-14 w-full text-base">
              {submitting ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Lock aria-hidden="true" className="h-5 w-5" />}
              {submitting ? "Sipariş oluşturuluyor…" : `Siparişi Onayla${view ? ` · ${formatPrice(view.total)}` : ""}`}
            </button>
            <p className="text-center text-xs text-muted">
              Kişisel verileriniz{" "}
              <Link href="/kvkk-aydinlatma-metni" target="_blank" className="underline">
                KVKK Aydınlatma Metni
              </Link>{" "}
              kapsamında işlenir.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="mb-5 flex items-center gap-3 font-display text-xl font-extrabold sm:text-2xl">
        <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 font-sans text-sm font-extrabold text-brand-ink">
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({ label, htmlFor, error, className, children }: { label: string; htmlFor: string; error: React.ReactNode; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="field-label">
        {label}
      </label>
      {children}
      {error}
    </div>
  );
}
