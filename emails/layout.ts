import { siteConfig } from "@/lib/config/site";
import { getDictionary } from "@/i18n";

/**
 * Gabarit HTML responsive des emails KAYEN (styles inline, compatible clients mail).
 */
export interface EmailBlock {
  type: "paragraph" | "cta" | "muted" | "table" | "heading" | "divider";
  text?: string;
  href?: string;
  rows?: { label: string; value: string }[];
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function renderEmail(opts: { title: string; preheader?: string; greeting?: string; blocks: EmailBlock[] }): { html: string; text: string } {
  const d = getDictionary("fr").emails.common;
  const bodyHtml = opts.blocks
    .map((b) => {
      switch (b.type) {
        case "heading":
          return `<h2 style="margin:24px 0 8px;font-size:18px;font-weight:700;color:#111111;">${escape(b.text ?? "")}</h2>`;
        case "paragraph":
          return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:#141414;">${escape(b.text ?? "")}</p>`;
        case "muted":
          return `<p style="margin:0 0 14px;font-size:13px;line-height:1.6;color:#6b6b66;">${escape(b.text ?? "")}</p>`;
        case "cta":
          return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:8px 0 22px;"><tr><td style="background:#111111;border-radius:6px;"><a href="${b.href}" style="display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">${escape(b.text ?? "")}</a></td></tr></table>`;
        case "divider":
          return `<hr style="border:0;border-top:1px solid #e3e1da;margin:20px 0;"/>`;
        case "table":
          return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:8px 0 18px;border:1px solid #e3e1da;border-radius:6px;font-size:14px;">${(b.rows ?? [])
            .map((r, i) => `<tr style="${i > 0 ? "border-top:1px solid #e3e1da;" : ""}"><td style="padding:9px 12px;color:#6b6b66;">${escape(r.label)}</td><td style="padding:9px 12px;text-align:right;font-weight:600;color:#141414;">${escape(r.value)}</td></tr>`)
            .join("")}</table>`;
        default:
          return "";
      }
    })
    .join("");

  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escape(opts.title)}</title></head>
<body style="margin:0;padding:0;background:#f7f6f2;font-family:Inter,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escape(opts.preheader)}</div>` : ""}
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f7f6f2;padding:24px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid #e3e1da;border-radius:10px;">
<tr><td style="padding:22px 28px;border-bottom:1px solid #e3e1da;"><span style="font-size:22px;font-weight:800;letter-spacing:-0.06em;color:#111111;">KAYEN</span></td></tr>
<tr><td style="padding:28px;">
<h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;font-weight:700;color:#111111;">${escape(opts.title)}</h1>
${opts.greeting ? `<p style="margin:0 0 14px;font-size:15px;color:#141414;">${escape(opts.greeting)}</p>` : ""}
${bodyHtml}
<p style="margin:18px 0 0;font-size:15px;color:#141414;">${escape(d.signature)}</p>
</td></tr>
<tr><td style="padding:16px 28px;border-top:1px solid #e3e1da;font-size:12px;line-height:1.5;color:#9a9a93;">${escape(d.footer)}<br/>${escape(siteConfig.url)}</td></tr>
</table></td></tr></table></body></html>`;

  const text = [opts.title, "", opts.greeting ?? "", ...opts.blocks.map((b) => (b.type === "cta" ? `${b.text} : ${b.href}` : b.type === "table" ? (b.rows ?? []).map((r) => `${r.label} : ${r.value}`).join("\n") : (b.text ?? ""))), "", d.signature, "", d.footer].filter((l) => l !== undefined).join("\n");
  return { html, text };
}
