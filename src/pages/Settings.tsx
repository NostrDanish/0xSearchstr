/**
 * Settings page — all app configuration in one place.
 *
 * Sections:
 *   - Appearance: theme selection (light / dark / hacker / system)
 *   - SearXNG Instances: dynamic pool management (add custom, health, refresh)
 */
import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import {
  Settings as SettingsIcon, Sun, Moon, Terminal, Monitor,
  Plus, Trash2, RefreshCw, Globe, Anchor,
  CheckCircle2, XCircle, CircleDashed, ExternalLink, ShieldCheck, Check,
} from 'lucide-react';

import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/useToast';
import { useTheme } from '@/hooks/useTheme';
import { useSearxngInstances } from '@/hooks/useSearxngInstances';
import type { PoolInstance, InstanceOrigin } from '@/lib/searxngInstances';
import type { Theme } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/* Theme                                                               */
/* ------------------------------------------------------------------ */

const THEMES: { value: Theme; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" />, description: 'Clean and bright' },
  { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" />, description: 'Easy on the eyes' },
  { value: 'hacker', label: 'Hacker', icon: <Terminal className="w-4 h-4" />, description: 'Terminal green' },
  { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" />, description: 'Follows your device' },
];

function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  return (
    <section className="mb-10">
      <h2 className="text-sm font-semibold mb-1">Appearance</h2>
      <p className="text-xs text-muted-foreground mb-4">Choose how 0xSearchstr looks.</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {THEMES.map((t) => {
          const active = theme === t.value;
          return (
            <button
              key={t.value}
              onClick={() => setTheme(t.value)}
              aria-pressed={active}
              className={cn(
                'flex flex-col items-center gap-1.5 px-3 py-4 rounded-xl border text-center transition-colors',
                active
                  ? 'border-primary/40 bg-primary/5 text-foreground'
                  : 'border-border/60 bg-card text-muted-foreground hover:text-foreground hover:border-border',
              )}
            >
              <span className={cn(active && 'text-primary')}>{t.icon}</span>
              <span className="text-sm font-medium flex items-center gap-1.5">
                {t.label}
                {active && <Check className="w-3.5 h-3.5 text-primary" />}
              </span>
              <span className="text-xs text-muted-foreground/70">{t.description}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Instances                                                           */
/* ------------------------------------------------------------------ */

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

function InstancesSection() {
  const { pool, refreshing, refresh, addInstance, removeInstance, discoveredAt } = useSearxngInstances();
  const { toast } = useToast();
  const [newUrl, setNewUrl] = useState('');

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
    <section className="mb-10">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-sm font-semibold">SearXNG Instances</h2>
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
      <p className="text-xs text-muted-foreground mb-4">
        Instances are discovered live from{' '}
        <a
          href="https://searx.space"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline inline-flex items-center gap-0.5"
        >
          searx.space
          <ExternalLink className="w-3 h-3" />
        </a>
        {' '}(privacy-filtered), health-tracked in your browser, and self-heal automatically.
        {discoveredAt && (
          <span className="block mt-1 text-muted-foreground/70">
            Last discovery: {new Date(discoveredAt).toLocaleString()}
          </span>
        )}
      </p>

      {/* Add custom */}
      <Card className="mb-6 border-primary/20">
        <CardContent className="py-4">
          <p className="text-xs text-muted-foreground mb-3">
            <strong className="text-foreground">Add your own instance</strong> — self-hosted instances
            always run first. Enable <code className="bg-muted px-1 py-0.5 rounded font-mono">format: json</code> in your SearXNG settings.
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

      {/* Custom list */}
      {custom.length > 0 && (
        <>
          <SectionHeader title="Your instances" count={custom.length} />
          <div className="space-y-2 mb-6">
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

      {/* Discovered list */}
      <SectionHeader title="Discovered" count={discovered.length} />
      {discovered.length > 0 ? (
        <div className="space-y-2 mb-6">
          {discovered.map((inst) => (
            <InstanceRow key={inst.url} inst={inst} />
          ))}
        </div>
      ) : (
        <Card className="border-dashed mb-6">
          <CardContent className="py-6 text-center">
            <p className="text-sm text-muted-foreground">
              {refreshing
                ? 'Discovering live instances…'
                : 'No discovered instances yet. They appear automatically after a search.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Seed list */}
      <SectionHeader title="Seeds (bootstrap fallback)" count={seeds.length} />
      <div className="space-y-2">
        {seeds.map((inst) => (
          <InstanceRow key={inst.url} inst={inst} />
        ))}
      </div>
    </section>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-2 mb-2">
      {title}
      <Badge variant="secondary" className="text-[10px] font-mono px-1.5 py-0">{count}</Badge>
    </h3>
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

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Settings() {
  useSeoMeta({
    title: 'Settings - 0xSearchstr',
    description: 'Configure appearance and SearXNG instances for 0xSearchstr.',
  });

  return (
    <Layout>
      <div className="container max-w-2xl py-10">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
            <SettingsIcon className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Everything is stored locally in your browser. Nothing leaves your device except search queries.
        </p>

        <AppearanceSection />
        <Separator className="mb-10" />
        <InstancesSection />
      </div>
    </Layout>
  );
}
