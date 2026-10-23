import type { Accent } from "@/lib/catalog/types";
import { cn } from "@/lib/utils";

/**
 * Keçe illüstrasyonu — gerçek fotoğraf yokken (kategori, hero) kullanılan marka yer tutucusu.
 * Stok çocuk fotoğrafı yerine dikiş motifli, düz keçe formları. Dekoratiftir (aria-hidden).
 */
export const MOTIFS = ["bag", "bear", "star", "flower", "fish", "heart", "rocket", "cat"] as const;
export type Motif = (typeof MOTIFS)[number];

const BASE: Record<Accent, { bg: string; main: string; second: string; third: string }> = {
  coral: { bg: "#fdede9", main: "#e8573f", second: "#f6b73c", third: "#3f9b6e" },
  sun: { bg: "#fef4dc", main: "#f6b73c", second: "#e8573f", third: "#4ea3e0" },
  leaf: { bg: "#e7f4ed", main: "#3f9b6e", second: "#f6b73c", third: "#e2679b" },
  sky: { bg: "#eaf5ff", main: "#1e8cf5", second: "#f6b73c", third: "#e8573f" },
  berry: { bg: "#fce9f1", main: "#e2679b", second: "#9a8ce0", third: "#f6b73c" },
  lilac: { bg: "#efecfb", main: "#9a8ce0", second: "#e2679b", third: "#3f9b6e" },
};

export function motifFor(seed: string): Motif {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return MOTIFS[h % MOTIFS.length]!;
}

const STITCH = { fill: "none", stroke: "#fff", strokeWidth: 3, strokeDasharray: "7 6", strokeLinecap: "round" as const, strokeOpacity: 0.85 };

function Shape({ motif, c }: { motif: Motif; c: (typeof BASE)[Accent] }) {
  switch (motif) {
    case "bag":
      return (
        <g>
          <path d="M150 170 C150 100 250 100 250 170" fill="none" stroke={c.second} strokeWidth="18" strokeLinecap="round" />
          <path d="M95 175 H305 L285 380 Q283 400 262 400 H138 Q117 400 115 380 Z" fill={c.main} />
          <path d="M110 190 H290 L272 372 Q270 386 256 386 H144 Q130 386 128 372 Z" {...STITCH} />
          <circle cx="200" cy="285" r="44" fill={c.second} />
          <circle cx="200" cy="285" r="32" {...STITCH} />
          <ellipse cx="200" cy="300" rx="16" ry="20" fill={c.third} />
        </g>
      );
    case "bear":
      return (
        <g>
          <circle cx="128" cy="150" r="46" fill={c.main} />
          <circle cx="272" cy="150" r="46" fill={c.main} />
          <circle cx="128" cy="150" r="22" fill={c.second} />
          <circle cx="272" cy="150" r="22" fill={c.second} />
          <circle cx="200" cy="260" r="125" fill={c.main} />
          <circle cx="200" cy="260" r="108" {...STITCH} />
          <ellipse cx="200" cy="300" rx="52" ry="40" fill={c.second} />
          <circle cx="158" cy="240" r="11" fill="#231f3a" />
          <circle cx="242" cy="240" r="11" fill="#231f3a" />
          <ellipse cx="200" cy="288" rx="15" ry="11" fill="#231f3a" />
        </g>
      );
    case "star":
      return (
        <g>
          <path d="M200 70 L238 175 L350 178 L262 245 L295 352 L200 290 L105 352 L138 245 L50 178 L162 175 Z" fill={c.main} strokeLinejoin="round" stroke={c.main} strokeWidth="24" />
          <path d="M200 105 L229 186 L316 189 L248 241 L273 324 L200 276 L127 324 L152 241 L84 189 L171 186 Z" {...STITCH} />
          <circle cx="172" cy="232" r="9" fill="#231f3a" />
          <circle cx="228" cy="232" r="9" fill="#231f3a" />
          <path d="M182 262 Q200 278 218 262" fill="none" stroke="#231f3a" strokeWidth="6" strokeLinecap="round" />
        </g>
      );
    case "flower":
      return (
        <g>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="200" cy="155" rx="56" ry="78" fill={c.main} transform={`rotate(${a} 200 250)`} />
          ))}
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={`s${a}`} cx="200" cy="160" rx="40" ry="60" {...STITCH} transform={`rotate(${a} 200 250)`} />
          ))}
          <circle cx="200" cy="250" r="58" fill={c.second} />
          <circle cx="200" cy="250" r="44" {...STITCH} />
        </g>
      );
    case "fish":
      return (
        <g>
          <path d="M300 250 L370 180 L370 320 Z" fill={c.second} strokeLinejoin="round" stroke={c.second} strokeWidth="16" />
          <ellipse cx="190" cy="250" rx="140" ry="100" fill={c.main} />
          <ellipse cx="190" cy="250" rx="120" ry="82" {...STITCH} />
          <circle cx="120" cy="230" r="14" fill="#fff" />
          <circle cx="120" cy="230" r="7" fill="#231f3a" />
          <path d="M200 175 Q230 250 200 325" fill="none" stroke={c.third} strokeWidth="14" strokeLinecap="round" />
        </g>
      );
    case "heart":
      return (
        <g>
          <path d="M200 370 C110 300 60 245 60 180 C60 125 100 95 145 95 C175 95 192 112 200 130 C208 112 225 95 255 95 C300 95 340 125 340 180 C340 245 290 300 200 370 Z" fill={c.main} />
          <path d="M200 340 C125 280 84 236 84 182 C84 140 113 118 146 118 C172 118 189 136 200 160 C211 136 228 118 254 118 C287 118 316 140 316 182 C316 236 275 280 200 340 Z" {...STITCH} />
        </g>
      );
    case "rocket":
      return (
        <g>
          <path d="M150 320 L110 380 L170 360 Z" fill={c.second} />
          <path d="M250 320 L290 380 L230 360 Z" fill={c.second} />
          <path d="M200 70 C270 130 270 260 245 350 H155 C130 260 130 130 200 70 Z" fill={c.main} />
          <path d="M200 100 C254 152 254 255 233 332 H167 C146 255 146 152 200 100 Z" {...STITCH} />
          <circle cx="200" cy="205" r="34" fill="#fff" />
          <circle cx="200" cy="205" r="22" fill={c.third} />
          <path d="M175 360 Q200 420 225 360" fill={c.second} />
        </g>
      );
    case "cat":
      return (
        <g>
          <path d="M95 200 L110 85 L180 145 Z" fill={c.main} />
          <path d="M305 200 L290 85 L220 145 Z" fill={c.main} />
          <ellipse cx="200" cy="250" rx="135" ry="120" fill={c.main} />
          <ellipse cx="200" cy="250" rx="116" ry="102" {...STITCH} />
          <ellipse cx="155" cy="235" rx="12" ry="16" fill="#231f3a" />
          <ellipse cx="245" cy="235" rx="12" ry="16" fill="#231f3a" />
          <path d="M188 275 L212 275 L200 290 Z" fill={c.second} />
          <path d="M120 285 H70 M120 300 H75 M280 285 H330 M280 300 H325" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
  }
}

export function FeltArt({ accent = "coral", motif = "bag", className, decor = true }: { accent?: Accent; motif?: Motif; className?: string; decor?: boolean }) {
  const c = BASE[accent];
  return (
    <svg viewBox="0 0 400 480" preserveAspectRatio="xMidYMid slice" className={cn("h-full w-full", className)} aria-hidden="true" focusable="false">
      <rect width="400" height="480" fill={c.bg} />
      {decor ? (
        <g opacity="0.9">
          <circle cx="340" cy="70" r="26" fill={c.second} opacity="0.55" />
          <path d="M40 420 q30 -40 60 0 q-30 40 -60 0Z" fill={c.third} opacity="0.45" />
          <path d="M20 60 h60" stroke={c.main} strokeOpacity="0.35" strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round" />
          <path d="M310 440 h70" stroke={c.main} strokeOpacity="0.35" strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round" />
        </g>
      ) : null}
      <g transform="translate(0 20)">
        <Shape motif={motif} c={c} />
      </g>
    </svg>
  );
}
