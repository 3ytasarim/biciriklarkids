import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Zengin metin editöründen (Tiptap) gelen HTML'in sunucu tarafı süzgeci. Editör zaten kendi şemasıyla
 * yapıştırılan HTML'i temizler; bu ikinci katman doğrudan POST edilen içeriğe karşı da korur (XSS).
 * H1 bilinçli olarak yok: sayfanın H1'i başlık alanıdır.
 */
const ALLOWED_TAGS = [
  "p",
  "h2",
  "h3",
  "h4",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "a",
  "blockquote",
  "hr",
  "br",
  "img",
];

export function sanitizeRichText(html: string | null | undefined): string {
  if (!html) return "";
  const clean = sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "rel", "target"],
      img: ["src", "alt", "width", "height"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "";
        const external = /^https?:\/\//i.test(href);
        return {
          tagName,
          attribs: {
            href,
            ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
          },
        };
      },
    },
    // Görsel yalnızca kendi medya deposundan (/uploads/...) veya https kaynaktan olabilir; diğerleri tamamen atılır.
    exclusiveFilter: (frame) => frame.tag === "img" && !/^(\/uploads\/|https:\/\/)/.test(frame.attribs.src ?? ""),
    disallowedTagsMode: "discard",
  });
  // Tiptap boş editörde "<p></p>" üretir; boş başlıklar da (yanlışlıkla uygulanan H2 vb.) atılır.
  return clean.replace(/<(p|h2|h3|h4|blockquote)>\s*(<br\s*\/?>)?\s*<\/\1>/g, "").trim();
}

/** HTML'den düz metin (özet, meta description, okuma süresi için). */
export function htmlToText(html: string | null | undefined): string {
  return sanitizeHtml(html ?? "", { allowedTags: [], allowedAttributes: {} })
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
