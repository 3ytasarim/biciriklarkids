import Image from "next/image";
import Link from "next/link";
import { and, count, desc, eq, ilike, inArray, lte, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, productImages, products } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/admin";
import { formatPrice } from "@/lib/commerce/money";
import { AdminPagination, Badge, EmptyRow, ListToolbar, PAGE_SIZE, PageHeader, pageOf, Table } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/ConfirmAction";
import { categoryOptions } from "./data";
import { deleteProductAction } from "./actions";
import { StatusToggle } from "./StatusToggle";

export const metadata = { title: "Ürünler" };

type SP = { q?: string; durum?: string; kategori?: string; stok?: string; sayfa?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = pageOf(sp.sayfa);
  const q = sp.q?.trim().slice(0, 80);
  const where: SQL[] = [];
  if (q) where.push(or(ilike(products.name, `%${q}%`), ilike(products.sku, `%${q}%`), ilike(products.barcode, `%${q}%`))!);
  if (sp.durum === "active" || sp.durum === "draft" || sp.durum === "archived") where.push(eq(products.status, sp.durum));
  if (sp.durum === "demo") where.push(eq(products.isDemo, true));
  if (sp.kategori) where.push(eq(products.categoryId, sp.kategori));
  if (sp.stok === "dusuk") where.push(and(eq(products.trackStock, true), lte(products.stock, products.lowStockThreshold))!);
  if (sp.stok === "yok") where.push(and(eq(products.trackStock, true), lte(products.stock, 0))!);
  const w = where.length ? and(...where) : undefined;

  const [rows, [{ total }], cats] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        sku: products.sku,
        price: products.price,
        compareAtPrice: products.compareAtPrice,
        stock: products.stock,
        trackStock: products.trackStock,
        lowStockThreshold: products.lowStockThreshold,
        status: products.status,
        isDemo: products.isDemo,
        bestseller: products.bestseller,
        newProduct: products.newProduct,
        giftProduct: products.giftProduct,
        categoryName: categories.name,
        salesCount: products.salesCount,
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(w)
      .orderBy(desc(products.updatedAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(products).where(w),
    categoryOptions(),
  ]);
  const imgs = rows.length
    ? await db
        .select({ productId: productImages.productId, url: productImages.imageUrl })
        .from(productImages)
        .where(and(inArray(productImages.productId, rows.map((r) => r.id)), eq(productImages.isPrimary, true)))
    : [];
  const imgBy = new Map(imgs.map((i) => [i.productId, i.url]));

  return (
    <>
      <PageHeader title="Ürünler" description={`${total} ürün`} action={{ label: "Yeni ürün", href: "/admin/urunler/yeni" }} />
      <ListToolbar
        q={q}
        placeholder="Ad, SKU veya barkod…"
        filters={[
          {
            name: "durum",
            label: "Durum",
            value: sp.durum,
            options: [
              { value: "active", label: "Yayında" },
              { value: "draft", label: "Taslak" },
              { value: "archived", label: "Arşiv" },
              { value: "demo", label: "Demo ürünler" },
            ],
          },
          { name: "kategori", label: "Kategori", value: sp.kategori, options: cats },
          {
            name: "stok",
            label: "Stok",
            value: sp.stok,
            options: [
              { value: "dusuk", label: "Düşük stok" },
              { value: "yok", label: "Stokta yok" },
            ],
          },
        ]}
      />
      <Table head={["", "Ürün", "Kategori", "Fiyat", "Stok", "Satış", "Durum", ""]} empty={rows.length ? null : <EmptyRow text="Ürün bulunamadı." action={{ label: "Yeni ürün", href: "/admin/urunler/yeni" }} />}>
        {rows.map((r) => {
          const low = r.trackStock && r.stock <= r.lowStockThreshold;
          return (
            <tr key={r.id} className="hover:bg-neutral-50">
              <td className="w-16 px-4 py-2">
                <div className="relative h-14 w-12 overflow-hidden rounded-xs bg-neutral-100">{imgBy.get(r.id) ? <Image src={imgBy.get(r.id)!} alt="" fill sizes="48px" className="object-cover" /> : null}</div>
              </td>
              <td className="px-4 py-2">
                <Link href={`/admin/urunler/${r.id}`} className="font-semibold hover:underline">
                  {r.name}
                </Link>
                <div className="mt-1 flex flex-wrap gap-1 text-xs text-neutral-500">
                  {r.sku ? <span>{r.sku}</span> : null}
                  {r.isDemo ? <Badge tone="amber">Demo</Badge> : null}
                  {r.bestseller ? <Badge>Çok satan</Badge> : null}
                  {r.newProduct ? <Badge>Yeni</Badge> : null}
                  {r.giftProduct ? <Badge>Hediyelik</Badge> : null}
                </div>
              </td>
              <td className="px-4 py-2 text-neutral-600">{r.categoryName ?? "—"}</td>
              <td className="px-4 py-2 whitespace-nowrap tabular-nums">
                {formatPrice(r.price)}
                {r.compareAtPrice ? <s className="ml-1 text-xs text-neutral-400">{formatPrice(r.compareAtPrice)}</s> : null}
              </td>
              <td className="px-4 py-2 tabular-nums">{r.trackStock ? <Badge tone={r.stock <= 0 ? "red" : low ? "amber" : "green"}>{r.stock}</Badge> : <span className="text-neutral-400">∞</span>}</td>
              <td className="px-4 py-2 tabular-nums">{r.salesCount}</td>
              <td className="px-4 py-2">
                <StatusToggle id={r.id} status={r.status} />
              </td>
              <td className="px-2 py-2 text-right">
                <ConfirmAction compact title={`“${r.name}” silinsin mi?`} description="Ürün kalıcı olarak silinir. Geçmiş siparişlerdeki kayıtlar korunur." action={deleteProductAction.bind(null, r.id)} />
              </td>
            </tr>
          );
        })}
      </Table>
      <AdminPagination page={page} pages={Math.ceil(Number(total) / PAGE_SIZE)} params={{ q, durum: sp.durum, kategori: sp.kategori, stok: sp.stok }} />
    </>
  );
}
