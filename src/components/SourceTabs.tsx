import { cn } from '@/lib/utils';
import { Layers, Zap, Globe, Shield, Network } from 'lucide-react';

export type SearchSource = 'all' | 'nostr' | 'web' | 'tor' | 'i2p';

interface SourceTabsProps {
  value: SearchSource;
  onChange: (source: SearchSource) => void;
  className?: string;
  /** Optional result counts to show in badges. */
  counts?: Partial<Record<SearchSource, number>>;
}

const sources: { id: SearchSource; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
  {
    id: 'all',
    label: 'All',
    icon: <Layers className="w-3.5 h-3.5" />,
    color: 'text-foreground/60 hover:text-foreground',
    activeColor: 'text-foreground bg-primary/10 border-primary/30',
  },
  {
    id: 'nostr',
    label: 'Nostr',
    icon: <Zap className="w-3.5 h-3.5" />,
    color: 'text-nostr/70 hover:text-nostr',
    activeColor: 'text-nostr bg-nostr/10 border-nostr/30',
  },
  {
    id: 'web',
    label: 'Web',
    icon: <Globe className="w-3.5 h-3.5" />,
    color: 'text-clearnet/70 hover:text-clearnet',
    activeColor: 'text-clearnet bg-clearnet/10 border-clearnet/30',
  },
  {
    id: 'tor',
    label: 'Tor',
    icon: <Shield className="w-3.5 h-3.5" />,
    color: 'text-tor/70 hover:text-tor',
    activeColor: 'text-tor bg-tor/10 border-tor/30',
  },
  {
    id: 'i2p',
    label: 'I2P',
    icon: <Network className="w-3.5 h-3.5" />,
    color: 'text-i2p/70 hover:text-i2p',
    activeColor: 'text-i2p bg-i2p/10 border-i2p/30',
  },
];

export function SourceTabs({ value, onChange, className, counts }: SourceTabsProps) {
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)} role="tablist" aria-label="Search source">
      {sources.map((source) => {
        const isActive = value === source.id;
        const count = counts?.[source.id];
        return (
          <button
            key={source.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(source.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-transparent transition-all duration-150',
              isActive ? source.activeColor : cn('text-muted-foreground', source.color),
              !isActive && 'hover:bg-accent',
            )}
          >
            {source.icon}
            {source.label}
            {count !== undefined && count > 0 && (
              <span className={cn(
                'text-[10px] font-mono ml-0.5 opacity-70',
                isActive ? '' : 'text-muted-foreground',
              )}>
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
