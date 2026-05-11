import { slugify } from "./slugify";

function stripHtml(html) {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeBasicEntities(str) {
  return str
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getExistingId(attrs) {
  if (!attrs) return null;
  const m = /\bid\s*=\s*(["'])([^"']*)\1/i.exec(attrs);
  const v = m?.[2]?.trim();
  return v || null;
}

/**
 * @param {string} innerHtml
 * @param {string | null} existingId
 * @param {Set<string>} usedIds
 * @returns {string}
 */
function assignHeadingId(innerHtml, existingId, usedIds) {
  if (existingId) {
    usedIds.add(existingId);
    return existingId;
  }
  const plain = decodeBasicEntities(stripHtml(innerHtml));
  let base = slugify(plain) || "section";
  let id = base;
  let n = 2;
  while (usedIds.has(id)) {
    id = `${base}-${n}`;
    n += 1;
  }
  usedIds.add(id);
  return id;
}

const HEADING_RE = /<(h[23])((?:\s[^>]*)?)>([\s\S]*?)<\/\1>/gi;

/**
 * @param {string} htmlString
 * @returns {Array<{ id: string; text: string; level: number }>}
 */
export function extractHeadings(htmlString) {
  if (!htmlString || typeof htmlString !== "string") return [];

  const usedIds = new Set();
  const headings = [];
  let m;
  HEADING_RE.lastIndex = 0;
  while ((m = HEADING_RE.exec(htmlString)) !== null) {
    const tag = m[1].toLowerCase();
    const level = tag === "h2" ? 2 : 3;
    const attrs = m[2] || "";
    const inner = m[3];
    const existingId = getExistingId(attrs);
    const text = decodeBasicEntities(stripHtml(inner));
    const id = assignHeadingId(inner, existingId, usedIds);
    headings.push({ id, text, level });
  }

  return headings.length < 2 ? [] : headings;
}

/**
 * @param {string} htmlString
 * @returns {string}
 */
export function injectHeadingIds(htmlString) {
  if (!htmlString || typeof htmlString !== "string") return "";

  const usedIds = new Set();
  HEADING_RE.lastIndex = 0;
  return htmlString.replace(HEADING_RE, (full, tag, attrs, inner) => {
    const attrsStr = attrs || "";
    const existingId = getExistingId(attrsStr);
    if (existingId) {
      usedIds.add(existingId);
      return full;
    }
    const id = assignHeadingId(inner, null, usedIds);
    const tagLower = tag.toLowerCase();
    const open = attrsStr.trim()
      ? `<${tagLower} id="${id}"${attrsStr}>`
      : `<${tagLower} id="${id}">`;
    return `${open}${inner}</${tagLower}>`;
  });
}
