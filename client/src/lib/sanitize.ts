/**
 * Simple HTML sanitizer - strips all HTML tags, trims whitespace, enforces max length.
 * No external dependency (no DOMPurify).
 */
export function sanitizeMessage(content: string, maxLength: number = 500): string {
  // Strip HTML tags
  let sanitized = content.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  sanitized = sanitized
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/');

  // Re-strip any tags that may have been created after entity decoding
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Trim whitespace
  sanitized = sanitized.trim();

  // Collapse multiple whitespace into single space
  sanitized = sanitized.replace(/\s+/g, ' ');

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength);
  }

  return sanitized;
}
