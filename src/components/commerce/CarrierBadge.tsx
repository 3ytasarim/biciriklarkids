import Image from "next/image";
import { carrierBrand } from "@/lib/commerce/carriers";
import { cn } from "@/lib/utils";

/**
 * Kargo firması rozeti: admin'den yüklenmiş logo varsa logo, yoksa firmanın marka renginde isim etiketi.
 * Sabit ölçü (CLS yok); dekoratif değil — adı alt/aria ile verilir.
 */
export function CarrierBadge({ brand, name, logoUrl, className }: { brand: string; name: string; logoUrl?: string | null; className?: string }) {
  if (logoUrl) {
    return (
      <span className={cn("relative inline-flex h-10 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white ring-1 ring-line", className)}>
        <Image src={logoUrl} alt={name} fill sizes="96px" className="object-contain p-1.5" />
      </span>
    );
  }
  const b = carrierBrand(brand);
  return (
    <span
      className={cn("inline-flex h-10 w-24 shrink-0 items-center justify-center rounded-md px-2 text-center text-[12px] leading-tight font-extrabold tracking-tight", className)}
      style={{ background: b.bg, color: b.fg }}
    >
      {name}
    </span>
  );
}
