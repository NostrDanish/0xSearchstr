/**
 * Provider registry — central catalog of all search providers.
 *
 * Add a new provider:
 *   1. Create `src/lib/providers/my-provider.ts` implementing `SearchProvider`
 *   2. Import it here and add to the `ALL_PROVIDERS` array
 *   3. Done — the orchestrator picks it up automatically
 */
import type { SearchProvider, SearchSource } from './types';
import { nostrProvider } from './nostr';
import { searxngProvider } from './searxng';
import { duckduckgoProvider } from './duckduckgo';
import { torProvider } from './tor';
import { wikipediaProvider } from './wikipedia';
import { hackerNewsProvider } from './hacker-news';
import { stackOverflowProvider } from './stackoverflow';

/** All registered search providers, in priority order. */
export const ALL_PROVIDERS: SearchProvider[] = [
  nostrProvider,
  searxngProvider,
  duckduckgoProvider,
  wikipediaProvider,
  hackerNewsProvider,
  stackOverflowProvider,
  torProvider,
];

/** Get providers that contribute to a given source tab. */
export function getProvidersForSource(source: SearchSource | 'all'): SearchProvider[] {
  if (source === 'all') return ALL_PROVIDERS;
  return ALL_PROVIDERS.filter((p) => p.source === source);
}

/** Get a provider by ID. */
export function getProvider(id: string): SearchProvider | undefined {
  return ALL_PROVIDERS.find((p) => p.id === id);
}

/** All unique source categories from registered providers. */
export function getAvailableSources(): SearchSource[] {
  const sources = new Set<SearchSource>();
  for (const p of ALL_PROVIDERS) sources.add(p.source);
  return [...sources];
}
