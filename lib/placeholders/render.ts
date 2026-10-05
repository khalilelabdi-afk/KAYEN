import { pictograms } from "./pictograms";

/**
 * Rendu d'un visuel provisoire cohérent avec la charte KAYEN :
 * fond chaud, pictogramme au trait, légende discrète. Aucun gris cassé.
 */
export const tones: Record<string, { bg: string; ink: string; accent: string }> = {
  sand: { bg: "#EDE7DA", ink: "#2B2A26", accent: "#C9B99A" },
  stone: { bg: "#E6E3DC", ink: "#2B2A26", accent: "#BDB8AD" },
  sage: { bg: "#DFE6DC", ink: "#26302A", accent: "#A9BBA6" },
  clay: { bg: "#EADDD3", ink: "#2E2724", accent: "#C8A897" },
  mist: { bg: "#E2E6E7", ink: "#262C2E", accent: "#AEB9BC" },
  olive: { bg: "#E3E5D4", ink: "#2A2C22", accent: "#B6B894" },
  linen: { bg: "#F0EBE1", ink: "#2B2A26", accent: "#D2C8B4" },
  slate: { bg: "#DDDFE4", ink: "#24262B", accent: "#A6ABB8" },
};

export interface PlaceholderOptions {
  tone?: string;
  pictogram?: string;
  label?: string;
  /** 0 = vue principale, 1 = vue détail (zoom), 2 = vue conditionnement (multiples) */
  variant?: 0 | 1 | 2;
  width?: number;
  height?: number;
  /** Taille du pictogramme relative à la hauteur (0.3–0.6). */
  scale?: number;
  /** Afficher la légende texte (SKU) en bas du visuel. */
  showLabel?: boolean;
}

function escape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function renderPlaceholderSvg(opts: PlaceholderOptions = {}): string {
  const tone = tones[opts.tone ?? "sand"] ?? tones.sand;
  const icon = pictograms[opts.pictogram ?? "generic"] ?? pictograms.generic;
  const w = opts.width ?? 1200;
  const h = opts.height ?? 1200;
  const variant = opts.variant ?? 0;
  const scale = opts.scale ?? 0.42;
  const min = Math.min(w, h);
  const pad = Math.round(min * 0.06);
  const label = opts.label ? escape(opts.label) : "";
  const labelUpper = opts.label ? escape(opts.label.toUpperCase()) : "";
  const fontSize = Math.max(14, Math.round(min * 0.028));

  let art = "";
  if (variant === 1) {
    const size = min * 0.78;
    const x = w / 2 - size * 0.35;
    const y = h / 2 - size * 0.42;
    art = `<g transform="translate(${x} ${y}) scale(${size / 64})" fill="none" stroke="${tone.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity="0.82">${icon}</g>`;
  } else if (variant === 2) {
    const size = min * 0.24;
    const gap = size * 0.18;
    const totalW = size * 3 + gap * 2;
    const x0 = (w - totalW) / 2;
    const y0 = (h - (size * 2 + gap)) / 2;
    const cells: string[] = [];
    for (let r = 0; r < 2; r++)
      for (let c = 0; c < 3; c++) {
        const x = x0 + c * (size + gap);
        const y = y0 + r * (size + gap);
        cells.push(`<g transform="translate(${x} ${y}) scale(${size / 64})" fill="none" stroke="${tone.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="${r === 0 ? 0.8 : 0.5}">${icon}</g>`);
      }
    art = cells.join("");
  } else {
    const size = min * scale;
    const x = (w - size) / 2;
    const y = (h - size) / 2 - min * 0.02;
    art = `<g transform="translate(${x} ${y}) scale(${size / 64})" fill="none" stroke="${tone.ink}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.85">${icon}</g>`;
  }

  const plinth = variant === 0 ? `<ellipse cx="${w / 2}" cy="${h / 2 + min * scale * 0.56}" rx="${min * scale * 0.62}" ry="${min * 0.018}" fill="${tone.accent}" opacity="0.45"/>` : "";
  const labelEl = label && opts.showLabel !== false
    ? `<text x="${pad}" y="${h - pad}" font-family="Inter, system-ui, sans-serif" font-size="${fontSize}" font-weight="600" letter-spacing="0.08em" fill="${tone.ink}" opacity="0.55">${labelUpper}</text>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${label}">
<rect width="${w}" height="${h}" fill="${tone.bg}"/>
<rect x="${pad / 2}" y="${pad / 2}" width="${w - pad}" height="${h - pad}" fill="none" stroke="${tone.accent}" stroke-opacity="0.55" stroke-width="2" rx="${Math.round(min * 0.012)}"/>
${plinth}${art}${labelEl}
</svg>`;
}
