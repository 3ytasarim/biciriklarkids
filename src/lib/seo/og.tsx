import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import { storage } from "@/lib/storage";

/**
 * Dinamik Open Graph görselleri (1200×630). Türkçe karakterler için fontlar repoda (src/assets/fonts) —
 * çalışma zamanında harici istek yok. Görseller sharp ile PNG'ye çevrilip gömülür (Satori WebP okumaz).
 */
export const OG_W = 1200;
export const OG_H = 630;

const FONT_DIR = path.join(/*turbopackIgnore: true*/ process.cwd(), "src", "assets", "fonts");
let fontsPromise: Promise<{ name: string; data: Buffer; weight: 600 | 700 | 800; style: "normal" }[]> | null = null;

export function loadOgFonts() {
  fontsPromise ??= Promise.all([
    readFile(path.join(FONT_DIR, "Nunito-wght-800.ttf")).then((data) => ({ name: "NunitoDisplay", data, weight: 800 as const, style: "normal" as const })),
    readFile(path.join(FONT_DIR, "Nunito-Sans-wght-700.ttf")).then((data) => ({ name: "Nunito", data, weight: 700 as const, style: "normal" as const })),
    readFile(path.join(FONT_DIR, "Nunito-Sans-wght-800.ttf")).then((data) => ({ name: "Nunito", data, weight: 800 as const, style: "normal" as const })),
  ]);
  return fontsPromise;
}

/** Yerel görseli (/uploads/... veya public/...) OG'ye gömülebilir PNG data URI'ye çevirir. */
export async function imageDataUri(src: string | null | undefined, w = 640, h = 630): Promise<string | null> {
  if (!src || !src.startsWith("/")) return null;
  try {
    let buf: Buffer | null = null;
    const key = storage.keyFromUrl(src);
    if (key) buf = (await storage.read(key))?.data ?? null;
    else buf = await readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), "public", src));
    if (!buf) return null;
    const png = await sharp(buf).resize(w, h, { fit: "cover" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}

const C = { paper: "#fbfdff", sky: "#eaf5ff", ink: "#10284a", soft: "#46597a", brand: "#1e8cf5", brandInk: "#0067d1", coralInk: "#c4402a", sun: "#f6b73c", leaf: "#3f9b6e", berry: "#e2679b" };

let logoPromise: Promise<string | null> | null = null;
/** Gerçek marka logosu (bulut harfler) — OG içine PNG data URI olarak gömülür. */
function logoDataUri(): Promise<string | null> {
  logoPromise ??= readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "brand", "biciriklar-logo.png"))
    .then(async (buf) => `data:image/png;base64,${(await sharp(buf).resize({ width: 520 }).png().toBuffer()).toString("base64")}`)
    .catch(() => null);
  return logoPromise;
}

function Cloud({ w, x, y, opacity = 1 }: { w: number; x: number; y: number; opacity?: number }) {
  return (
    <svg width={w} height={w / 2} viewBox="0 0 120 60" style={{ position: "absolute", left: x, top: y, opacity }}>
      <path d="M22 56h78a18 18 0 0 0 2.6-35.8A26 26 0 0 0 53.5 12 20 20 0 0 0 22 56Z" fill="#ffffff" />
    </svg>
  );
}

function Brand({ logo, width = 260 }: { logo: string | null; width?: number }) {
  return logo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logo} width={width} height={Math.round(width * 0.316)} alt="" />
  ) : (
    <span style={{ fontFamily: "NunitoDisplay", fontSize: 40, color: C.brandInk }}>Bıcırıklar Kids</span>
  );
}

/** Ürün / kategori / blog için ortak kompozisyon: solda görsel, sağda logo + başlık + fiyat. */
export async function renderOg(opts: { eyebrow?: string | null; title: string; subtitle?: string | null; price?: string | null; oldPrice?: string | null; image?: string | null; tint?: string }) {
  const [fonts, img, logo] = await Promise.all([loadOgFonts(), imageDataUri(opts.image, 560, 630), logoDataUri()]);
  const titleSize = opts.title.length > 60 ? 44 : opts.title.length > 36 ? 52 : 62;
  return new ImageResponse(
    (
      <div style={{ width: OG_W, height: OG_H, display: "flex", background: C.paper, fontFamily: "Nunito" }}>
        <div style={{ width: 560, height: OG_H, display: "flex", background: opts.tint ?? C.sky, position: "relative", alignItems: "center", justifyContent: "center" }}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} width={560} height={630} style={{ objectFit: "cover" }} alt="" />
          ) : (
            <Brand logo={logo} width={420} />
          )}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px 56px 48px 56px", background: `linear-gradient(180deg, ${C.sky} 0%, ${C.paper} 55%)` }}>
          <Brand logo={logo} width={230} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            {opts.eyebrow ? <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: 3, color: C.brandInk }}>{opts.eyebrow.toLocaleUpperCase("tr-TR")}</span> : null}
            <span style={{ fontFamily: "NunitoDisplay", fontSize: titleSize, lineHeight: 1.06, color: C.ink, marginTop: 14 }}>{opts.title}</span>
            {opts.subtitle ? <span style={{ fontWeight: 700, fontSize: 24, color: C.soft, marginTop: 18, lineHeight: 1.35 }}>{opts.subtitle}</span> : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {opts.price ? (
              <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
                <span style={{ fontWeight: 800, fontSize: 52, color: opts.oldPrice ? C.coralInk : C.ink }}>{opts.price}</span>
                {opts.oldPrice ? <span style={{ fontWeight: 700, fontSize: 28, color: "#8593ab", textDecoration: "line-through" }}>{opts.oldPrice}</span> : null}
              </div>
            ) : (
              <span />
            )}
            <div style={{ display: "flex", gap: 8 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <span key={i} style={{ display: "flex", width: 18, height: 8, borderRadius: 8, background: [C.brand, C.sun, C.leaf, C.berry][i % 4] }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
    { width: OG_W, height: OG_H, fonts, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800" } },
  );
}

let bigLogoPromise: Promise<string | null> | null = null;
/** Ortalı marka görseli için büyük logo (WhatsApp kare kırpmasında da sığacak genişlikte). */
function bigLogoDataUri(): Promise<string | null> {
  bigLogoPromise ??= readFile(path.join(/*turbopackIgnore: true*/ process.cwd(), "public", "brand", "biciriklar-logo.png"))
    .then(async (buf) => `data:image/png;base64,${(await sharp(buf).resize({ width: 1240 }).png().toBuffer()).toString("base64")}`)
    .catch(() => null);
  return bigLogoPromise;
}

/**
 * Marka (ana sayfa / varsayılan) OG görseli — WhatsApp vb. paylaşım önizlemesi: bulut mavisi gökyüzü,
 * kenarlarda bulutlar, tam ortada logo ve altında kısa slogan.
 */
export async function renderSiteOg(tagline: string) {
  const [fonts, logo] = await Promise.all([loadOgFonts(), bigLogoDataUri()]);
  const W = 620;
  return new ImageResponse(
    (
      <div style={{ width: OG_W, height: OG_H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "Nunito", position: "relative", background: "linear-gradient(180deg, #7cc4ff 0%, #a9d8ff 45%, #d9eeff 100%)" }}>
        <Cloud w={300} x={-70} y={30} opacity={0.95} />
        <Cloud w={220} x={210} y={-30} opacity={0.8} />
        <Cloud w={340} x={900} y={10} opacity={0.95} />
        <Cloud w={200} x={1040} y={250} opacity={0.75} />
        <Cloud w={380} x={-90} y={440} />
        <Cloud w={300} x={300} y={500} opacity={0.9} />
        <Cloud w={260} x={680} y={510} opacity={0.85} />
        <Cloud w={360} x={930} y={440} />
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} width={W} height={Math.round((W * 379) / 1200)} alt="" style={{ marginTop: -30 }} />
        ) : (
          <span style={{ fontFamily: "NunitoDisplay", fontSize: 88, color: C.brandInk }}>Bıcırıklar Kids</span>
        )}
        <span style={{ display: "flex", marginTop: 26, padding: "10px 28px", borderRadius: 999, background: "rgba(255,255,255,0.85)", fontFamily: "NunitoDisplay", fontSize: 34, color: C.brandInk }}>{tagline}</span>
      </div>
    ),
    { width: OG_W, height: OG_H, fonts, headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } },
  );
}
