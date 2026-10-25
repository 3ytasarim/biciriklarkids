import Image from "next/image";
import { carrierBrand } from "@/lib/commerce/carriers";
import { cn } from "@/lib/utils";

/**
 * Kargo firması rozeti: admin'den yüklenmiş logo, yoksa firmanın varsayılan logosu; o da yoksa marka
 * renginde isim etiketi. Logo kutuya orantılı sığdırılır (kırpılmaz).
 * Sabit ölçü (CLS yok); dekoratif değil — adı alt/aria ile verilir.
 */
export function CarrierBadge({ brand, name, logoUrl, className }: { brand: string; name: string; logoUrl?: string | null; className?: string }) {
  const b = carrierBrand(brand);
  const logo = logoUrl || b.logo;
  if (logo) {
    return (
      <span className={cn("relative inline-flex h-11 w-28 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-line", className)}>
        <Image src={logo} alt={name} fill sizes="112px" className="object-contain px-2 py-1.5" />
      </span>
    );
  }
  return (
    <span
      className={cn("inline-flex h-11 w-28 shrink-0 items-center justify-center rounded-md px-2 text-center text-[12px] leading-tight font-extrabold tracking-tight", className)}
      style={{ background: b.bg, color: b.fg }}
    >
      {name}
    </span>
  );
}
