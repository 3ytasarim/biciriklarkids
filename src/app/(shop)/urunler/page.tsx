import { CollectionPage, collectionMetadata } from "@/components/category/CollectionPage";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export function generateMetadata({ searchParams }: Props) {
  return collectionMetadata("products", searchParams);
}

export default async function Page({ searchParams }: Props) {
  return <CollectionPage pageKey="products" title="Tüm Ürünler" eyebrow="Bıcırıklar Kids mağazası" description="Keçe dikiş kitleri, eğitici aktivite ve kendin yap setleri. Kategoriye, yaşa ve fiyata göre filtreleyerek çocuğunuza en uygun kiti bulun." baseFilters={{}} searchParams={await searchParams} />;
}
