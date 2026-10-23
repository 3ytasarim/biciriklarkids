"use client";

/** Kök layout dahil her şey çöktüğünde (ör. veritabanına ulaşılamıyor) gösterilen en sade hata sayfası. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="tr">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#fffdf9", color: "#231f3a", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0, padding: 24, textAlign: "center" }}>
        <div>
          <h1 style={{ fontSize: 32, margin: 0 }}>Bıcırıklar Kids şu anda yanıt veremiyor</h1>
          <p style={{ marginTop: 12, color: "#46415c" }}>Kısa bir süre sonra tekrar deneyin.</p>
          <button type="button" onClick={reset} style={{ marginTop: 20, minHeight: 48, padding: "0 24px", borderRadius: 999, border: 0, background: "#c4402a", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
            Tekrar dene
          </button>
        </div>
      </body>
    </html>
  );
}
