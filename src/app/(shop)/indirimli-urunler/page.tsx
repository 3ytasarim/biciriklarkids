import { CollectionPage, collectionMetadata } from "@/components/category/CollectionPage";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export function generateMetadata({ searchParams }: Props) {
  return collectionMetadata("sale", searchParams);
}

export default async function Page({ searchParams }: Props) {
  return <CollectionPage pageKey="sale" title="İndirimli Ürünler" eyebrow="Fırsatlar" description="Şu anda indirimde olan Bıcırıklar Kids ürünleri." baseFilters={{ onSale: true }} searchParams={await searchParams} />;
}
