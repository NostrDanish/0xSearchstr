import { useQuery } from '@tanstack/react-query';
import { searchSearXNG, type SearXNGResult } from '@/lib/searxng';

export type { SearXNGResult };

interface UseWebSearchOptions {
  query: string;
  enabled?: boolean;
}

/**
 * Search the web via SearXNG instances with automatic failover.
 */
export function useWebSearch({ query, enabled = true }: UseWebSearchOptions) {
  return useQuery({
    queryKey: ['web-search', query],
    queryFn: async ({ signal }) => {
      if (!query.trim()) return { results: [] as SearXNGResult[], suggestions: [] as string[] };

      const response = await searchSearXNG(query.trim(), { signal });
      return {
        results: response.results,
        suggestions: response.suggestions,
      };
    },
    enabled: enabled && query.trim().length > 0,
    staleTime: 60_000, // Cache web results for 1 minute.
    retry: 0, // Failover is handled inside searchSearXNG.
    placeholderData: (prev) => prev,
  });
}
