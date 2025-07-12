/**
 * Calculate reading time for content
 * @param {string} content - The content to calculate reading time for
 * @param {number} wordsPerMinute - Reading speed (default: 200)
 * @returns {number} Reading time in minutes
 */
export function calculateReadTime(content, wordsPerMinute = 200) {
  if (!content || typeof content !== "string") {
    return 1; // Default to 1 minute for empty content
  }

  // Remove HTML tags and count words
  const cleanContent = content.replace(/<[^>]*>/g, "");
  const wordCount = cleanContent
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  // Calculate reading time and ensure minimum of 1 minute
  const readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

  return readTime;
}

/**
 * Format read time for display
 * @param {number} minutes - Reading time in minutes
 * @returns {string} Formatted read time string
 */
export function formatReadTime(minutes) {
  if (minutes === 1) {
    return "1 min read";
  }
  return `${minutes} min read`;
}
