import { CollectionPage, collectionMetadata } from "@/components/category/CollectionPage";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export function generateMetadata({ searchParams }: Props) {
  return collectionMetadata("newArrivals", searchParams);
}

export default async function Page({ searchParams }: Props) {
  return <CollectionPage pageKey="newArrivals" title="Yeni Ürünler" eyebrow="Koleksiyona yeni katılanlar" description="Bıcırıklar Kids koleksiyonuna yeni eklenen dikiş kitleri ve yaratıcı aktivite setleri." baseFilters={{ isNew: true }} searchParams={await searchParams} />;
}
