import { Server, Shield, Network, Globe, ExternalLink } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { SearchSource } from '@/components/SourceTabs';
import { cn } from '@/lib/utils';

interface BackendRequiredProps {
  source: SearchSource;
  className?: string;
}

const sourceInfo: Record<Exclude<SearchSource, 'nostr'>, {
  title: string;
  description: string;
  icon: React.ReactNode;
  details: string[];
  color: string;
}> = {
  clearnet: {
    title: 'Clearnet Search',
    description: 'Standard web search requires a backend crawler and Meilisearch index.',
    icon: <Globe className="w-8 h-8" />,
    details: [
      'Polite crawler respecting robots.txt',
      'Rate-limited per domain',
      'Seeded from curated directories + sitemap discovery',
      'Full-text indexed in Meilisearch with source: clearnet facet',
    ],
    color: 'text-clearnet border-clearnet/20 bg-clearnet/5',
  },
  tor: {
    title: 'Tor Hidden Services',
    description: 'Onion site indexing requires a local Tor SOCKS5 proxy and content policy enforcement.',
    icon: <Shield className="w-8 h-8" />,
    details: [
      'Crawl via local Tor SOCKS5 proxy',
      'Content policy: hard-block CSAM, trafficking, weapons, drug marketplaces',
      'Known-bad domain/hash list filtering',
      'Keyword/category classifiers before indexing',
      'Abuse report endpoint for content removal',
    ],
    color: 'text-tor border-tor/20 bg-tor/5',
  },
  i2p: {
    title: 'I2P Network',
    description: 'I2P eepsite indexing requires an i2pd router and content filtering pipeline.',
    icon: <Network className="w-8 h-8" />,
    details: [
      'Crawl via local i2pd router',
      'Same content policy as Tor indexing',
      'Tagged source: i2p in results',
      'Warning interstitials before rendering i2p links',
    ],
    color: 'text-i2p border-i2p/20 bg-i2p/5',
  },
};

export function BackendRequired({ source, className }: BackendRequiredProps) {
  if (source === 'nostr') return null;

  const info = sourceInfo[source];

  return (
    <div className={cn('max-w-2xl mx-auto', className)}>
      <Card className={cn('border-dashed', info.color)}>
        <CardContent className="py-10 px-8">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 opacity-60">
              {info.icon}
            </div>
            <h3 className="text-lg font-semibold mb-2">{info.title}</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              {info.description}
            </p>

            <div className="w-full max-w-md mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Server className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Backend Requirements:</span>
              </div>
              <ul className="space-y-2 text-left">
                {info.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="text-primary/50 mt-1 shrink-0">{'>'}</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://github.com/NostrDanish/0xSearchstr.git"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  View Repository
                </a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground/60 mt-4">
              Self-host with docker-compose to enable this source.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
