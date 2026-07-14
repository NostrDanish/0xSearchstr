/**
 * Ahmia.fi search client for Tor hidden service results.
 *
 * Ahmia is the established, policy-compliant .onion search engine.
 * It has a clearnet gateway at ahmia.fi that we can query from the browser.
 * Ahmia already enforces content policy (filters CSAM, etc.) so we
 * inherit their filtering by using their index.
 *
 * For I2P, there's no equivalent public API, so we provide directory
 * links as fallback.
 */

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

export interface AhmiaResult {
  title: string;
  url: string;       // The .onion URL
  onion: string;     // The .onion domain
  description: string;
  updatedAt?: string;
}

/**
 * Search Ahmia.fi for .onion hidden service results.
 *
 * Ahmia returns HTML (not JSON API), so we scrape the search results page.
 * This is fragile but Ahmia doesn't provide a public JSON API.
 */
export async function searchAhmia(
  query: string,
  options: { signal?: AbortSignal } = {},
): Promise<AhmiaResult[]> {
  const targetUrl = `https://ahmia.fi/search/?q=${encodeURIComponent(query)}`;
  const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;

  try {
    const res = await fetch(proxiedUrl, {
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(12000)])
        : AbortSignal.timeout(12000),
      headers: { 'Accept': 'text/html' },
    });

    if (!res.ok) return [];

    const html = await res.text();
    return parseAhmiaResults(html);
  } catch {
    return [];
  }
}

/**
 * Parse Ahmia search results from HTML.
 * Ahmia uses a consistent structure: each result is in a <li> with class "result".
 */
function parseAhmiaResults(html: string): AhmiaResult[] {
  const results: AhmiaResult[] = [];

  // Match result blocks. Ahmia wraps each result in <li class="result">
  // with an <h4> for the title/link and <p> for the description.
  // We use regex because we can't use a DOM parser in this context easily.
  const resultPattern = /<li[^>]*class="[^"]*result[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let match;

  while ((match = resultPattern.exec(html)) !== null) {
    const block = match[1];

    // Extract the link and title from the <h4><a> element.
    const linkMatch = block.match(/<h4>\s*<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;

    const rawUrl = linkMatch[1];
    const title = stripTags(linkMatch[2]).trim();

    // Extract description from a <p> or <span class="description">.
    const descMatch = block.match(/<(?:p|span)[^>]*class="[^"]*(?:description|desc)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|span)>/i);
    const description = descMatch ? stripTags(descMatch[1]).trim() : '';

    // Extract the .onion domain.
    const onionMatch = block.match(/([a-z2-7]{16,56}\.onion)/i);
    const onion = onionMatch ? onionMatch[1] : '';

    // Resolve the URL — Ahmia sometimes wraps URLs through their redirect.
    let url = rawUrl;
    const redirectMatch = rawUrl.match(/redirect_url=([^&]+)/);
    if (redirectMatch) {
      try {
        url = decodeURIComponent(redirectMatch[1]);
      } catch {
        url = rawUrl;
      }
    }

    // Only include .onion results.
    if (!url.includes('.onion') && !onion) continue;

    results.push({
      title: title || onion || 'Untitled',
      url: url.startsWith('http') ? url : `http://${onion}`,
      onion,
      description,
    });
  }

  return results;
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
}
