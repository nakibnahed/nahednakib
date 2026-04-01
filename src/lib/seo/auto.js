/**
 * Deterministic SEO text helpers (no network / AI).
 */

export function stripHtml(html) {
  if (!html || typeof html !== "string") return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncate(text, max = 160) {
  if (!text || typeof text !== "string") return "";
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

/**
 * Title segment for `title.template` (no brand suffix).
 */
export function buildTitleSegment({ title, metaTitle, focusKeyword }) {
  if (metaTitle?.trim()) {
    return truncate(metaTitle.trim(), 70);
  }
  const t = (title || "").trim() || "Untitled";
  const fk = focusKeyword?.trim();
  if (fk && !t.toLowerCase().includes(fk.toLowerCase())) {
    return truncate(`${t} — ${fk}`, 70);
  }
  return truncate(t, 70);
}

export function buildMetaDescription({
  metaDescription,
  excerpt,
  htmlContent,
  fallback,
}) {
  if (metaDescription?.trim()) {
    return truncate(metaDescription.trim(), 160);
  }
  if (excerpt?.trim()) {
    return truncate(stripHtml(excerpt), 160);
  }
  const fromContent = stripHtml(htmlContent || "");
  if (fromContent) {
    return truncate(fromContent, 160);
  }
  return fallback ? truncate(fallback, 160) : "";
}

/**
 * Merge tag strings with optional SEO keyword array for structured data.
 */
/** Comma / newline separated admin input → Postgres text[] or null */
export function seoKeywordsFromInput(str) {
  if (!str || typeof str !== "string" || !str.trim()) return null;
  const arr = str
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return arr.length ? arr : null;
}

export function seoKeywordsToInput(arr) {
  if (!Array.isArray(arr) || !arr.length) return "";
  return arr.join(", ");
}

export function mergeKeywordSignals(tagString, seoKeywords) {
  const fromTags =
    tagString?.trim()
      ? tagString
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  const fromSeo = Array.isArray(seoKeywords)
    ? seoKeywords.map((s) => String(s).trim()).filter(Boolean)
    : [];
  const seen = new Set();
  const out = [];
  for (const k of [...fromSeo, ...fromTags]) {
    const lower = k.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      out.push(k);
    }
  }
  return out;
}
