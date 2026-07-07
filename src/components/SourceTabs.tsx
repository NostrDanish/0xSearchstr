import { cn } from '@/lib/utils';
import { Globe, Zap, Shield, Network } from 'lucide-react';

export type SearchSource = 'nostr' | 'clearnet' | 'tor' | 'i2p';

interface SourceTabsProps {
  value: SearchSource;
  onChange: (source: SearchSource) => void;
  className?: string;
}

const sources: { id: SearchSource; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
  {
    id: 'nostr',
    label: 'Nostr',
    icon: <Zap className="w-3.5 h-3.5" />,
    color: 'text-nostr/70 hover:text-nostr',
    activeColor: 'text-nostr bg-nostr/10 border-nostr/30',
  },
  {
    id: 'clearnet',
    label: 'Clearnet',
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

export function SourceTabs({ value, onChange, className }: SourceTabsProps) {
  return (
    <div className={cn('flex items-center gap-1.5 flex-wrap', className)} role="tablist" aria-label="Search source">
      {sources.map((source) => {
        const isActive = value === source.id;
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
          </button>
        );
      })}
    </div>
  );
}
