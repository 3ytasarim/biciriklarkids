import { requireAdmin } from "@/lib/auth/admin";
import { getSiteSettings } from "@/lib/settings";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "./SettingsForm";

export const metadata = { title: "Ayarlar" };

export default async function SettingsPage() {
  await requireAdmin("admin");
  const s = await getSiteSettings();
  const env = { NEXT_PUBLIC_GTM_ID: "GTM", NEXT_PUBLIC_GA4_ID: "GA4", NEXT_PUBLIC_GOOGLE_ADS_ID: "Google Ads", NEXT_PUBLIC_META_PIXEL_ID: "Meta Pixel" };
  const envOverrides = Object.entries(env)
    .filter(([k]) => process.env[k]?.trim())
    .map(([, l]) => l);
  return (
    <>
      <PageHeader title="Site ayarları" />
      <SettingsForm s={s} envOverrides={envOverrides} />
    </>
  );
}
