import { cn } from '@/lib/utils';
import type { NostrSearchKind } from '@/hooks/useNostrSearch';

interface KindFilterProps {
  value: NostrSearchKind;
  onChange: (kind: NostrSearchKind) => void;
  className?: string;
}

const kinds: { id: NostrSearchKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'notes', label: 'Notes' },
  { id: 'profiles', label: 'Profiles' },
  { id: 'articles', label: 'Articles' },
  { id: 'files', label: 'Files' },
];

export function KindFilter({ value, onChange, className }: KindFilterProps) {
  return (
    <div className={cn('flex items-center gap-1', className)} role="tablist" aria-label="Content type filter">
      {kinds.map((kind) => {
        const isActive = value === kind.id;
        return (
          <button
            key={kind.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(kind.id)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-all',
              isActive
                ? 'bg-primary/10 text-primary border border-primary/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent',
            )}
          >
            {kind.label}
          </button>
        );
      })}
    </div>
  );
}
