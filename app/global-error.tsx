"use client";

export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F7F6F2", color: "#141414", margin: 0 }}>
        <main style={{ maxWidth: 520, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#6B6B66", fontWeight: 600 }}>KAYEN</p>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: "12px 0" }}>Une erreur est survenue</h1>
          <p style={{ color: "#6B6B66" }}>Nos équipes ont été informées. Vous pouvez réessayer ou revenir à l&apos;accueil.</p>
          {error.digest && <p style={{ fontSize: 12, color: "#9A9A93" }}>Référence : {error.digest}</p>}
          <div style={{ marginTop: 32, display: "flex", gap: 12, justifyContent: "center" }}>
            <button onClick={() => retry()} style={{ background: "#111", color: "#fff", border: 0, borderRadius: 6, padding: "10px 18px", fontWeight: 500, cursor: "pointer" }}>
              Réessayer
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error s'affiche sans le layout racine */}
            <a href="/" style={{ border: "1px solid #C9C6BD", borderRadius: 6, padding: "10px 18px", color: "#141414", textDecoration: "none" }}>
              Retour à l&apos;accueil
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
