/**
 * Instances page — view and manage the dynamic SearXNG instance pool.
 *
 * Inspired by searxist (codeberg.org/searxist): choose from live public
 * SearXNG instances discovered via searx.space, or add your own
 * self-hosted instance for maximum privacy.
 */
import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import {
  Server, Plus, Trash2, RefreshCw, Zap, Globe, Anchor,
  CheckCircle2, XCircle, CircleDashed, ExternalLink, ShieldCheck,
} from 'lucide-react';

import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import { useSearxngInstances } from '@/hooks/useSearxngInstances';
import type { PoolInstance, InstanceOrigin } from '@/lib/searxngInstances';
import { cn } from '@/lib/utils';

const ORIGIN_META: Record<InstanceOrigin, { label: string; icon: React.ReactNode; className: string }> = {
  custom: {
    label: 'Custom',
    icon: <ShieldCheck className="w-3 h-3" />,
    className: 'bg-primary/10 text-primary border-primary/30',
  },
  discovered: {
    label: 'Discovered',
    icon: <Globe className="w-3 h-3" />,
    className: 'bg-clearnet/10 text-clearnet border-clearnet/30',
  },
  seed: {
    label: 'Seed',
    icon: <Anchor className="w-3 h-3" />,
    className: 'bg-muted text-muted-foreground border-border',
  },
};

function healthIndicator(inst: PoolInstance) {
  const h = inst.health;
  if (!h || (h.ok === 0 && h.fail === 0)) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CircleDashed className="w-3.5 h-3.5" />
        Untested
      </span>
    );
  }
  if (h.fail > 0) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-destructive">
        <XCircle className="w-3.5 h-3.5" />
        {h.fail} consecutive fail{h.fail > 1 ? 's' : ''}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-500">
      <CheckCircle2 className="w-3.5 h-3.5" />
      Healthy{h.latencyMs ? ` · ${h.latencyMs}ms` : ''}
    </span>
  );
}

export default function Instances() {
  const { pool, refreshing, refresh, addInstance, removeInstance, discoveredAt } = useSearxngInstances();
  const { toast } = useToast();
  const [newUrl, setNewUrl] = useState('');

  useSeoMeta({
    title: 'SearXNG Instances - 0xSearchstr',
    description: 'Manage the dynamic SearXNG instance pool. Add your own self-hosted instance or use privacy-filtered public instances discovered from searx.space.',
  });

  const custom = pool.filter((p) => p.origin === 'custom');
  const discovered = pool.filter((p) => p.origin === 'discovered');
  const seeds = pool.filter((p) => p.origin === 'seed');

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    const added = addInstance(newUrl);
    if (added) {
      toast({ title: 'Instance added', description: `${added} is now first in the pool.` });
      setNewUrl('');
    } else {
      toast({
        title: 'Invalid URL',
        description: 'Instance must be a valid https:// URL.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Layout>
      <div className="container max-w-3xl py-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
            <Server className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">SearXNG Instances</h1>
        </div>
        <p className="text-muted-foreground mb-8 leading-relaxed max-w-2xl">
          0xSearchstr races multiple SearXNG instances in parallel and fails over automatically.
          The pool is <strong>dynamic</strong>: public instances are discovered live from{' '}
          <a
            href="https://searx.space"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-0.5"
          >
            searx.space
            <ExternalLink className="w-3 h-3" />
          </a>
          {' '}(privacy-filtered: no analytics, ≥80% search success), health-tracked in your browser,
          and self-heals as instances come and go. Everything stays client-side.
        </p>

        {/* Add custom instance */}
        <Card className="mb-8 border-primary/20">
          <CardContent className="py-5">
            <h2 className="text-sm font-semibold mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Add your own instance
            </h2>
            <p className="text-xs text-muted-foreground mb-4">
              Self-hosted or trusted instances always run <strong>first</strong>. For best privacy,
              run your own SearXNG with <code className="bg-muted px-1 py-0.5 rounded font-mono">format: json</code> enabled.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://searx.example.com"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                className="font-mono text-sm"
                aria-label="Custom SearXNG instance URL"
              />
              <Button onClick={handleAdd} className="shrink-0">
                <Plus className="w-4 h-4 mr-1.5" />
                Add
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Custom instances */}
        {custom.length > 0 && (
          <>
            <SectionHeader title="Your instances" count={custom.length} />
            <div className="space-y-2 mb-8">
              {custom.map((inst) => (
                <InstanceRow
                  key={inst.url}
                  inst={inst}
                  onRemove={() => {
                    removeInstance(inst.url);
                    toast({ title: 'Instance removed', description: inst.url });
                  }}
                />
              ))}
            </div>
          </>
        )}

        {/* Discovered */}
        <div className="flex items-center justify-between mb-3">
          <SectionHeader title="Discovered instances" count={discovered.length} noMargin />
          <div className="flex items-center gap-3">
            {discoveredAt && (
              <span className="text-xs text-muted-foreground">
                Updated {new Date(discoveredAt).toLocaleString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refresh()}
              disabled={refreshing}
            >
              <RefreshCw className={cn('w-3.5 h-3.5 mr-1.5', refreshing && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {discovered.length > 0 ? (
          <div className="space-y-2 mb-8">
            {discovered.map((inst) => (
              <InstanceRow key={inst.url} inst={inst} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed mb-8">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">
                {refreshing
                  ? 'Discovering live instances from searx.space…'
                  : 'No discovered instances yet. Hit Refresh, or run a search — discovery happens automatically.'}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Seeds */}
        <SectionHeader title="Seed instances (bootstrap fallback)" count={seeds.length} />
        <div className="space-y-2 mb-8">
          {seeds.map((inst) => (
            <InstanceRow key={inst.url} inst={inst} />
          ))}
        </div>

        <Separator className="mb-6" />

        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <Zap className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
          <p>
            <strong className="text-foreground">How ranking works:</strong>{' '}
            Custom instances → discovered instances → seeds. Within each tier, instances with
            recent failures sink and fast responders rise. The top 4 are raced in parallel on
            every search; the rest serve as sequential fallback. Health data lives only in your
            browser's local storage.
          </p>
        </div>
      </div>
    </Layout>
  );
}

function SectionHeader({ title, count, noMargin }: { title: string; count: number; noMargin?: boolean }) {
  return (
    <h2 className={cn('text-sm font-semibold flex items-center gap-2', !noMargin && 'mb-3')}>
      {title}
      <Badge variant="secondary" className="text-xs font-mono">{count}</Badge>
    </h2>
  );
}

function InstanceRow({ inst, onRemove }: { inst: PoolInstance; onRemove?: () => void }) {
  const meta = ORIGIN_META[inst.origin];
  const hostname = (() => {
    try { return new URL(inst.url).hostname; } catch { return inst.url; }
  })();

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border/60 bg-card hover:border-border transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <a
            href={inst.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm truncate hover:text-primary transition-colors"
          >
            {hostname}
          </a>
          <Badge variant="outline" className={cn('text-[10px] gap-1 px-1.5 py-0', meta.className)}>
            {meta.icon}
            {meta.label}
          </Badge>
        </div>
        {healthIndicator(inst)}
      </div>
      {onRemove && (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
          onClick={onRemove}
          aria-label={`Remove ${hostname}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
