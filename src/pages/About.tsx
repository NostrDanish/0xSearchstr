import { useSeoMeta } from '@unhead/react';
import { Search, Zap, Globe, Database, Layers, ArrowRight, Lock, Code, ExternalLink, Server } from 'lucide-react';

import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

export default function About() {
  useSeoMeta({
    title: 'About - 0xSearchstr',
    description: 'Learn about 0xSearchstr, a decentralized search aggregator. Nostr-first, SearXNG fallback, no backend required.',
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
          A decentralized search aggregator. Instead of building another centralized search engine, 0xSearchstr
          searches Nostr first, enriches results from privacy-respecting public indexes only when needed,
          and requires no backend, crawler, or server.
        </p>

        <Separator className="mb-8" />

        {/* How it works */}
        <h2 className="text-xl font-semibold mb-4">How It Works</h2>
        <Card className="mb-8 border-primary/20">
          <CardContent className="py-6">
            <div className="space-y-4">
              <Step
                number={1}
                icon={<Zap className="w-4 h-4 text-nostr" />}
                title="Search Nostr first"
                description="NIP-50 search queries go directly to relay.nostr.band and relay.ditto.pub. Results include profiles, notes, articles, and files — all with author avatars and engagement signals."
                active
              />
              <div className="flex items-center gap-2 pl-8 text-xs text-muted-foreground">
                <ArrowRight className="w-3 h-3" />
                <span>enough results?</span>
                <span className="text-primary font-medium">show them.</span>
                <span className="text-muted-foreground/50">not enough?</span>
                <ArrowRight className="w-3 h-3" />
              </div>
              <Step
                number={2}
                icon={<Globe className="w-4 h-4 text-clearnet" />}
                title="Fall back to SearXNG"
                description="Query public SearXNG instances that aggregate results from DuckDuckGo, Brave, Wikipedia, and dozens of other engines. If one instance fails, automatically try the next."
                active
              />
              <div className="flex items-center gap-2 pl-8 text-xs text-muted-foreground">
                <ArrowRight className="w-3 h-3" />
                <span>still nothing?</span>
                <ArrowRight className="w-3 h-3" />
              </div>
              <Step
                number={3}
                icon={<ExternalLink className="w-4 h-4 text-muted-foreground" />}
                title="Browser fallback"
                description="Direct links to DuckDuckGo, Brave Search, Presearch, Mojeek, and Marginalia so you're never left with zero results."
              />
            </div>
          </CardContent>
        </Card>

        {/* Why this architecture */}
        <h2 className="text-xl font-semibold mb-4">Why an Aggregator?</h2>
        <Card className="mb-8">
          <CardContent className="py-5">
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { label: 'No backend required', detail: 'Everything runs in the browser. No servers, no crawlers, no infrastructure to maintain.' },
                { label: 'Nostr-native', detail: 'Nostr results are first-class citizens with rich rendering — avatars, content previews, NIP-19 links.' },
                { label: 'Privacy by default', detail: 'SearXNG instances don\'t track users. No search queries are logged anywhere.' },
                { label: 'Resilient', detail: 'Multiple SearXNG instances with automatic failover. Multiple Nostr relays in parallel. Browser fallback as last resort.' },
                { label: 'Incrementally upgradeable', detail: 'The backend stack (Meilisearch, crawlers, NIP-50 relay) is available in the repo for self-hosting when you\'re ready to scale.' },
              ].map((item) => (
                <li key={item.label} className="flex items-start gap-3">
                  <span className="text-primary font-mono mt-0.5 shrink-0 text-sm">{'>'}</span>
                  <div>
                    <span className="text-foreground font-medium">{item.label}</span>
                    <span className="text-muted-foreground"> — {item.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Search sources detail */}
        <h2 className="text-xl font-semibold mb-4">Search Sources</h2>
        <div className="grid gap-4 mb-8">
          <SourceCard
            icon={<Zap className="w-5 h-5" />}
            title="Nostr Protocol (NIP-50)"
            status="active"
            color="text-nostr"
            features={[
              'Direct client-side relay connections — no intermediary',
              'Indexes kinds 0 (profiles), 1 (notes), 30023 (articles), 1063 (files)',
              'Deduplicates across relay.nostr.band + relay.ditto.pub',
              'Results ranked by relay relevance, sorted by recency',
            ]}
          />
          <SourceCard
            icon={<Globe className="w-5 h-5" />}
            title="SearXNG (Meta-Search)"
            status="active"
            color="text-clearnet"
            features={[
              'Aggregates results from dozens of engines (DDG, Brave, Wikipedia, etc.)',
              'Pool of public instances with automatic failover',
              'Privacy-preserving — no tracking, no user profiling',
              'Accessed via CORS proxy for browser compatibility',
            ]}
          />
          <SourceCard
            icon={<Server className="w-5 h-5" />}
            title="Self-Hosted Backend (Optional)"
            status="optional"
            color="text-muted-foreground"
            features={[
              'Meilisearch-powered full-text search index',
              'Nostr crawler, clearnet crawler, Tor/I2P crawler',
              'NIP-50 relay proxy for custom search relay',
              'Docker Compose — one command to deploy everything',
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
                { name: 'SearXNG', category: 'Web Meta-Search' },
                { name: 'TanStack Query', category: 'Data Fetching' },
                { name: 'shadcn/ui', category: 'Components' },
                { name: 'Vite', category: 'Build Tool' },
              ].map((tech) => (
                <div key={tech.name} className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{tech.name}</span>
                  <span className="text-xs text-muted-foreground">{tech.category}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Privacy model */}
        <h2 className="text-xl font-semibold mb-4">Privacy Model</h2>
        <Card className="mb-8 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="w-4 h-4" />
              What This Tool Does and Doesn't Do
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Does:</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {[
                  'Run entirely in the browser — no server-side search logging',
                  'Search Nostr relays directly via WebSocket',
                  'Query privacy-respecting SearXNG instances as a web fallback',
                  'Provide fallback links to privacy-focused search engines',
                  'Open source — verify every line of code',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-primary/60 mt-0.5 shrink-0">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">Does not:</h4>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {[
                  'Store or log search queries (client-side only)',
                  'Run its own crawler or indexing backend by default',
                  'Track users, fingerprint browsers, or set cookies',
                  'Act as a proxy — web links open directly in your browser',
                  'Guarantee result completeness — relay availability varies',
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

function Step({ number, icon, title, description, active }: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 text-sm font-bold ${
        active ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-muted text-muted-foreground'
      }`}>
        {number}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {icon}
          <span className="text-sm font-semibold">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function SourceCard({ icon, title, status, color, features }: {
  icon: React.ReactNode;
  title: string;
  status: 'active' | 'optional';
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
            {status === 'active' ? 'Live' : 'Self-Host'}
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
