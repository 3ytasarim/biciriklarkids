import Link from "next/link";
import { getCategoryTree } from "@/lib/catalog/queries";
import { Logo } from "@/components/ui/Logo";
import { HeaderShell } from "./HeaderShell";
import { DesktopNav } from "./DesktopNav";
import { HeaderActions } from "./HeaderActions";
import { MobileMenu } from "./MobileMenu";
import type { NavCategory } from "./nav";

/** Sticky header — kategori verisi sunucuda okunur, etkileşim (mega menü, arama, sepet) istemci adalarında. */
export async function Header({ contact }: { contact: { phone: string | null; email: string | null } }) {
  const { roots } = await getCategoryTree();
  const categories: NavCategory[] = roots
    .filter((c) => c.showInMenu)
    .map((c) => ({
      name: c.name,
      slug: c.slug,
      accent: c.accent,
      image: c.image,
      imageAlt: c.imageAlt,
      productCount: c.productCount,
      children: c.children.filter((ch) => ch.showInMenu).map((ch) => ({ name: ch.name, slug: ch.slug })),
    }));

  return (
    <HeaderShell>
      <div className="shell flex h-[var(--header-h)] items-center gap-2 transition-[height] duration-300 lg:gap-3 xl:gap-6">
        <MobileMenu categories={categories} contact={contact} />
        <Link href="/" aria-label="Bıcırıklar Kids — Ana sayfa" className="mr-auto shrink-0 rounded-md lg:mr-0">
          <Logo />
        </Link>
        <DesktopNav categories={categories} />
        <HeaderActions />
      </div>
    </HeaderShell>
  );
}
