/**
 * Auto-indexing hook — publishes search results to Nostr after each search.
 *
 * When a search completes with enough results, this hook publishes
 * a cache event (kind 30078) to Nostr under the 0xSearchstr bot account.
 * The cache grows with every search across every user.
 *
 * Publishing is fire-and-forget with deduplication:
 * - Same query won't be published more than once per session
 * - Only non-Nostr results are cached (Nostr results are already on relays)
 * - Events are addressable (d-tag), so newer caches replace older ones
 */
import { useCallback, useRef } from 'react';
import { getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { NRelay1 } from '@nostrify/nostrify';

import type { SearchResult } from '@/lib/providers/types';
import { buildCacheEvent, normalizeQuery } from '@/lib/searchIndex';

/**
 * 0xSearchstr bot nsec (hex secret key).
 * This is the bot account — it's intentionally public.
 * The bot publishes cache events that anyone can read.
 * The nsec is embedded so the indexer works without user login.
 */
const BOT_NSEC_HEX = 'e338a5ffca6405297366c1db5cd1bc432db51a26b225792917c1fb39ea8d19db';

/** Relays to publish cache events to. */
const PUBLISH_RELAYS = [
  'wss://relay.ditto.pub/',
  'wss://relay.primal.net/',
  'wss://relay.damus.io/',
];

/** Relay connection cache. */
const relayCache = new Map<string, NRelay1>();
function getRelay(url: string): NRelay1 {
  let relay = relayCache.get(url);
  if (!relay) {
    relay = new NRelay1(url);
    relayCache.set(url, relay);
  }
  return relay;
}

/**
 * Hook: auto-indexes search results to Nostr.
 * Returns a function to call after search completes.
 */
export function useSearchIndexer() {
  // Track which queries we've already indexed this session.
  const indexedRef = useRef(new Set<string>());

  const indexResults = useCallback(async (query: string, results: SearchResult[]) => {
    if (!query.trim()) return;

    const normalized = normalizeQuery(query);

    // Skip if already indexed this session.
    if (indexedRef.current.has(normalized)) return;

    // Build the cache event.
    const eventData = buildCacheEvent(query, results);
    if (!eventData) return; // Not enough results to cache.

    // Mark as indexed immediately (optimistic).
    indexedRef.current.add(normalized);

    // Sign and publish in the background (fire-and-forget).
    try {
      const secretKey = hexToBytes(BOT_NSEC_HEX);
      const pubkey = bytesToHex(getPublicKey(secretKey));

      const unsignedEvent = {
        kind: eventData.kind,
        created_at: Math.floor(Date.now() / 1000),
        tags: eventData.tags,
        content: eventData.content,
        pubkey,
      };

      const signedEvent = finalizeEvent(unsignedEvent, secretKey);

      // Publish to all relays in parallel, don't await.
      void Promise.allSettled(
        PUBLISH_RELAYS.map(async (url) => {
          const relay = getRelay(url);
          await relay.event(signedEvent);
        }),
      );
    } catch {
      // Indexing failure is non-fatal — just means this query won't be cached.
      indexedRef.current.delete(normalized);
    }
  }, []);

  return { indexResults };
}
