/**
 * Normalize practice request time strings for display:
 * - DD/MM/YYYY, HH:MM:SS - HH:MM:SS → DD/MM/YYYY, HH:MM
 * - strips seconds from the start time
 * - ISO-like timestamps → en-GB date + HH:MM (24h)
 */
export function normalizeSuggestedTimeDisplay(value) {
  if (value == null) return "";
  const s = String(value).trim();
  if (!s) return "";

  if (/^\d{4}-\d{2}-\d{2}/.test(s) || s.includes("T")) {
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) {
      const date = d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      const time = d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return `${date}, ${time}`;
    }
  }

  const startOnly = s.split(/\s*-\s*/)[0].trim();
  return startOnly.replace(/(\d{1,2}:\d{2}):\d{2}/g, "$1");
}
