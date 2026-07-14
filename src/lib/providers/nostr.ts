/**
 * Nostr search provider — NIP-50 queries to search-capable relays.
 *
 * Searches profiles (kind 0), notes (kind 1), long-form articles (kind 30023),
 * and file metadata (kind 1063) across multiple relays, deduplicates, and
 * normalizes into SearchResult[].
 */
import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { nip19 } from 'nostr-tools';

import { SEARCH_RELAYS } from '@/lib/appRelays';
import { getSearchRelay } from '@/lib/searchRelays';
import { sanitizeUrl } from '@/lib/sanitizeUrl';
import type { SearchProvider, SearchOptions, ProviderSearchResponse, SearchResult } from './types';

/** Nostr kinds to search. */
const SEARCH_KINDS = [0, 1, 1063, 30023];

/** Convert a Nostr event into a universal SearchResult. */
function eventToSearchResult(event: NostrEvent): SearchResult {
  const nip19Id = eventToNip19(event);
  const internalUrl = `/${nip19Id}`;

  // Base result
  const result: SearchResult = {
    id: event.id,
    title: '',
    url: internalUrl,
    snippet: '',
    source: 'nostr',
    provider: 'nostr',
    timestamp: event.created_at,
    tags: event.tags.filter(([n]) => n === 't').map(([, v]) => v).slice(0, 5),
    nostrEvent: event,
    score: 100, // base score for Nostr-first priority
  };

  if (event.kind === 0) {
    // Profile
    try {
      const meta = JSON.parse(event.content) as Record<string, string>;
      result.title = meta.name || meta.display_name || npubShort(event.pubkey);
      result.snippet = meta.about || '';
      result.kind = 'Profile';
      result.author = result.title;
      result.authorAvatar = meta.picture ? sanitizeUrl(meta.picture) : undefined;
      result.domain = meta.nip05 || undefined;
    } catch {
      result.title = npubShort(event.pubkey);
      result.kind = 'Profile';
    }
  } else if (event.kind === 30023) {
    // Article
    result.title = getTag(event, 'title') || 'Untitled Article';
    result.snippet = getTag(event, 'summary') || truncate(event.content, 250);
    result.kind = 'Article';
    result.thumbnail = getTag(event, 'image') ? sanitizeUrl(getTag(event, 'image')!) : undefined;
  } else if (event.kind === 1063) {
    // File
    result.title = getTag(event, 'alt') || getTag(event, 'x') || 'File';
    result.snippet = event.content || getTag(event, 'summary') || '';
    result.kind = 'File';
    const fileUrl = getTag(event, 'url');
    if (fileUrl) result.domain = extractDomain(fileUrl);
  } else {
    // Note (kind 1) or other
    result.title = truncate(event.content, 120);
    result.snippet = truncate(event.content, 300);
    result.kind = event.kind === 1 ? undefined : `Kind ${event.kind}`;
  }

  return result;
}

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([n]) => n === name)?.[1];
}

function getDTag(event: NostrEvent): string | undefined {
  return event.tags.find(([n]) => n === 'd')?.[1];
}

function eventToNip19(event: NostrEvent): string {
  if (event.kind === 0) {
    return nip19.npubEncode(event.pubkey);
  }
  if (event.kind >= 30000 && event.kind < 40000) {
    const d = getDTag(event);
    if (d !== undefined) {
      return nip19.naddrEncode({ kind: event.kind, pubkey: event.pubkey, identifier: d });
    }
  }
  return nip19.neventEncode({ id: event.id, author: event.pubkey });
}

function npubShort(pubkey: string): string {
  const npub = nip19.npubEncode(pubkey);
  return npub.slice(0, 12) + '...' + npub.slice(-4);
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  const t = text.slice(0, max);
  const last = t.lastIndexOf(' ');
  return (last > max * 0.7 ? t.slice(0, last) : t) + '...';
}

function extractDomain(url: string): string {
  try { return new URL(url).hostname; } catch { return ''; }
}

/** Nostr search provider. */
export const nostrProvider: SearchProvider = {
  id: 'nostr',
  name: 'Nostr',
  source: 'nostr',

  async search({ query, signal, limit = 40 }: SearchOptions): Promise<ProviderSearchResponse> {
    if (!query.trim()) return { results: [] };

    const filter: NostrFilter & { search?: string } = {
      search: query.trim(),
      kinds: SEARCH_KINDS,
      limit,
    };

    // Query all search relays in parallel and merge/dedupe.
    const settled = await Promise.allSettled(
      SEARCH_RELAYS.map(async (url) => {
        const relay = getSearchRelay(url);
        return relay.query([filter], {
          signal: AbortSignal.any([signal ?? AbortSignal.timeout(15000), AbortSignal.timeout(8000)]),
        });
      }),
    );

    const eventMap = new Map<string, NostrEvent>();
    for (const r of settled) {
      if (r.status === 'fulfilled') {
        for (const ev of r.value) {
          if (!eventMap.has(ev.id)) eventMap.set(ev.id, ev);
        }
      }
    }

    // Sort by recency (NIP-50 relay relevance doesn't survive cross-relay merge).
    const events = [...eventMap.values()].sort((a, b) => b.created_at - a.created_at);
    const results = events.map(eventToSearchResult);

    return { results };
  },
};
