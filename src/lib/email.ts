import "server-only";

/**
 * E-posta gönderim arayüzü. TODO(SMTP/ESP): sağlayıcı bilgileri (ör. Resend, Postmark, SMTP) gelince
 * `send` gerçek gönderim yapacak. Şimdilik yalnızca sunucu loguna yazar.
 */
export type Email = { to: string; subject: string; text: string; html?: string };

export async function sendEmail(email: Email): Promise<{ sent: boolean }> {
  if (process.env.NODE_ENV !== "production") console.info(`[email:dev] ${email.to} — ${email.subject}`);
  return { sent: false };
}
