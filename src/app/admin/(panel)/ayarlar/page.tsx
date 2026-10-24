import { requireAdmin } from "@/lib/auth/admin";
import { getSiteSettings } from "@/lib/settings";
import { decryptSecret } from "@/lib/crypto/secret-box";
import { iyzicoConfig, iyzicoFromEnv } from "@/lib/payments/iyzico/client";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm, type IyzicoStatus } from "./SettingsForm";

export const metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  await requireAdmin("admin");
  const s = await getSiteSettings();
  const env = { NEXT_PUBLIC_GTM_ID: "GTM", NEXT_PUBLIC_GA4_ID: "GA4", NEXT_PUBLIC_GOOGLE_ADS_ID: "Google Ads", NEXT_PUBLIC_META_PIXEL_ID: "Meta Pixel" };
  const envOverrides = Object.entries(env)
    .filter(([k]) => process.env[k]?.trim())
    .map(([, l]) => l);

  // Şifreli gizli anahtar tarayıcıya ASLA gönderilmez; yalnızca durum bilgisi gider.
  const iyzicoStatus: IyzicoStatus = {
    fromEnv: iyzicoFromEnv(),
    active: iyzicoConfig(s) !== null,
    secretStored: Boolean(s.iyzico.secretKeyEnc),
    secretReadable: decryptSecret(s.iyzico.secretKeyEnc) !== null,
  };
  const safe = { ...s, iyzico: { ...s.iyzico, secretKeyEnc: null } };

  return (
    <>
      <PageHeader title="Site ayarları" />
      <SettingsForm s={safe} envOverrides={envOverrides} iyzicoStatus={iyzicoStatus} />
    </>
  );
}
