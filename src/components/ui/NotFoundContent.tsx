import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import { FeltArt } from "./FeltArt";

export function NotFoundContent() {
  return (
    <div className="shell grid items-center gap-10 py-16 sm:py-24 md:grid-cols-2">
      <div>
        <p className="eyebrow mb-4">Hata 404</p>
        <h1 className="display-1">Bu sayfa ipini kaçırmış.</h1>
        <p className="lead mt-6 max-w-lg">Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir. Ürünlerimize veya kategorilere göz atarak devam edebilirsiniz.</p>
        <div className="mt-8 flex flex-col gap-3 min-[420px]:flex-row">
          <Link href="/urunler" className="btn-primary">
            Ürünleri Keşfet <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link href="/arama" className="btn-outline">
            <Search aria-hidden="true" className="h-4 w-4" /> Ürün ara
          </Link>
        </div>
      </div>
      <div className="aspect-square overflow-hidden rounded-xl">
        <FeltArt accent="sky" motif="fish" />
      </div>
    </div>
  );
}
