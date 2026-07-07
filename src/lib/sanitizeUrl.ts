/**
 * Sanitize a URL to only allow safe protocols.
 * Returns empty string for dangerous URLs.
 */
export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
    return '';
  } catch {
    return '';
  }
}
