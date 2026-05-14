function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const ENTITY_MAP = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&apos;": "'",
  "&rsquo;": "’",
  "&lsquo;": "‘",
  "&rdquo;": "”",
  "&ldquo;": "“",
  "&ndash;": "–",
  "&mdash;": "—",
  "&hellip;": "…",
};

function decodeEntities(str) {
  return str
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&[a-z]+;/gi, (m) => ENTITY_MAP[m.toLowerCase()] ?? m);
}

/**
 * Scan blog HTML for <h2>/<h3> tags, ensure each has a unique `id`,
 * and return both the rewritten HTML and a flat list of headings the TOC needs.
 */
export function extractHeadings(html) {
  if (!html || typeof html !== "string") {
    return { html: html || "", headings: [] };
  }

  const headings = [];
  const used = new Set();

  const rewritten = html.replace(
    /<h([23])([^>]*)>([\s\S]*?)<\/h\1>/gi,
    (match, levelStr, attrs, inner) => {
      const level = parseInt(levelStr, 10);
      const text = decodeEntities(inner.replace(/<[^>]*>/g, ""))
        .replace(/\s+/g, " ")
        .trim();
      if (!text) return match;

      const existingIdMatch = attrs.match(/\bid\s*=\s*["']([^"']+)["']/i);
      let baseId = existingIdMatch
        ? existingIdMatch[1]
        : slugify(text) || `heading-${headings.length + 1}`;

      let id = baseId;
      let counter = 2;
      while (used.has(id)) {
        id = `${baseId}-${counter++}`;
      }
      used.add(id);

      const newAttrs = existingIdMatch
        ? attrs.replace(/\bid\s*=\s*["'][^"']+["']/i, `id="${id}"`)
        : ` id="${id}"${attrs}`;

      headings.push({ id, text, level });
      return `<h${level}${newAttrs}>${inner}</h${level}>`;
    },
  );

  return { html: rewritten, headings };
}
