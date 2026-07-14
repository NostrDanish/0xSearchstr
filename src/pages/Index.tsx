import { useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Search, Zap, Globe, Shield, Network, Layers, Database, ArrowRight, ExternalLink } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { SearchBar } from '@/components/SearchBar';
import { SourceTabs, type SearchSource } from '@/components/SourceTabs';
import { KindFilter } from '@/components/KindFilter';
import { NostrResultCard } from '@/components/NostrResultCard';
import { WebResultCard } from '@/components/WebResultCard';
import { DarkWebResultCard } from '@/components/DarkWebResultCard';
import { BrowserFallback } from '@/components/BrowserFallback';
import { SearchSkeleton } from '@/components/SearchSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useNostrSearch, type NostrSearchKind } from '@/hooks/useNostrSearch';
import { useWebSearch } from '@/hooks/useWebSearch';
import { useDarkWebSearch } from '@/hooks/useDarkWebSearch';
import { cn } from '@/lib/utils';

/**
 * The minimum number of Nostr results we consider "enough" to skip web search.
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

  // ─── Nostr search ───
  const nostrSearch = useNostrSearch({
    query: activeQuery,
    kind,
    enabled: hasSearched && (source === 'all' || source === 'nostr'),
  });

  // ─── Web search (SearXNG) ───
  const nostrHasEnough = (nostrSearch.data?.length ?? 0) >= NOSTR_ENOUGH_THRESHOLD;
  const shouldSearchWeb = hasSearched && (
    source === 'web' ||
    (source === 'all' && !nostrSearch.isLoading && !nostrHasEnough)
  );

  const webSearch = useWebSearch({
    query: activeQuery,
    enabled: shouldSearchWeb,
  });

  // ─── Dark web search (Ahmia) ───
  const shouldSearchDarkWeb = hasSearched && (source === 'tor' || source === 'i2p' || source === 'all');
  const darkWebSearch = useDarkWebSearch({
    query: activeQuery,
    enabled: shouldSearchDarkWeb && source !== 'all', // Only auto-search dark web when explicitly selected
  });

  // For "all" tab, also search dark web if Nostr + web don't have enough
  const allNeedsDarkWeb = source === 'all' && !nostrSearch.isLoading && !nostrHasEnough && !webSearch.isLoading;
  const darkWebSearchAll = useDarkWebSearch({
    query: activeQuery,
    enabled: hasSearched && allNeedsDarkWeb && (webSearch.data?.results?.length ?? 0) < 5,
  });

  const activeDarkWebData = source === 'all' ? darkWebSearchAll.data : darkWebSearch.data;
  const activeDarkWebLoading = source === 'all' ? darkWebSearchAll.isLoading : darkWebSearch.isLoading;
  const activeDarkWebFetching = source === 'all' ? darkWebSearchAll.isFetching : darkWebSearch.isFetching;

  // ─── Combined states ───
  const nostrCount = nostrSearch.data?.length ?? 0;
  const webCount = webSearch.data?.results?.length ?? 0;
  const darkWebCount = activeDarkWebData?.length ?? 0;

  const isLoading = (() => {
    switch (source) {
      case 'nostr': return nostrSearch.isLoading;
      case 'web': return webSearch.isLoading;
      case 'tor':
      case 'i2p': return darkWebSearch.isLoading;
      case 'all': return nostrSearch.isLoading || (shouldSearchWeb && webSearch.isLoading);
    }
  })();

  const isFetching = nostrSearch.isFetching || webSearch.isFetching || activeDarkWebFetching;

  const counts = useMemo(() => ({
    nostr: nostrCount,
    web: webCount,
    tor: darkWebCount,
    i2p: 0, // I2P doesn't have a search API — shows directory links
    all: nostrCount + webCount + darkWebCount,
  }), [nostrCount, webCount, darkWebCount]);

  const totalResults = nostrCount + webCount + darkWebCount;
  const noResults = hasSearched && !isLoading && totalResults === 0 &&
    !nostrSearch.isFetching && !webSearch.isFetching && !activeDarkWebFetching;

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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full max-w-3xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:delay-500">
            <FeatureCard
              icon={<Zap className="w-4 h-4 text-nostr" />}
              label="Nostr"
              description="NIP-50 search"
              active
            />
            <FeatureCard
              icon={<Globe className="w-4 h-4 text-clearnet" />}
              label="Web"
              description="via SearXNG"
              active
            />
            <FeatureCard
              icon={<Shield className="w-4 h-4 text-tor" />}
              label="Tor"
              description="via Ahmia"
              active
            />
            <FeatureCard
              icon={<Network className="w-4 h-4 text-i2p" />}
              label="I2P"
              description="Directories"
              active
            />
            <FeatureCard
              icon={<Database className="w-4 h-4 text-primary" />}
              label="No Backend"
              description="Client-side"
              active
            />
          </div>

          <div className="mt-10 max-w-lg text-center motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:delay-700">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 flex-wrap">
              <span className="text-nostr font-medium">Nostr</span>
              <ArrowRight className="w-3 h-3" />
              <span>enough?</span>
              <ArrowRight className="w-3 h-3" />
              <span className="text-clearnet font-medium">SearXNG</span>
              <span className="text-muted-foreground/30">+</span>
              <span className="text-tor font-medium">Ahmia</span>
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
          {isLoading && totalResults === 0 ? (
            <SearchSkeleton />
          ) : noResults ? (
            <>
              <Card className="border-dashed mb-4">
                <CardContent className="py-10 px-8 text-center">
                  <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    No results found for &ldquo;{activeQuery}&rdquo;.
                  </p>
                </CardContent>
              </Card>
              <BrowserFallback query={activeQuery} />
            </>
          ) : (
            <div className="space-y-6">

              {/* ═══ Nostr results ═══ */}
              {(source === 'all' || source === 'nostr') && nostrCount > 0 && (
                <ResultSection
                  icon={<Zap className="w-3.5 h-3.5 text-nostr" />}
                  label="Nostr"
                  labelClass="text-nostr"
                  count={nostrCount}
                  isFetching={nostrSearch.isFetching}
                  showHeader={source === 'all'}
                >
                  {(nostrSearch.data ?? []).map((event) => (
                    <NostrResultCard key={event.id} event={event} />
                  ))}
                </ResultSection>
              )}

              {/* ═══ Web results ═══ */}
              {(source === 'all' || source === 'web') && webCount > 0 && (
                <ResultSection
                  icon={<Globe className="w-3.5 h-3.5 text-clearnet" />}
                  label="Web"
                  labelClass="text-clearnet"
                  count={webCount}
                  isFetching={webSearch.isFetching}
                  showHeader={source === 'all'}
                  suffix="via SearXNG"
                >
                  {(webSearch.data?.results ?? []).map((result, i) => (
                    <WebResultCard key={`${result.url}-${i}`} result={result} />
                  ))}
                </ResultSection>
              )}

              {/* ═══ Tor results ═══ */}
              {(source === 'all' || source === 'tor') && darkWebCount > 0 && (
                <ResultSection
                  icon={<Shield className="w-3.5 h-3.5 text-tor" />}
                  label="Tor Hidden Services"
                  labelClass="text-tor"
                  count={darkWebCount}
                  isFetching={activeDarkWebFetching}
                  showHeader={source === 'all'}
                  suffix="via Ahmia"
                >
                  {(activeDarkWebData ?? []).map((result, i) => (
                    <DarkWebResultCard key={`${result.url}-${i}`} result={result} />
                  ))}
                </ResultSection>
              )}

              {/* ═══ Tor tab: loading or empty ═══ */}
              {source === 'tor' && activeDarkWebLoading && darkWebCount === 0 && (
                <SearchSkeleton count={3} />
              )}
              {source === 'tor' && !activeDarkWebLoading && darkWebCount === 0 && (
                <div className="space-y-4">
                  <Card className="border-dashed border-tor/20">
                    <CardContent className="py-10 px-8 text-center">
                      <Shield className="w-8 h-8 mx-auto mb-3 text-tor/30" />
                      <p className="text-muted-foreground max-w-sm mx-auto mb-1">
                        No Tor results found for &ldquo;{activeQuery}&rdquo; via Ahmia.
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        Ahmia indexes policy-compliant .onion sites only.
                      </p>
                    </CardContent>
                  </Card>
                  <DarkWebFallback query={activeQuery} type="tor" />
                </div>
              )}

              {/* ═══ I2P tab ═══ */}
              {source === 'i2p' && (
                <div className="space-y-4">
                  <Card className="border-dashed border-i2p/20">
                    <CardContent className="py-10 px-8 text-center">
                      <Network className="w-8 h-8 mx-auto mb-3 text-i2p/30" />
                      <p className="text-muted-foreground max-w-sm mx-auto mb-1">
                        I2P search is available via eepsite directories.
                      </p>
                      <p className="text-xs text-muted-foreground/60">
                        There is no public I2P search API. Use the directories below to explore eepsites.
                      </p>
                    </CardContent>
                  </Card>
                  <DarkWebFallback query={activeQuery} type="i2p" />
                </div>
              )}

              {/* Loading indicators for cascading search */}
              {source === 'all' && shouldSearchWeb && webSearch.isLoading && nostrCount > 0 && (
                <div className="flex items-center gap-2 py-3">
                  <Globe className="w-3.5 h-3.5 text-clearnet animate-search-pulse" />
                  <span className="text-sm text-muted-foreground">Searching the web via SearXNG...</span>
                </div>
              )}
              {source === 'all' && allNeedsDarkWeb && darkWebSearchAll.isLoading && (
                <div className="flex items-center gap-2 py-3">
                  <Shield className="w-3.5 h-3.5 text-tor animate-search-pulse" />
                  <span className="text-sm text-muted-foreground">Searching Tor via Ahmia...</span>
                </div>
              )}

              {/* Suggestions */}
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

              {/* Browser fallback when sparse */}
              {totalResults > 0 && totalResults < 5 && source !== 'tor' && source !== 'i2p' && (
                <BrowserFallback query={activeQuery} className="mt-4" />
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

/* ─── Result section wrapper ─── */
function ResultSection({ icon, label, labelClass, count, isFetching, showHeader, suffix, children }: {
  icon: React.ReactNode;
  label: string;
  labelClass: string;
  count: number;
  isFetching: boolean;
  showHeader: boolean;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      {showHeader ? (
        <div className="flex items-center gap-2 mb-3">
          {icon}
          <span className={cn('text-sm font-medium', labelClass)}>{label}</span>
          <span className="text-xs text-muted-foreground">
            {count} result{count !== 1 ? 's' : ''}
            {suffix && ` ${suffix}`}
          </span>
          {isFetching && <span className="text-xs text-primary animate-search-pulse">updating...</span>}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-3">
          {count} result{count !== 1 ? 's' : ''}
          {suffix && ` ${suffix}`}
          {isFetching && <span className="ml-2 text-primary animate-search-pulse">Updating...</span>}
        </p>
      )}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

/* ─── Dark web fallback links ─── */
function DarkWebFallback({ query, type }: { query: string; type: 'tor' | 'i2p' }) {
  const links = type === 'tor' ? [
    { name: 'Ahmia', url: `https://ahmia.fi/search/?q=${encodeURIComponent(query)}`, desc: 'Policy-compliant .onion search' },
    { name: 'Torch', url: `http://xmh57jrknzkhv6y3ls3ubitzfqnkrwxhopf5aygthi7d6rplyvk3noyd.onion/search?query=${encodeURIComponent(query)}`, desc: 'Tor search engine (requires Tor Browser)' },
    { name: 'Haystak', url: `http://haystak5njsmn2hqkewecpaxetahtwhsbsa64jom2k22z5afxhnpxfid.onion/?q=${encodeURIComponent(query)}`, desc: 'Tor search engine (requires Tor Browser)' },
  ] : [
    { name: 'Identiguy', url: 'http://identiguy.i2p', desc: 'I2P address book and directory' },
    { name: 'notbob.i2p', url: 'http://notbob.i2p', desc: 'I2P eepsite directory' },
    { name: 'stats.i2p', url: 'http://stats.i2p', desc: 'I2P network statistics' },
  ];

  return (
    <div className={cn(
      'rounded-xl border border-dashed p-5',
      type === 'tor' ? 'border-tor/20 bg-tor/5' : 'border-i2p/20 bg-i2p/5',
    )}>
      <div className="flex items-center gap-2 mb-3">
        {type === 'tor' ? <Shield className="w-4 h-4 text-tor/60" /> : <Network className="w-4 h-4 text-i2p/60" />}
        <span className="text-sm font-medium text-muted-foreground">
          {type === 'tor' ? 'Search .onion sites directly:' : 'Explore I2P eepsites:'}
        </span>
      </div>
      <div className="space-y-2">
        {links.map((link) => (
          <a
            key={link.name}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-colors"
          >
            <span className="text-sm font-medium text-foreground">{link.name}</span>
            <span className="text-xs text-muted-foreground flex-1 truncate">{link.desc}</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground/40 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

/* ─── Feature card ─── */
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
