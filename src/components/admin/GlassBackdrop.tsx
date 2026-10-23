import { SkyDrift } from "@/components/ui/Clouds";

/**
 * Yönetim paneli arka planı (açık "glass" tema): gökyüzü degradesi + yumuşak renk lekeleri + yavaş akan
 * bulutlar. Cam paneller (backdrop-filter) bu katmanın üstünde buzlu görünür. Dekoratif; sabit konumlu.
 */
export function GlassBackdrop() {
  return (
    <div aria-hidden="true" className="admin-backdrop">
      <span className="admin-blob admin-blob--a" />
      <span className="admin-blob admin-blob--b" />
      <span className="admin-blob admin-blob--c" />
      <SkyDrift className="opacity-45" />
    </div>
  );
}
