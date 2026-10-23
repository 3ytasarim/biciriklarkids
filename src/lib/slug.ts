const TR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

/** "Şömine Hazneleri" → "somine-hazneleri". İstemcide (otomatik slug önizleme) ve sunucuda aynı sonucu verir. */
export function slugify(input: string): string {
  return input
    .split("")
    .map((char) => TR_MAP[char] ?? char)
    .join("")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 96)
    .replace(/-+$/g, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
