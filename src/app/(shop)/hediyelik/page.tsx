import { CollectionPage, collectionMetadata } from "@/components/category/CollectionPage";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export function generateMetadata({ searchParams }: Props) {
  return collectionMetadata("gifts", searchParams);
}

export default async function Page({ searchParams }: Props) {
  return <CollectionPage pageKey="gifts" title="Hediyelik Ürünler" eyebrow="Tam hediyelik" description="Doğum günü, karne ve bayram için hediye etmeye hazır, eğlenceli ve eğitici aktivite kitleri." baseFilters={{ gift: true }} searchParams={await searchParams} />;
}
