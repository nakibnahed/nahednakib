/**
 * Generate a URL-friendly slug from a string
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The slug
 */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Generate a unique slug by appending a number if needed
 * @param {string} text - The text to convert to a slug
 * @param {Array} existingSlugs - Array of existing slugs to check against
 * @returns {string} - The unique slug
 */
export function generateUniqueSlug(text, existingSlugs = []) {
  let slug = slugify(text);
  let uniqueSlug = slug;
  let counter = 1;

  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }

  return uniqueSlug;
}
