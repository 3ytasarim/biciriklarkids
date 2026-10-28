import "server-only";
import nodemailer from "nodemailer";
import { getSiteSettings, type SiteSettings } from "@/lib/settings";
import { decryptSecret } from "@/lib/crypto/secret-box";

/**
 * Giden e-posta (SMTP). Ayarlar Admin › E-posta'dan gelir: sunucu, port, güvenlik (SSL/TLS, STARTTLS),
 * kullanıcı adı, şifreli saklanan şifre, gönderen ad/adres. Ayar kapalı veya eksikse gönderim yapılmaz
 * (geliştirmede konsola yazılır). Gönderim hatası çağıranı hiçbir zaman düşürmez; sonuç döner.
 */
export type Email = { to: string; subject: string; text: string; html?: string; replyTo?: string | null };
export type SendResult = { sent: boolean; error?: string };

type Mail = SiteSettings["mail"];

function transportFor(m: Mail) {
  if (!m.enabled || !m.host || !m.username) return null;
  const password = decryptSecret(m.passwordEnc);
  if (!password) return null;
  return nodemailer.createTransport({
    host: m.host,
    port: m.port,
    // ssl: bağlantı baştan TLS · starttls: düz başlar, TLS'e yükseltme ZORUNLU · none: şifresiz
    secure: m.security === "ssl",
    requireTLS: m.security === "starttls",
    ignoreTLS: m.security === "none",
    auth: { user: m.username, pass: password },
    tls: { minVersion: "TLSv1.2", servername: m.host },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
}

export function mailReady(m: Mail): boolean {
  return Boolean(m.enabled && m.host && m.username && (m.fromEmail || m.username) && decryptSecret(m.passwordEnc));
}

/** SMTP hata kodlarını yöneticinin anlayacağı Türkçe açıklamaya çevirir (şifre vb. asla içermez). */
export function explainSmtpError(e: unknown): string {
  const err = e as { code?: string; responseCode?: number; message?: string };
  const msg = String(err?.message ?? "");
  const code = [err?.code, err?.responseCode].filter(Boolean).join("/");
  const tag = code ? ` [${code}]` : "";
  // Sıra önemli: sertifika ve TLS sürüm hataları da ESOCKET koduyla gelir; önce onlar ayıklanır.
  if (err?.code === "EAUTH" || err?.responseCode === 535) return `Kullanıcı adı veya şifre kabul edilmedi. Gmail/Outlook kullanıyorsanız normal şifre yerine “uygulama şifresi” gerekir.${tag}`;
  if (/self[- ]signed|certificate|altnames|CERT_/i.test(msg)) return `Sunucunun SSL sertifikası doğrulanamadı; sunucu adını sertifikadaki adla aynı yazın.${tag}`;
  if (/wrong version number|ssl3_get_record|EPROTO/i.test(msg)) return `SSL/TLS ayarı sunucuyla uyuşmuyor. 465 için “SSL/TLS”, 587 için “STARTTLS” seçin.${tag}`;
  if (err?.code === "ENOTFOUND" || /getaddrinfo/i.test(msg)) return `SMTP sunucu adı bulunamadı (ör. mail.alanadiniz.com).${tag}`;
  if (/ECONNREFUSED/.test(msg)) return `SMTP sunucusu bağlantıyı reddetti; port kapalı ya da sunucu bu IP'yi engelliyor olabilir.${tag}`;
  if (err?.code === "ETIMEDOUT" || /timeout|timed out/i.test(msg)) return `SMTP sunucusuna bağlantı zaman aşımına uğradı; barındırma sağlayıcınız giden e-posta portlarını (587/465) engelliyor olabilir.${tag}`;
  if (err?.code === "ECONNECTION" || err?.code === "ESOCKET") return `SMTP sunucusuna bağlanılamadı: ${msg.slice(0, 120)}${tag}`;
  if (err?.responseCode && err.responseCode >= 500) return `Sunucu iletiyi reddetti (${err.responseCode}). Gönderen adresin bu hesaba ait olduğundan emin olun.${tag}`;
  return `E-posta gönderilemedi: ${msg.slice(0, 120)}${tag}`;
}

export async function sendEmail(email: Email, settings?: SiteSettings): Promise<SendResult> {
  const s = settings ?? (await getSiteSettings());
  const m = s.mail;
  const transport = transportFor(m);
  if (!transport) {
    if (process.env.NODE_ENV !== "production") console.info(`[email:kapalı] ${email.to} — ${email.subject}`);
    return { sent: false, error: "E-posta gönderimi kapalı veya SMTP bilgileri eksik." };
  }
  const fromAddress = m.fromEmail || m.username!;
  const fromName = (m.fromName || s.brand.name).replace(/["<>]/g, "");
  try {
    await transport.sendMail({
      from: { name: fromName, address: fromAddress },
      to: email.to,
      replyTo: email.replyTo ?? m.replyTo ?? undefined,
      subject: email.subject,
      text: email.text,
      html: email.html,
    });
    return { sent: true };
  } catch (e) {
    const error = explainSmtpError(e);
    console.error("[email] gönderilemedi:", email.subject, "—", (e as { code?: string })?.code ?? "", error);
    return { sent: false, error };
  } finally {
    transport.close();
  }
}
