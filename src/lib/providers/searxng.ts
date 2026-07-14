/**
 * SearXNG meta-search provider — queries public SearXNG instances with failover.
 *
 * Aggregates web results from DuckDuckGo, Brave, Wikipedia, and dozens
 * of other engines. Races multiple instances in parallel for speed,
 * with sequential failover if needed.
 */
import type { SearchProvider, SearchOptions, ProviderSearchResponse, SearchResult } from './types';

const CORS_PROXY = 'https://proxy.shakespeare.diy/?url=';

/**
 * Public SearXNG instances with JSON API support.
 * Sourced from searx.space and manually verified.
 * Order matters: first batch is raced in parallel.
 */
const INSTANCES = [
  // Batch 1 — raced in parallel
  'https://search.ononoki.org',
  'https://baresearch.org',
  'https://etsi.me',
  'https://searxng.site',
  // Batch 2 — sequential fallback
  'https://search.bus-hit.me',
  'https://searx.tiekoetter.com',
  'https://search.sapti.me',
  'https://ooglester.com',
  'https://copp.gg',
];

/** How many instances to race in the first parallel batch. */
const PARALLEL_BATCH = 4;

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
    score: 80 - index * 0.5,
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

    const q = query.trim();

    // Phase 1: Race the first batch of instances in parallel.
    // First one to return good results wins.
    const parallelBatch = INSTANCES.slice(0, PARALLEL_BATCH);
    const raceResult = await raceForResults(parallelBatch, q, signal);
    if (raceResult) return raceResult;

    // Phase 2: Sequential fallback through remaining instances.
    const fallbackBatch = INSTANCES.slice(PARALLEL_BATCH);
    for (const instance of fallbackBatch) {
      const data = await queryInstance(instance, q, signal);
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

/**
 * Race multiple SearXNG instances in parallel.
 * Returns the first response with results, or null if all fail.
 */
async function raceForResults(
  instances: string[],
  query: string,
  signal?: AbortSignal,
): Promise<ProviderSearchResponse | null> {
  return new Promise((resolve) => {
    let resolved = false;
    let remaining = instances.length;

    for (const instance of instances) {
      queryInstance(instance, query, signal).then((data) => {
        if (resolved) return;
        remaining--;

        if (data && data.results.length > 0) {
          resolved = true;
          resolve({
            results: data.results.map(toSearchResult),
            suggestions: data.suggestions ?? [],
          });
          return;
        }

        // If this was the last one and none succeeded, resolve null.
        if (remaining === 0 && !resolved) {
          resolved = true;
          resolve(null);
        }
      }).catch(() => {
        remaining--;
        if (remaining === 0 && !resolved) {
          resolved = true;
          resolve(null);
        }
      });
    }
  });
}
