import { CollectionPage, collectionMetadata } from "@/components/category/CollectionPage";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export function generateMetadata({ searchParams }: Props) {
  return collectionMetadata("bestsellers", searchParams);
}

export default async function Page({ searchParams }: Props) {
  return <CollectionPage pageKey="bestsellers" title="En Çok Satanlar" eyebrow="Ailelerin favorileri" description="Bıcırıklar Kids'in en çok tercih edilen dikiş kitleri ve aktivite setleri." baseFilters={{ bestseller: true }} searchParams={await searchParams} />;
}
