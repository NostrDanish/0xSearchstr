import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSeoMeta } from '@unhead/react';
import { Search, Zap, Globe, Shield, Network } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { SearchBar } from '@/components/SearchBar';
import { SourceTabs, type SearchSource } from '@/components/SourceTabs';
import { KindFilter } from '@/components/KindFilter';
import { NostrResultCard } from '@/components/NostrResultCard';
import { BackendRequired } from '@/components/BackendRequired';
import { SearchSkeleton } from '@/components/SearchSkeleton';
import { Card, CardContent } from '@/components/ui/card';
import { useNostrSearch, type NostrSearchKind } from '@/hooks/useNostrSearch';
import { cn } from '@/lib/utils';

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialSource = (searchParams.get('source') as SearchSource) || 'nostr';

  const [query, setQuery] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [source, setSource] = useState<SearchSource>(initialSource);
  const [kind, setKind] = useState<NostrSearchKind>('all');

  const hasSearched = activeQuery.length > 0;

  const { data: results, isLoading, isFetching } = useNostrSearch({
    query: activeQuery,
    kind,
    enabled: source === 'nostr' && hasSearched,
  });

  useSeoMeta({
    title: hasSearched ? `${activeQuery} - 0xSearchstr` : '0xSearchstr - Federated Privacy-First Search',
    description: 'Search Nostr, the clearnet, and dark web from a single privacy-first interface. Powered by NIP-50 relay search.',
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

  // Hero mode (no search yet)
  if (!hasSearched) {
    return (
      <Layout minimal>
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] px-4">
          {/* Hero */}
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
              Federated, privacy-first search across Nostr, the clearnet, and beyond.
            </p>
          </div>

          {/* Search bar */}
          <div className="w-full max-w-2xl mb-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 motion-safe:delay-200">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSubmit={handleSubmit}
              size="large"
              autoFocus
            />
          </div>

          {/* Source tabs */}
          <div className="mb-12 motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 motion-safe:delay-300">
            <SourceTabs value={source} onChange={handleSourceChange} />
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-2xl motion-safe:animate-in motion-safe:fade-in motion-safe:duration-700 motion-safe:delay-500">
            <FeatureCard
              icon={<Zap className="w-4 h-4 text-nostr" />}
              label="Nostr"
              description="NIP-50 search"
              active
            />
            <FeatureCard
              icon={<Globe className="w-4 h-4 text-clearnet" />}
              label="Clearnet"
              description="Backend required"
            />
            <FeatureCard
              icon={<Shield className="w-4 h-4 text-tor" />}
              label="Tor"
              description="Backend required"
            />
            <FeatureCard
              icon={<Network className="w-4 h-4 text-i2p" />}
              label="I2P"
              description="Backend required"
            />
          </div>
        </div>
      </Layout>
    );
  }

  // Results mode
  return (
    <Layout>
      <div className="container py-6">
        {/* Search bar */}
        <div className="max-w-2xl mb-5">
          <SearchBar
            value={query}
            onChange={setQuery}
            onSubmit={handleSubmit}
            isLoading={isFetching}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <SourceTabs value={source} onChange={handleSourceChange} />
          {source === 'nostr' && (
            <>
              <div className="hidden sm:block w-px h-6 bg-border" />
              <KindFilter value={kind} onChange={setKind} />
            </>
          )}
        </div>

        {/* Results */}
        {source === 'nostr' ? (
          <div className="max-w-2xl">
            {isLoading && !results ? (
              <SearchSkeleton />
            ) : results && results.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  {results.length} result{results.length !== 1 ? 's' : ''} from Nostr relays
                  {isFetching && <span className="ml-2 text-primary animate-search-pulse">Updating...</span>}
                </p>
                <div className="space-y-3">
                  {results.map((event) => (
                    <NostrResultCard key={event.id} event={event} />
                  ))}
                </div>
              </>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 px-8 text-center">
                  <Search className="w-8 h-8 mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    No results found for &ldquo;{activeQuery}&rdquo;. Try different keywords or check your relay connections.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <BackendRequired source={source} />
        )}
      </div>
    </Layout>
  );
};

/* ─── Small feature card for the hero ─── */
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
