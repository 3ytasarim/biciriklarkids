"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { bool, formObject, optional, zodErrors, type ActionState } from "@/lib/admin/form";
import { getSiteSettings, saveSetting } from "@/lib/settings";
import { encryptSecret } from "@/lib/crypto/secret-box";
import { mailReady, sendEmail } from "@/lib/email";
import { absoluteUrl } from "@/lib/seo/site";
import { renderMailHtml, renderMailText } from "@/lib/mail/render";
import { MAIL_EVENTS } from "@/lib/mail/templates";

const emailField = z
  .string()
  .trim()
  .max(160)
  .refine((v) => v === "" || z.email().safeParse(v).success, "Geçerli bir e-posta adresi girin.")
  .transform((v) => (v === "" ? null : v));

const schema = z.object({
  mailEnabled: bool,
  host: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(v), "Sunucu adı ör. mail.alanadiniz.com biçiminde olmalı (https:// olmadan).")
    .transform((v) => (v === "" ? null : v.toLowerCase())),
  port: z.coerce.number({ error: "Port sayı olmalı." }).int().min(1).max(65535),
  security: z.enum(["ssl", "starttls", "none"]),
  username: optional(160),
  password: z.string().max(300),
  fromName: optional(120),
  fromEmail: emailField,
  replyTo: emailField,
  notifyEmail: emailField,
});

export async function saveMailSettingsAction(_p: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin("admin");
  const parsed = schema.safeParse(formObject(fd));
  if (!parsed.success) return zodErrors(parsed.error);
  const d = parsed.data;
  const prev = (await getSiteSettings()).mail;
  const newPassword = d.password.trim();
  const passwordEnc = newPassword ? encryptSecret(newPassword) : prev.passwordEnc;
  if (d.mailEnabled && (!d.host || !d.username || !passwordEnc)) {
    return { status: "error", message: "Gönderimi açmak için SMTP sunucusu, kullanıcı adı ve şifre gerekli.", errors: !d.host ? { host: "Zorunlu." } : !d.username ? { username: "Zorunlu." } : { password: "Zorunlu." } };
  }
  if (d.mailEnabled && d.security === "none") {
    return { status: "error", message: "Şifresiz bağlantıyla gönderim güvenli değil; SSL/TLS veya STARTTLS seçin.", errors: { security: "SSL/TLS veya STARTTLS seçin." } };
  }

  // Şablonlar: tpl_<olay>_{enabled,subject,heading,body}
  const prevT = (await getSiteSettings()).mailTemplates;
  const templates = { ...prevT };
  for (const ev of MAIL_EVENTS) {
    const subject = String(fd.get(`tpl_${ev}_subject`) ?? "").trim().slice(0, 200);
    const heading = String(fd.get(`tpl_${ev}_heading`) ?? "").trim().slice(0, 200);
    const body = String(fd.get(`tpl_${ev}_body`) ?? "").replace(/\r\n/g, "\n").trim().slice(0, 5000);
    if (!subject || !body) return { status: "error", message: "Her şablonda konu ve metin dolu olmalı.", errors: { [`tpl_${ev}_${subject ? "body" : "subject"}`]: "Zorunlu." } };
    templates[ev] = { enabled: fd.get(`tpl_${ev}_enabled`) === "on", subject, heading: heading || subject, body };
  }

  await Promise.all([
    saveSetting("mail", {
      enabled: d.mailEnabled,
      host: d.host,
      port: d.port,
      security: d.security,
      username: d.username,
      passwordEnc,
      passwordSet: Boolean(passwordEnc),
      fromName: d.fromName,
      fromEmail: d.fromEmail,
      replyTo: d.replyTo,
      notifyEmail: d.notifyEmail,
    }),
    saveSetting("mailTemplates", templates),
  ]);
  return { status: "success", message: "E-posta ayarları kaydedildi." };
}

/** Kayıtlı ayarlarla deneme e-postası gönderir. */
export async function sendTestMailAction(to: string): Promise<{ ok: boolean; message: string }> {
  await requireAdmin("admin");
  const addr = to.trim();
  if (!z.email().safeParse(addr).success) return { ok: false, message: "Geçerli bir alıcı e-posta adresi girin." };
  const s = await getSiteSettings();
  if (!mailReady(s.mail)) return { ok: false, message: "Önce SMTP bilgilerini girip “E-posta gönderimini aç”ı işaretleyerek kaydedin." };
  const heading = "Deneme e-postası";
  const body = `Bu ileti ${s.brand.name} yönetim panelinden gönderilen bir denemedir. Bu e-postayı görüyorsanız SMTP ayarlarınız doğru çalışıyor.\n\nSunucu: ${s.mail.host}:${s.mail.port} (${s.mail.security === "ssl" ? "SSL/TLS" : s.mail.security === "starttls" ? "STARTTLS" : "şifresiz"})`;
  const html = renderMailHtml({
    heading,
    body,
    brand: { name: s.brand.name, logoUrl: absoluteUrl("/brand/biciriklar-logo.png"), siteUrl: absoluteUrl("/"), tagline: s.brand.tagline },
    footer: { email: s.contact.email, phone: s.contact.phone },
  });
  const res = await sendEmail({ to: addr, subject: `${s.brand.name} — deneme e-postası`, text: renderMailText(heading, body), html }, s);
  return res.sent ? { ok: true, message: `Deneme e-postası ${addr} adresine gönderildi. Gelen kutusunu (ve spam klasörünü) kontrol edin.` } : { ok: false, message: res.error ?? "Gönderilemedi." };
}
