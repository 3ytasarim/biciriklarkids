/** JSON-LD script'i. `<` kaçışlanır → içerikteki "</script>" dizisi script'i kapatamaz (XSS). */
export function JsonLd({ data }: { data: Record<string, unknown> | null | undefined }) {
  if (!data) return null;
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\u003c") }} />;
}
