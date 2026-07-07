import { useSeoMeta } from '@unhead/react';
import { Search, Zap, Globe, Shield, Network, Server, Lock, Code, ExternalLink } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function About() {
  useSeoMeta({
    title: 'About - 0xSearchstr',
    description: 'Learn about 0xSearchstr, a federated privacy-first search engine that indexes Nostr, the clearnet, and dark web services.',
  });

  return (
    <Layout>
      <div className="container max-w-3xl py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
            <Search className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">About 0xSearchstr</h1>
        </div>
        <p className="text-muted-foreground mb-8 leading-relaxed max-w-2xl">
          A federated, privacy-first search engine that indexes three sources: the Nostr protocol,
          the clearnet, and Tor/I2P hidden services.
        </p>

        <Separator className="mb-8" />

        {/* Architecture overview */}
        <h2 className="text-xl font-semibold mb-4">Architecture</h2>
        <div className="grid gap-4 mb-8">
          <SourceCard
            icon={<Zap className="w-5 h-5" />}
            title="Nostr Protocol"
            status="active"
            color="text-nostr"
            features={[
              'NIP-50 search queries to relay.nostr.band and relay.ditto.pub',
              'Indexes kinds 0 (profiles), 1 (notes), 30023 (articles), 1063 (files)',
              'Deduplicates by event ID across multiple relays',
              'Results ranked by relay relevance scoring',
              'Direct client-side relay connections — no intermediary server',
            ]}
          />
          <SourceCard
            icon={<Globe className="w-5 h-5" />}
            title="Clearnet"
            status="backend"
            color="text-clearnet"
            features={[
              'Polite crawler respecting robots.txt and rate limits',
              'Seeded from curated directories + sitemap discovery',
              'Full-text indexed in Meilisearch with source: clearnet facet',
              'Requires self-hosted backend (docker-compose)',
            ]}
          />
          <SourceCard
            icon={<Shield className="w-5 h-5" />}
            title="Tor Hidden Services"
            status="backend"
            color="text-tor"
            features={[
              'Crawl via local Tor SOCKS5 proxy',
              'Content policy enforcement (mirrors Ahmia approach)',
              'Known-bad domain/hash list filtering',
              'Keyword/category classifiers before indexing',
              'Tagged source: tor with warning interstitials',
            ]}
          />
          <SourceCard
            icon={<Network className="w-5 h-5" />}
            title="I2P Network"
            status="backend"
            color="text-i2p"
            features={[
              'Crawl via local i2pd router',
              'Same content policy as Tor indexing',
              'Tagged source: i2p in results',
              'Warning interstitials before rendering i2p links',
            ]}
          />
        </div>

        {/* Tech stack */}
        <h2 className="text-xl font-semibold mb-4">Technology Stack</h2>
        <Card className="mb-8">
          <CardContent className="py-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { name: 'React 19', category: 'Frontend' },
                { name: 'TypeScript', category: 'Language' },
                { name: 'TailwindCSS 4', category: 'Styling' },
                { name: 'Nostrify', category: 'Nostr SDK' },
                { name: 'NIP-50', category: 'Search Protocol' },
                { name: 'TanStack Query', category: 'Data Fetching' },
                { name: 'shadcn/ui', category: 'Components' },
                { name: 'Vite', category: 'Build Tool' },
                { name: 'Meilisearch*', category: 'Index Engine' },
              ].map((tech) => (
                <div key={tech.name} className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{tech.name}</span>
                  <span className="text-xs text-muted-foreground">{tech.category}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              * Meilisearch is required for clearnet/Tor/I2P indexing (backend deployment only).
            </p>
          </CardContent>
        </Card>

        {/* Self-hosting */}
        <h2 className="text-xl font-semibold mb-4">Self-Hosting</h2>
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="w-4 h-4" />
              Docker Compose Deployment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The full 0xSearchstr stack can be self-hosted with a single docker-compose bringing up:
            </p>
            <div className="font-mono text-sm bg-muted/50 rounded-lg p-4 border border-border/50 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">meilisearch</span>
                <span className="text-muted-foreground/50">— search index engine</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">nostr-crawler</span>
                <span className="text-muted-foreground/50">— NIP-01 REQ subscriber</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">web-crawler</span>
                <span className="text-muted-foreground/50">— polite clearnet crawler</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">tor-proxy</span>
                <span className="text-muted-foreground/50">— SOCKS5 proxy for onion crawling</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">i2pd</span>
                <span className="text-muted-foreground/50">— I2P router for eepsite crawling</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">nip50-relay</span>
                <span className="text-muted-foreground/50">— NIP-50 search relay proxy</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-primary">{'>'}</span>
                <span className="text-muted-foreground">frontend</span>
                <span className="text-muted-foreground/50">— this UI (Vite static build)</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Threat model */}
        <h2 className="text-xl font-semibold mb-4">Threat Model</h2>
        <Card className="mb-8 border-destructive/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-4 h-4" />
              What This Tool Does and Doesn't Do
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">This tool DOES:</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {[
                  'Index publicly available content from Nostr relays, clearnet, and hidden services',
                  'Apply content policy filters BEFORE indexing (hard-block CSAM, trafficking, weapons, drug markets)',
                  'Provide an abuse-report endpoint for content removal requests',
                  'Tag results by source so users know what network they are accessing',
                  'Show warning interstitials before rendering onion/i2p links',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5 shrink-0">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">This tool does NOT:</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {[
                  'Host, cache, or serve any indexed content',
                  'Act as a proxy or gateway to hidden services',
                  'Store or log user search queries (client-side only)',
                  'Guarantee completeness — relay availability and content policy filtering means some content is intentionally excluded',
                  'Replace due diligence — users are responsible for understanding the legal implications of content in their jurisdiction',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-destructive/60 mt-0.5 shrink-0">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/NostrDanish/0xSearchstr.git"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 text-sm font-medium transition-colors"
          >
            <Code className="w-4 h-4" />
            Source Code
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
          <a
            href="https://shakespeare.diy/clone?url=https%3A%2F%2Fgithub.com%2FNostrDanish%2F0xSearchstr.git"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-sm font-medium text-primary transition-colors"
          >
            Edit with Shakespeare
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </Layout>
  );
}

function SourceCard({ icon, title, status, color, features }: {
  icon: React.ReactNode;
  title: string;
  status: 'active' | 'backend';
  color: string;
  features: string[];
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className={color}>{icon}</span>
          {title}
          <Badge
            variant={status === 'active' ? 'default' : 'outline'}
            className={status === 'active' ? 'ml-auto text-[10px]' : 'ml-auto text-[10px] text-muted-foreground'}
          >
            {status === 'active' ? 'Live' : 'Backend Required'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-1.5">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className={`mt-0.5 shrink-0 ${color} opacity-60`}>{'>'}</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
