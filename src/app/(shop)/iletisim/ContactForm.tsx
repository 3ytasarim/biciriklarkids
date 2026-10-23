"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { trackEvent } from "@/lib/analytics/events";
import { contactAction, type ContactState } from "./actions";

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactState, FormData>(async (prev, fd) => {
    const res = await contactAction(prev, fd);
    trackEvent(res.ok ? "form_submit" : "form_error", { form_name: "contact" });
    return res;
  }, {});
  if (state.ok)
    return (
      <p role="status" className="flex items-center gap-3 rounded-lg bg-leaf-50 p-6 font-bold text-leaf-ink">
        <CheckCircle2 aria-hidden="true" className="h-6 w-6" /> Mesajınız bize ulaştı. En kısa sürede dönüş yapacağız.
      </p>
    );
  const fe = state.fieldErrors ?? {};
  const err = (k: string) =>
    fe[k] ? (
      <p id={`${k}-err`} className="mt-1.5 text-sm font-bold text-danger">
        {fe[k]}
      </p>
    ) : null;
  const inv = (k: string) => ({ "aria-invalid": Boolean(fe[k]) || undefined, "aria-describedby": fe[k] ? `${k}-err` : undefined });
  return (
    <form action={action} noValidate className="space-y-4">
      {state.error ? (
        <p role="alert" className="rounded-sm bg-red-50 p-3 text-sm font-bold text-danger">
          {state.error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="field-label">
            Ad soyad
          </label>
          <input id="c-name" name="name" autoComplete="name" className="field" {...inv("name")} />
          {err("name")}
        </div>
        <div>
          <label htmlFor="c-email" className="field-label">
            E-posta
          </label>
          <input id="c-email" name="email" type="email" autoComplete="email" className="field" {...inv("email")} />
          {err("email")}
        </div>
        <div>
          <label htmlFor="c-phone" className="field-label">
            Telefon (isteğe bağlı)
          </label>
          <input id="c-phone" name="phone" type="tel" autoComplete="tel" className="field" />
        </div>
        <div>
          <label htmlFor="c-subject" className="field-label">
            Konu
          </label>
          <select id="c-subject" name="subject" className="field">
            <option>Sipariş</option>
            <option>Ürün bilgisi</option>
            <option>Toplu / kurumsal alım</option>
            <option>İade ve değişim</option>
            <option>Diğer</option>
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="c-message" className="field-label">
          Mesajınız
        </label>
        <textarea id="c-message" name="message" rows={5} className="field py-3" {...inv("message")} />
        {err("message")}
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-px w-px opacity-0" />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="consent" className="mt-0.5 h-5 w-5 shrink-0 accent-brand-ink" {...inv("consent")} />
        <span>
          <Link href="/kvkk-aydinlatma-metni" target="_blank" className="font-bold underline underline-offset-2">
            KVKK Aydınlatma Metni
          </Link>
          ’ni okudum; mesajıma dönüş yapılması için bilgilerimin işlenmesini kabul ediyorum.
        </span>
      </label>
      {err("consent")}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Send aria-hidden="true" className="h-4 w-4" />} Gönder
      </button>
    </form>
  );
}
