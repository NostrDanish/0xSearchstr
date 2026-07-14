/**
 * SearXNG client with instance pool and automatic failover.
 *
 * Queries public SearXNG instances for web results. If one instance
 * fails or times out, automatically tries the next one.
 *
 * All requests go through a CORS proxy since SearXNG instances
 * don't set CORS headers for browser-based API access.
 */

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

/** Public SearXNG instances with JSON API support. */
const DEFAULT_INSTANCES = [
  'https://search.ononoki.org',
  'https://searx.tiekoetter.com',
  'https://search.bus-hit.me',
  'https://searxng.site',
  'https://search.sapti.me',
  'https://etsi.me',
];

export interface SearXNGResult {
  title: string;
  url: string;
  content: string;
  engine: string;
  category: string;
  thumbnail?: string;
  publishedDate?: string;
}

export interface SearXNGResponse {
  query: string;
  results: SearXNGResult[];
  number_of_results: number;
  suggestions: string[];
  infoboxes: Array<{ infobox: string; content: string; urls: Array<{ title: string; url: string }> }>;
}

/** Get the list of SearXNG instances. */
export function getInstances(): string[] {
  return [...DEFAULT_INSTANCES];
}

/**
 * Query a SearXNG instance for web results.
 * Returns null on failure (caller should try next instance).
 */
async function queryInstance(
  instanceUrl: string,
  query: string,
  options: { signal?: AbortSignal; categories?: string; pageno?: number } = {},
): Promise<SearXNGResponse | null> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    categories: options.categories || 'general',
    language: 'en',
    pageno: String(options.pageno || 1),
  });

  const targetUrl = `${instanceUrl}/search?${params.toString()}`;
  const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;

  try {
    const res = await fetch(proxiedUrl, {
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) return null;

    const data = await res.json() as SearXNGResponse;

    // Validate the response structure.
    if (!data.results || !Array.isArray(data.results)) return null;

    return data;
  } catch {
    return null;
  }
}

/**
 * Search using SearXNG with automatic instance failover.
 * Tries each instance in order until one succeeds.
 */
export async function searchSearXNG(
  query: string,
  options: { signal?: AbortSignal; categories?: string } = {},
): Promise<SearXNGResponse> {
  const instances = getInstances();

  for (const instance of instances) {
    const result = await queryInstance(instance, query, options);
    if (result && result.results.length > 0) {
      return result;
    }
  }

  // All instances failed — return empty response.
  return {
    query,
    results: [],
    number_of_results: 0,
    suggestions: [],
    infoboxes: [],
  };
}
