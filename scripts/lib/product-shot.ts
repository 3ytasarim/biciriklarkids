import sharp, { type OverlayOptions } from "sharp";

/**
 * Ürün fotoğrafı normalleştirme — tüm katalogda aynı "stüdyo" görünümü:
 * beyaz zemin kırpılır, ürün 4:5 beyaz tuvalin ortasına sabit kenar boşluğuyla yerleştirilir.
 * Sitede kart/galeri zemini açık renktir ve görsel `mix-blend-multiply` ile basılır → beyaz zemin kaybolur,
 * ürün sayfa zemininde "yüzer". Zemini beyaz olmayan görseller (afiş, renkli fon) olduğu gibi bırakılır.
 */
export const SHOT_W = 1200;
export const SHOT_H = 1500;
const MAX_W = 1010; // ~%84
const MAX_H = 1230; // ~%82
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/** Dört köşe de açık renkli mi (beyaz/çok açık gri fon)? */
export async function hasLightBackground(input: Buffer): Promise<boolean> {
  const img = sharp(input).rotate();
  const { width = 0, height = 0 } = await img.metadata();
  if (!width || !height) return false;
  const s = Math.max(6, Math.round(Math.min(width, height) * 0.02));
  const spots = [
    [0, 0],
    [width - s, 0],
    [0, height - s],
    [width - s, height - s],
  ];
  for (const [left, top] of spots) {
    const { data } = await sharp(input).rotate().extract({ left: left!, top: top!, width: s, height: s }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i]!;
    if (sum / data.length < 228) return false;
  }
  return true;
}

/** Beyaz kenarları kırpar, ürünü sınırlar içinde ölçekler (döndürür: ham PNG tampon + boyut). */
async function trimmed(input: Buffer, maxW: number, maxH: number) {
  const t = await sharp(input).rotate().flatten({ background: WHITE }).trim({ background: "#ffffff", threshold: 28 }).toBuffer();
  return sharp(t).resize(maxW, maxH, { fit: "inside", withoutEnlargement: false }).png().toBuffer({ resolveWithObject: true });
}

/** Açık zeminli fotoğrafı 4:5 stüdyo tuvaline yerleştirir; zemin açık değilse null. */
export async function normalizeShot(input: Buffer): Promise<Buffer | null> {
  if (!(await hasLightBackground(input))) return null;
  const { data, info } = await trimmed(input, MAX_W, MAX_H);
  return sharp({ create: { width: SHOT_W, height: SHOT_H, channels: 4, background: WHITE } })
    .composite([{ input: data, left: Math.round((SHOT_W - info.width) / 2), top: Math.round((SHOT_H - info.height) / 2) }])
    .flatten({ background: WHITE })
    .webp({ quality: 86 })
    .toBuffer();
}

/** Birden çok açık zeminli fotoğraftan 4:5 kolaj (set ürünleri için: içerik tek karede görünür). */
export async function collage(inputs: Buffer[], cols: number): Promise<Buffer> {
  const rows = Math.ceil(inputs.length / cols);
  const pad = 70;
  const gap = 30;
  const cellW = Math.floor((SHOT_W - pad * 2 - gap * (cols - 1)) / cols);
  const cellH = Math.floor((SHOT_H - pad * 2 - gap * (rows - 1)) / rows);
  const comps: OverlayOptions[] = [];
  for (let i = 0; i < inputs.length; i++) {
    const { data, info } = await trimmed(inputs[i]!, Math.round(cellW * 0.9), Math.round(cellH * 0.9));
    const r = Math.floor(i / cols);
    // son satır eksikse ortala
    const inRow = r === rows - 1 ? inputs.length - r * cols : cols;
    const rowOffset = Math.round(((cols - inRow) * (cellW + gap)) / 2);
    const c = i % cols;
    comps.push({
      input: data,
      left: pad + rowOffset + c * (cellW + gap) + Math.round((cellW - info.width) / 2),
      top: pad + r * (cellH + gap) + Math.round((cellH - info.height) / 2),
    });
  }
  return sharp({ create: { width: SHOT_W, height: SHOT_H, channels: 4, background: WHITE } }).composite(comps).flatten({ background: WHITE }).webp({ quality: 86 }).toBuffer();
}

/** Afiş/renkli fon: yalnızca boyut sınırı + WebP. */
export async function plainWebp(input: Buffer): Promise<Buffer> {
  return sharp(input).rotate().resize(1400, 1400, { fit: "inside", withoutEnlargement: true }).webp({ quality: 84 }).toBuffer();
}
