import type { NostrEvent, NostrFilter } from '@nostrify/nostrify';
import { useQuery } from '@tanstack/react-query';

import { SEARCH_RELAYS } from '@/lib/appRelays';
import { getSearchRelay } from '@/lib/searchRelays';

export type NostrSearchKind = 'all' | 'notes' | 'profiles' | 'articles' | 'files';

function kindsForFilter(kind: NostrSearchKind): number[] | undefined {
  switch (kind) {
    case 'notes': return [1];
    case 'profiles': return [0];
    case 'articles': return [30023];
    case 'files': return [1063];
    case 'all':
    default:
      return [0, 1, 1063, 30023];
  }
}

interface UseNostrSearchOptions {
  query: string;
  kind?: NostrSearchKind;
  limit?: number;
  enabled?: boolean;
}

export function useNostrSearch({ query, kind = 'all', limit = 40, enabled = true }: UseNostrSearchOptions) {
  return useQuery<NostrEvent[]>({
    queryKey: ['nostr-search', query, kind, limit],
    queryFn: async ({ signal }) => {
      if (!query.trim()) return [];

      const filter: NostrFilter & { search?: string } = {
        search: query.trim(),
        limit,
      };

      const kinds = kindsForFilter(kind);
      if (kinds) {
        filter.kinds = kinds;
      }

      // Query all search relays in parallel and merge/dedupe results.
      const results = await Promise.allSettled(
        SEARCH_RELAYS.map(async (url) => {
          const relay = getSearchRelay(url);
          return relay.query([filter], { signal: AbortSignal.any([signal, AbortSignal.timeout(8000)]) });
        }),
      );

      const eventMap = new Map<string, NostrEvent>();
      for (const result of results) {
        if (result.status === 'fulfilled') {
          for (const event of result.value) {
            if (!eventMap.has(event.id)) {
              eventMap.set(event.id, event);
            }
          }
        }
      }

      // NIP-50 says results should be sorted by relevance, but since we merge
      // from multiple relays we fall back to recency within the merged set.
      return [...eventMap.values()].sort((a, b) => b.created_at - a.created_at);
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 30_000,
    retry: 1,
    placeholderData: (prev) => prev,
  });
}
