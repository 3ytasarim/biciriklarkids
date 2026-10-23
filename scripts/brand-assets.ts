// NOT: Logo artık gerçek dosya (public/brand/biciriklar-logo.*). Bu script yalnızca ikonları üretir.
import sharp from "sharp";
import { readFile, writeFile } from "node:fs/promises";

/** Kod tabanlı logodan PNG varlıklar (Organization.logo, apple-touch-icon, manifest). Gerçek logo gelince değiştirilir. */
async function main() {
  const svg = await readFile("src/app/icon.svg");
  await writeFile("public/brand/icon-512.png", await sharp(svg, { density: 1200 }).resize(512, 512).png().toBuffer());
  await writeFile("src/app/apple-icon.png", await sharp(svg, { density: 1200 }).resize(180, 180).flatten({ background: "#fffdf9" }).png().toBuffer());
  const wordmark = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400"><rect width="1200" height="400" fill="#fffdf9"/>${svg.toString().replace("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 48 48\">", "<g transform=\"translate(80 80) scale(5)\">").replace("</svg>", "</g>")}<text x="400" y="230" font-family="Georgia, serif" font-size="150" font-weight="700" fill="#231f3a">Bıcırıklar</text><text x="408" y="310" font-family="Arial, sans-serif" font-size="44" font-weight="800" letter-spacing="22" fill="#c4402a">KIDS</text></svg>`;
  await writeFile("public/brand/biciriklar-kids-logo.png", await sharp(Buffer.from(wordmark)).png().toBuffer());
  console.log("✓ Marka varlıkları üretildi.");
}
main();
