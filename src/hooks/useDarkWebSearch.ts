import { useQuery } from '@tanstack/react-query';
import { searchAhmia, type AhmiaResult } from '@/lib/ahmia';

export type { AhmiaResult };

interface UseDarkWebSearchOptions {
  query: string;
  enabled?: boolean;
}

/**
 * Search Tor hidden services via Ahmia.fi.
 * Ahmia already enforces content policy (CSAM filtering, etc.).
 */
export function useDarkWebSearch({ query, enabled = true }: UseDarkWebSearchOptions) {
  return useQuery({
    queryKey: ['darkweb-search', query],
    queryFn: async ({ signal }) => {
      if (!query.trim()) return [] as AhmiaResult[];
      return searchAhmia(query.trim(), { signal });
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 60_000,
    retry: 0,
    placeholderData: (prev) => prev,
  });
}
