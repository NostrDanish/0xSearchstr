import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Search, Zap, Globe, Layers, Database, ArrowRight } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { SearchBar } from '@/components/SearchBar';
import { SourceTabs, type SearchSource } from '@/components/SourceTabs';
import { KindFilter } from '@/components/KindFilter';
import { NostrResultCard } from '@/components/NostrResultCard';
import { WebResultCard } from '@/components/WebResultCard';
import { BrowserFallback } from '@/components/BrowserFallback';
import { SearchSkeleton } from '@/components/SearchSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useNostrSearch, type NostrSearchKind } from '@/hooks/useNostrSearch';
import { useWebSearch } from '@/hooks/useWebSearch';
import { cn } from '@/lib/utils';

/**
 * The minimum number of Nostr results we consider "enough" to skip web search.
 * If Nostr returns fewer results than this, we also fire a web search.
 */
const NOSTR_ENOUGH_THRESHOLD = 8;

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialSource = (searchParams.get('source') as SearchSource) || 'all';

  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [source, setSource] = useState<SearchSource>(initialSource);
  const [kind, setKind] = useState<NostrSearchKind>('all');

  const hasSearched = activeQuery.length > 0;

  // ─── Nostr search (always runs when searching) ───
  const nostrSearch = useNostrSearch({
    query: activeQuery,
    kind,
    enabled: hasSearched && source !== 'web',
  });

  // ─── Web search (runs when "all" mode doesn't have enough Nostr results, or "web" mode) ───
  const nostrHasEnough = (nostrSearch.data?.length ?? 0) >= NOSTR_ENOUGH_THRESHOLD;
  const shouldSearchWeb = hasSearched && (
    source === 'web' ||
    (source === 'all' && !nostrSearch.isLoading && !nostrHasEnough)
  );

  const webSearch = useWebSearch({
    query: activeQuery,
    enabled: shouldSearchWeb,
  });

  // ─── Combined loading state ───
  const isLoading = source === 'all'
    ? nostrSearch.isLoading || (shouldSearchWeb && webSearch.isLoading)
    : source === 'nostr'
      ? nostrSearch.isLoading
      : webSearch.isLoading;

  const isFetching = nostrSearch.isFetching || webSearch.isFetching;

  // ─── Result counts for tabs ───
  const nostrCount = nostrSearch.data?.length ?? 0;
  const webCount = webSearch.data?.results?.length ?? 0;
  const counts = useMemo(() => ({
    nostr: nostrCount,
    web: webCount,
    all: nostrCount + webCount,
  }), [nostrCount, webCount]);

  // ─── No results anywhere ───
  const noResults = hasSearched && !isLoading &&
    nostrCount === 0 && webCount === 0 && !nostrSearch.isFetching && !webSearch.isFetching;

  useSeoMeta({
    title: hasSearched ? `${activeQuery} - 0xSearchstr` : '0xSearchstr - Decentralized Search Aggregator',
    description: 'Search Nostr first, enriched with privacy-respecting web results. No backend, no crawler, no tracking.',
  });

  const handleSubmit = useCallback((value: string) => {
    setActiveQuery(value);
    setSearchParams((prev) => {
      prev.set('q', value);
      prev.set('source', source);
      return prev;
    });
  }, [source, setSearchParams]);

  const handleSourceChange = useCallback((newSource: SearchSource) => {
    setSource(newSource);
    if (activeQuery) {
      setSearchParams((prev) => {
        prev.set('source', newSource);
        return prev;
      });
    }
  }, [activeQuery, setSearchParams]);

  // ─── Hero mode (no search yet) ───
  if (!hasSearched) {
    return (
      <Layout minimal>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4">
          <div className="text-center mb-10 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 glow-primary-lg">
                  <Search className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-search-pulse" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-4">
              <span className="text-primary font-mono">0x</span>
              <span className="text-foreground">Searchstr</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Decentralized search aggregator. Nostr first, web when needed.
            </p>
          </div>

          <div className="w-full max-w-2xl mb-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:delay-200">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={handleSubmit}
              size="large"
              autoFocus
            />
          </div>

          <div className="mb-12 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:delay-300">
            <SourceTabs value={source} onChange={handleSourceChange} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:delay-500">
            <FeatureCard
              icon={<Zap className="w-4 h-4 text-nostr" />}
              label="Nostr First"
              description="NIP-50 relay search"
              active
            />
            <FeatureCard
              icon={<Globe className="w-4 h-4 text-clearnet" />}
              label="Web Fallback"
              description="via SearXNG"
              active
            />
            <FeatureCard
              icon={<Database className="w-4 h-4 text-primary" />}
              label="No Backend"
              description="Fully client-side"
              active
            />
            <FeatureCard
              icon={<Layers className="w-4 h-4 text-primary" />}
              label="Aggregator"
              description="Multiple sources"
              active
            />
          </div>

          {/* How it works */}
          <div className="mt-10 max-w-md text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:delay-700">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60">
              <span className="text-nostr font-medium">Nostr</span>
              <ArrowRight className="w-3 h-3" />
              <span>enough?</span>
              <ArrowRight className="w-3 h-3" />
              <span className="text-clearnet font-medium">SearXNG</span>
              <ArrowRight className="w-3 h-3" />
              <span>fallback links</span>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ─── Results mode ───
  return (
    <Layout>
      <div className="container py-6">
        <div className="max-w-2xl mb-5">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            isLoading={isFetching}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <SourceTabs value={source} onChange={handleSourceChange} counts={hasSearched ? counts : undefined} />
          {(source === 'all' || source === 'nostr') && (
            <>
              <div className="hidden sm:block w-px h-6 bg-border" />
              <KindFilter value={kind} onChange={setKind} />
            </>
          )}
        </div>

        <div className="max-w-2xl">
          {/* Loading state */}
          {isLoading && nostrCount === 0 && webCount === 0 ? (
            <SearchSkeleton />
          ) : noResults ? (
            /* No results anywhere */
            <>
              <Card className="border-dashed mb-4">
                <CardContent className="py-10 px-8 text-center">
                  <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    No results found for &ldquo;{activeQuery}&rdquo; on Nostr or the web.
                  </p>
                </CardContent>
              </Card>
              <BrowserFallback query={activeQuery} />
            </>
          ) : (
            /* Results */
            <div className="space-y-6">
              {/* Nostr results section */}
              {(source === 'all' || source === 'nostr') && nostrCount > 0 && (
                <div>
                  {source === 'all' && (
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="w-3.5 h-3.5 text-nostr" />
                      <span className="text-sm font-medium text-nostr">Nostr</span>
                      <span className="text-xs text-muted-foreground">{nostrCount} result{nostrCount !== 1 ? 's' : ''}</span>
                      {nostrSearch.isFetching && <span className="text-xs text-primary animate-search-pulse">updating...</span>}
                    </div>
                  )}
                  {source === 'nostr' && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {nostrCount} result{nostrCount !== 1 ? 's' : ''} from Nostr relays
                      {nostrSearch.isFetching && <span className="ml-2 text-primary animate-search-pulse">Updating...</span>}
                    </p>
                  )}
                  <div className="space-y-3">
                    {(nostrSearch.data ?? []).map((event) => (
                      <NostrResultCard key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              )}

              {/* Web results section */}
              {(source === 'all' || source === 'web') && webCount > 0 && (
                <div>
                  {source === 'all' && (
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-3.5 h-3.5 text-clearnet" />
                      <span className="text-sm font-medium text-clearnet">Web</span>
                      <span className="text-xs text-muted-foreground">{webCount} result{webCount !== 1 ? 's' : ''} via SearXNG</span>
                    </div>
                  )}
                  {source === 'web' && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {webCount} result{webCount !== 1 ? 's' : ''} from SearXNG
                      {webSearch.isFetching && <span className="ml-2 text-primary animate-search-pulse">Updating...</span>}
                    </p>
                  )}
                  <div className="space-y-3">
                    {(webSearch.data?.results ?? []).map((result, i) => (
                      <WebResultCard key={`${result.url}-${i}`} result={result} />
                    ))}
                  </div>
                </div>
              )}

              {/* Web search loading indicator when waiting for SearXNG fallback */}
              {source === 'all' && shouldSearchWeb && webSearch.isLoading && nostrCount > 0 && (
                <div className="flex items-center gap-2 py-4">
                  <Globe className="w-3.5 h-3.5 text-clearnet animate-search-pulse" />
                  <span className="text-sm text-muted-foreground">Searching the web via SearXNG...</span>
                </div>
              )}

              {/* Suggestions from SearXNG */}
              {webSearch.data?.suggestions && webSearch.data.suggestions.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <span className="text-xs text-muted-foreground">Related:</span>
                  {webSearch.data.suggestions.slice(0, 5).map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setQuery(suggestion);
                        handleSubmit(suggestion);
                      }}
                      className="text-xs px-2 py-1 rounded-md border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}

              {/* Browser fallback when we have some results but user might want more */}
              {nostrCount + webCount > 0 && nostrCount + webCount < 5 && (
                <BrowserFallback query={activeQuery} className="mt-4" />
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

function FeatureCard({ icon, label, description, active }: {
  icon: React.ReactNode;
  label: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div className={cn(
      'flex flex-col items-center gap-1.5 p-4 rounded-xl border text-center transition-colors',
      active
        ? 'border-primary/20 bg-primary/5'
        : 'border-border/50 bg-card/50',
    )}>
      {icon}
      <span className="text-sm font-medium">{label}</span>
      <span className={cn(
        'text-xs',
        active ? 'text-primary/70' : 'text-muted-foreground/60',
      )}>{description}</span>
    </div>
  );
}

export default Index;
