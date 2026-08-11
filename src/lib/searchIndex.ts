/**
 * 0xSearchstr legacy query cache — READ-ONLY protocol remnants.
 * (federated — shared with 0xPresearchstr and compatible forks)
 *
 * ─── Status: FROZEN LEGACY (SIP-01 §17) ─────────────────────────────
 * New document indexing uses the Search Index Protocol (kind 39697,
 * docs/SEARCH_INDEX_PROTOCOL.md). This kind 30078 query→results cache is
 * legacy data: this client READS it for backward compatibility (cache hits
 * from 0xPresearchstr and older deployments) but no longer writes it.
 *
 * Historical context: each unique search query was an addressable event
 * (kind 30078) with the d-tag set to a normalized query, published under
 * trusted indexer bot accounts (autosigner worker, then an embedded key).
 * Both write paths have been removed — the only signer in this codebase is
 * the per-device indexing identity (src/lib/indexerIdentity.ts).
 *
 * Readers trust ONLY events signed by keys in INDEXER_PUBKEYS — filtering
 * by authors prevents cache poisoning from arbitrary kind 30078 writers.
 *
 * Legacy event structure (for reference):
 *   kind: 30078 (application-specific data)
 *   d: "0xsearchstr:cache:<normalized-query>"
 *   content: JSON array of cached SearchResult objects
 *   tags:
 *     ["d", "0xsearchstr:cache:<normalized-query>"]
 *     ["t", "0xsearchstr"]
 *     ["t", "search-cache"]
 *     ["query", "<original query>"]
 *     ["cached_at", "<unix timestamp>"]
 *     ["result_count", "<number>"]
 *     ["alt", "Community search index cache for: <query>"]
 */

import type { SearchResult } from '@/lib/providers/types';

/** 0xSearchstr bot pubkey (hex) — historical indexer, trusted for reads. */
export const SEARCHSTR_INDEX_PUBKEY = '12ad55ad1fdb918f5314c9e9a5cd135be9b746e6eee15fd871df131a5677d199';

/** 0xPresearchstr bot pubkey (hex) — the federated sister app. */
export const PRESEARCHSTR_INDEX_PUBKEY = 'e34726ccb624f4bb6aebabdfd9a41f5e160ca97ba2ea13fad8f8ff29a7f84bca';

/**
 * Trusted indexer pubkeys. Cache events are only read from these authors.
 * Both apps published with the exact same schema, so their events are
 * interchangeable — this is what made the cache federated.
 */
export const INDEXER_PUBKEYS: string[] = [
  SEARCHSTR_INDEX_PUBKEY,
  PRESEARCHSTR_INDEX_PUBKEY,
];

/** The kind used for cache events. */
export const INDEX_KIND = 30078;

/** Max age of cache entries before they're considered stale (24 hours). */
export const CACHE_MAX_AGE_SECONDS = 86400;

/** Normalize a query for use as a d-tag key. */
export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')      // collapse whitespace
    .replace(/[^\w\s-]/g, ''); // strip punctuation
}

/** Legacy cached-result shape (Nostr-specific fields were stripped before caching). */
interface CachedResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  provider: string;
  timestamp?: number;
  author?: string;
  authorAvatar?: string;
  domain?: string;
  thumbnail?: string;
  kind?: string;
  engine?: string;
  tags?: string[];
}

/** Convert cached data back to SearchResult with cache scores. */
export function fromCachedResult(r: CachedResult): SearchResult {
  return {
    ...r,
    source: r.source as SearchResult['source'],
    score: 90, // Cached results score between Nostr (100) and web (80)
  };
}

/**
 * Parse cached results from a kind 30078 event.
 * Returns null if the cache is stale or malformed.
 */
export function parseCacheEvent(event: { content: string; tags: string[][]; created_at: number }): {
  query: string;
  results: SearchResult[];
  cachedAt: number;
} | null {
  // Check staleness.
  const now = Math.floor(Date.now() / 1000);
  const cachedAtTag = event.tags.find(([n]) => n === 'cached_at')?.[1];
  const cachedAt = cachedAtTag ? parseInt(cachedAtTag, 10) : event.created_at;

  if (now - cachedAt > CACHE_MAX_AGE_SECONDS) return null;

  const queryTag = event.tags.find(([n]) => n === 'query')?.[1];
  if (!queryTag) return null;

  try {
    const cached = JSON.parse(event.content) as CachedResult[];
    if (!Array.isArray(cached)) return null;

    return {
      query: queryTag,
      results: cached.map(fromCachedResult),
      cachedAt,
    };
  } catch {
    return null;
  }
}
