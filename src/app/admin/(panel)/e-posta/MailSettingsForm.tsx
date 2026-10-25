"use client";

import { useState, useTransition } from "react";
import { ExternalLink, Loader2, RotateCcw, Send } from "lucide-react";
import { AdminForm, SaveBar, useMarkDirty } from "@/components/admin/AdminForm";
import { Checkbox, Field, inputCls, Section, SelectInput, TextInput } from "@/components/admin/fields";
import type { SiteSettings } from "@/lib/settings";
import { DEFAULT_MAIL_TEMPLATES, MAIL_EVENT_INFO, MAIL_EVENTS, MAIL_PLACEHOLDERS, type MailEvent, type MailTemplate } from "@/lib/mail/templates";
import { saveMailSettingsAction, sendTestMailAction } from "./actions";

type Status = { ready: boolean; passwordStored: boolean; passwordReadable: boolean };

const PRESETS = [
  { name: "Alan adı e-postası (cPanel / Plesk)", host: "mail.alanadiniz.com", port: 465, security: "SSL/TLS" },
  { name: "Gmail / Google Workspace", host: "smtp.gmail.com", port: 465, security: "SSL/TLS — uygulama şifresi gerekir" },
  { name: "Outlook / Microsoft 365", host: "smtp.office365.com", port: 587, security: "STARTTLS" },
  { name: "Yandex", host: "smtp.yandex.com.tr", port: 465, security: "SSL/TLS" },
];

export function MailSettingsForm({ mail, templates, status, defaultTo }: { mail: SiteSettings["mail"]; templates: SiteSettings["mailTemplates"]; status: Status; defaultTo: string }) {
  return (
    <div className="max-w-4xl space-y-6">
      <TestMail status={status} defaultTo={defaultTo} />
      <AdminForm action={saveMailSettingsAction} className="space-y-6">
        <Section title="SMTP sunucusu" description="Siparişlerle ilgili e-postalar bu hesaptan gönderilir. Bilgileri e-posta sağlayıcınızın (hosting paneli, Gmail, Outlook…) “SMTP / giden posta” ayarlarından alın.">
          <Checkbox name="mailEnabled" label="E-posta gönderimini aç" defaultChecked={mail.enabled} />
          <div className="grid gap-5 sm:grid-cols-[1fr_120px_1fr]">
            <TextInput name="host" label="SMTP sunucusu" placeholder="mail.alanadiniz.com" defaultValue={mail.host ?? ""} autoComplete="off" spellCheck={false} />
            <TextInput name="port" label="Port" inputMode="numeric" defaultValue={String(mail.port)} />
            <SelectInput
              name="security"
              label="Güvenlik"
              defaultValue={mail.security}
              options={[
                { value: "ssl", label: "SSL/TLS (genelde port 465)" },
                { value: "starttls", label: "STARTTLS (genelde port 587)" },
                { value: "none", label: "Şifresiz (önerilmez)" },
              ]}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextInput name="username" label="Kullanıcı adı" placeholder="siparis@alanadiniz.com" defaultValue={mail.username ?? ""} autoComplete="off" spellCheck={false} hint="Genellikle e-posta adresinin tamamı." />
            <TextInput
              name="password"
              label="Şifre"
              type="password"
              autoComplete="new-password"
              placeholder={status.passwordStored ? (status.passwordReadable ? "Kayıtlı — değiştirmek için yenisini yazın" : "Kayıtlı şifre bu sunucuda çözülemedi, yeniden girin") : "E-posta hesabının şifresi"}
              hint="Şifreli saklanır, ekranda bir daha gösterilmez. Boş bırakırsanız kayıtlı şifre korunur."
            />
            <TextInput name="fromName" label="Gönderen adı" placeholder="Bıcırıklar Kids" defaultValue={mail.fromName ?? ""} />
            <TextInput name="fromEmail" label="Gönderen e-posta" type="email" placeholder="siparis@alanadiniz.com" defaultValue={mail.fromEmail ?? ""} hint="Boşsa kullanıcı adı kullanılır. SMTP hesabına ait bir adres olmalı." />
            <TextInput name="replyTo" label="Yanıt adresi (isteğe bağlı)" type="email" placeholder="info@alanadiniz.com" defaultValue={mail.replyTo ?? ""} hint="Müşteri “Yanıtla” dediğinde gidecek adres." />
            <TextInput name="notifyEmail" label="Yeni sipariş bildirim adresi" type="email" placeholder="siparis@alanadiniz.com" defaultValue={mail.notifyEmail ?? ""} hint="Boşsa Ayarlar › İletişim e-postası kullanılır." />
          </div>
          <details className="rounded-md bg-neutral-50 p-4 text-sm text-neutral-700">
            <summary className="cursor-pointer font-medium text-ink">Sık kullanılan sağlayıcı ayarları</summary>
            <ul className="mt-3 space-y-1.5">
              {PRESETS.map((p) => (
                <li key={p.name}>
                  <strong>{p.name}:</strong> {p.host} · port {p.port} · {p.security}
                </li>
              ))}
            </ul>
          </details>
        </Section>

        <Section title="E-posta şablonları" description="Konu, başlık ve metni düzenleyin. Metin düz yazıdır: boş satır yeni paragraf açar. Sipariş özeti (ürünler ve tutarlar) ve “Siparişimi görüntüle” düğmesi otomatik eklenir. Önizleme, kaydedilmiş hâli gösterir.">
          <div className="rounded-md bg-sky-50 p-4 text-sm text-neutral-700">
            <p className="font-medium text-ink">Kullanılabilecek alanlar</p>
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
              {MAIL_PLACEHOLDERS.map((p) => (
                <span key={p.key}>
                  <code className="rounded bg-white px-1.5 py-0.5 text-[13px] text-brand-ink">{`{{${p.key}}}`}</code> {p.label}
                </span>
              ))}
            </p>
          </div>
          {MAIL_EVENTS.map((ev) => (
            <TemplateEditor key={ev} event={ev} initial={templates[ev]} />
          ))}
        </Section>

        <SaveBar label="E-posta ayarlarını kaydet" />
      </AdminForm>
    </div>
  );
}

function TemplateEditor({ event, initial }: { event: MailEvent; initial: MailTemplate }) {
  const [t, setT] = useState(initial);
  const markDirty = useMarkDirty();
  const info = MAIL_EVENT_INFO[event];
  const set = (patch: Partial<MailTemplate>) => {
    setT((x) => ({ ...x, ...patch }));
    markDirty();
  };
  return (
    <details className="group rounded-lg border border-neutral-200 bg-white" open={false}>
      <summary className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3.5">
        <span className="font-semibold text-ink">{info.label}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${info.audience === "store" ? "bg-amber-100 text-amber-900" : "bg-sky-100 text-sky-900"}`}>{info.audience === "store" ? "Mağazaya" : "Müşteriye"}</span>
        {!t.enabled ? <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700">Kapalı</span> : null}
        <span className="basis-full text-xs text-neutral-500">{info.when}</span>
      </summary>
      <div className="space-y-4 border-t border-neutral-200 px-4 py-4">
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name={`tpl_${event}_enabled`} checked={t.enabled} onChange={(e) => set({ enabled: e.target.checked })} className="h-5 w-5 accent-ink" />
          <span className="font-medium text-neutral-800">Bu e-postayı gönder</span>
        </label>
        <Field name={`tpl_${event}_subject`} label="Konu">
          {(a) => <input {...a} name={`tpl_${event}_subject`} value={t.subject} maxLength={200} onChange={(e) => set({ subject: e.target.value })} className={inputCls} />}
        </Field>
        <Field name={`tpl_${event}_heading`} label="Başlık (e-postanın içindeki büyük yazı)">
          {(a) => <input {...a} name={`tpl_${event}_heading`} value={t.heading} maxLength={200} onChange={(e) => set({ heading: e.target.value })} className={inputCls} />}
        </Field>
        <Field name={`tpl_${event}_body`} label="Metin">
          {(a) => <textarea {...a} name={`tpl_${event}_body`} value={t.body} rows={8} maxLength={5000} onChange={(e) => set({ body: e.target.value })} className={`${inputCls} py-2.5 font-mono text-[13px] leading-relaxed`} />}
        </Field>
        <div className="flex flex-wrap gap-3">
          <a href={`/admin/e-posta/onizleme/${event}`} target="_blank" rel="noopener" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 px-4 text-sm font-medium text-ink hover:border-ink">
            <ExternalLink aria-hidden="true" className="h-4 w-4" /> Önizle
          </a>
          <button type="button" onClick={() => set(DEFAULT_MAIL_TEMPLATES[event])} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-neutral-300 px-4 text-sm font-medium text-ink hover:border-ink">
            <RotateCcw aria-hidden="true" className="h-4 w-4" /> Varsayılana dön
          </button>
        </div>
      </div>
    </details>
  );
}

function TestMail({ status, defaultTo }: { status: Status; defaultTo: string }) {
  const [to, setTo] = useState(defaultTo);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <section className="rounded-lg border border-neutral-200 bg-white p-5 sm:p-7">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-base font-semibold text-ink">Durum</h2>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.ready ? "bg-emerald-100 text-emerald-900" : "bg-neutral-200 text-neutral-700"}`}>
          {status.ready ? "Gönderim AÇIK" : "Gönderim KAPALI"}
        </span>
      </div>
      <p className="mt-1 text-sm text-neutral-500">{status.ready ? "Sipariş e-postaları otomatik gönderiliyor. Ayarları değiştirdiyseniz önce kaydedin, sonra deneyin." : "SMTP bilgilerini girip “E-posta gönderimini aç”ı işaretleyerek kaydedin; ardından buradan deneme e-postası gönderin."}</p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 basis-64 text-sm">
          <span className="mb-1.5 block font-medium text-neutral-800">Deneme e-postası alıcısı</span>
          <input type="email" value={to} onChange={(e) => setTo(e.target.value)} className={inputCls} placeholder="ornek@alanadiniz.com" />
        </label>
        <button
          type="button"
          disabled={pending || !to}
          onClick={() => start(async () => setResult(await sendTestMailAction(to)))}
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Send aria-hidden="true" className="h-4 w-4" />}
          {pending ? "Gönderiliyor…" : "Deneme gönder"}
        </button>
      </div>
      {result ? (
        <p role="status" className={`mt-3 rounded-md p-3 text-sm ${result.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>
          {result.message}
        </p>
      ) : null}
    </section>
  );
}
