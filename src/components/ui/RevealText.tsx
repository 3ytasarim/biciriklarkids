/**
 * Harf harf bulanıktan netleşen metin (yalnızca görsel katman; aria-hidden).
 * Erişilebilirlik için çağıran taraf aynı metni sr-only olarak da vermelidir.
 * Animasyonu tetikleyen CSS, `charClass` sınıfı üzerinden çağıranın bağlamında tanımlanır
 * (ör. `.faq-item[open] .faq-ch`, `.howto-step.is-on .rv-ch`). `--i` harf sırasıdır.
 * Kelimeler nowrap gruplanır → satır yalnızca boşluklarda kırılır.
 */
export function RevealText({ text, charClass = "rv-ch", offset = 0, by = "char" }: { text: string; charClass?: string; offset?: number; by?: "char" | "word" }) {
  let n = offset;
  const words = text.split(" ");
  // Uzun metinlerde kelime kelime: DOM ve RSC yükü ~6 kat azalır (performans)
  if (by === "word") {
    return (
      <span aria-hidden="true">
        {words.map((w, wi) => (
          <span key={wi}>
            <span className={charClass} style={{ "--i": n++ } as React.CSSProperties}>
              {w}
            </span>
            {wi < words.length - 1 ? " " : null}
          </span>
        ))}
      </span>
    );
  }
  return (
    <span aria-hidden="true">
      {words.map((w, wi) => (
        <span key={wi}>
          <span className="inline-block whitespace-nowrap">
            {w.split("").map((ch, ci) => (
              <span key={ci} className={charClass} style={{ "--i": n++ } as React.CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
          {wi < words.length - 1 ? " " : null}
        </span>
      ))}
    </span>
  );
}
