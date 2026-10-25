import { requireAdmin } from "@/lib/auth/admin";
import { getSiteSettings } from "@/lib/settings";
import { decryptSecret } from "@/lib/crypto/secret-box";
import { mailReady } from "@/lib/email";
import { PageHeader } from "@/components/admin/ui";
import { MailSettingsForm } from "./MailSettingsForm";

export const metadata = { title: "E-posta" };

export default async function MailPage() {
  await requireAdmin("admin");
  const s = await getSiteSettings();
  // Şifreli SMTP şifresi tarayıcıya gönderilmez; yalnızca durum bilgisi gider.
  const status = {
    ready: mailReady(s.mail),
    passwordStored: Boolean(s.mail.passwordEnc),
    passwordReadable: decryptSecret(s.mail.passwordEnc) !== null,
  };
  return (
    <>
      <PageHeader title="E-posta" description="SMTP gönderim ayarları ve müşterilere giden e-posta şablonları." />
      <MailSettingsForm mail={{ ...s.mail, passwordEnc: null }} templates={s.mailTemplates} status={status} defaultTo={s.mail.notifyEmail || s.contact.email || ""} />
    </>
  );
}
