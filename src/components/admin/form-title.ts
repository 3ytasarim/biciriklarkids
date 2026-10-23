/** Formdaki güncel ad/başlık (yükleme anında): açıklayıcı, SEO dostu dosya adı için. */
export function currentTitle(el: HTMLElement | null): string | undefined {
  const form = el?.closest("form");
  const field = form?.querySelector<HTMLInputElement>("input[name=name], input[name=title]");
  return field?.value.trim() || undefined;
}
