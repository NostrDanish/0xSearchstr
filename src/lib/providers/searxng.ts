/**
 * SearXNG meta-search provider — queries public SearXNG instances with failover.
 *
 * Aggregates web results from DuckDuckGo, Brave, Wikipedia, and dozens
 * of other engines. Automatic failover across a pool of public instances.
 */
import type { SearchProvider, SearchOptions, ProviderSearchResponse, SearchResult } from './types';

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

/** Public SearXNG instances with JSON API support. */
const INSTANCES = [
  'https://search.ononoki.org',
  'https://searx.tiekoetter.com',
  'https://search.bus-hit.me',
  'https://searxng.site',
  'https://search.sapti.me',
  'https://etsi.me',
];

interface RawSearXNGResult {
  title: string;
  url: string;
  content: string;
  engine: string;
  category: string;
  thumbnail?: string;
  publishedDate?: string;
}

interface RawSearXNGResponse {
  results: RawSearXNGResult[];
  suggestions: string[];
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

function toSearchResult(r: RawSearXNGResult, index: number): SearchResult {
  return {
    id: `searxng-${r.url}`,
    title: r.title || extractDomain(r.url),
    url: r.url,
    snippet: stripHtml(r.content || ''),
    source: 'web',
    provider: 'searxng',
    domain: extractDomain(r.url),
    engine: r.engine || undefined,
    thumbnail: r.thumbnail || undefined,
    timestamp: r.publishedDate ? Math.floor(new Date(r.publishedDate).getTime() / 1000) || undefined : undefined,
    score: 80 - index * 0.5, // Web results scored slightly below Nostr
  };
}

async function queryInstance(
  instanceUrl: string,
  query: string,
  signal?: AbortSignal,
): Promise<RawSearXNGResponse | null> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    categories: 'general',
    language: 'en',
    pageno: '1',
  });

  const target = `${instanceUrl}/search?${params.toString()}`;
  const proxied = `${CORS_PROXY}${encodeURIComponent(target)}`;

  try {
    const res = await fetch(proxied, {
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
        : AbortSignal.timeout(10000),
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json() as RawSearXNGResponse;
    if (!data.results || !Array.isArray(data.results)) return null;
    return data;
  } catch {
    return null;
  }
}

export const searxngProvider: SearchProvider = {
  id: 'searxng',
  name: 'SearXNG',
  source: 'web',

  async search({ query, signal }: SearchOptions): Promise<ProviderSearchResponse> {
    if (!query.trim()) return { results: [] };

    for (const instance of INSTANCES) {
      const data = await queryInstance(instance, query.trim(), signal);
      if (data && data.results.length > 0) {
        return {
          results: data.results.map(toSearchResult),
          suggestions: data.suggestions ?? [],
        };
      }
    }

    return { results: [], suggestions: [] };
  },
};
