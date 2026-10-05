import { describe, it, expect } from "vitest";
import { renderMarkdown, markdownToText } from "@/lib/markdown";

describe("markdown", () => {
  it("rend titres, listes, gras, liens", () => {
    const html = renderMarkdown("# Titre\n\nUn **mot** et *autre* avec [lien](/c/hygiene).\n\n- a\n- b\n\n1. un\n2. deux");
    expect(html).toContain("<h2>Titre</h2>");
    expect(html).toContain("<strong>mot</strong>");
    expect(html).toContain("<em>autre</em>");
    expect(html).toContain('<a href="/c/hygiene">lien</a>');
    expect(html).toContain("<ul><li>a</li><li>b</li></ul>");
    expect(html).toContain("<ol><li>un</li><li>deux</li></ol>");
  });
  it("échappe le HTML (XSS)", () => {
    const html = renderMarkdown("<script>alert(1)</script> [x](javascript:alert(1))");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain('href="javascript');
  });
  it("tableaux", () => {
    const html = renderMarkdown("| Quantité | Prix |\n|---|---|\n| 1 | 12 |");
    expect(html).toContain("<table>");
    expect(html).toContain("<th>Quantité</th>");
    expect(html).toContain("<td>12</td>");
  });
  it("extrait un texte brut tronqué", () => {
    expect(markdownToText("## Titre\n\nUn **texte** long", 12)).toBe("Titre Un te…");
  });
});
