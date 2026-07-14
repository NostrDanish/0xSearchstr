import { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { OnionWarningDialog } from '@/components/OnionWarningDialog';
import type { AhmiaResult } from '@/hooks/useDarkWebSearch';
import { cn } from '@/lib/utils';

interface DarkWebResultCardProps {
  result: AhmiaResult;
  className?: string;
}

export function DarkWebResultCard({ result, className }: DarkWebResultCardProps) {
  const [warningOpen, setWarningOpen] = useState(false);

  const isI2p = result.url.includes('.i2p');
  const networkType = isI2p ? 'i2p' : 'tor' as const;
  const networkLabel = isI2p ? 'I2P' : 'Tor';

  return (
    <>
      <button
        onClick={() => setWarningOpen(true)}
        className={cn('block group w-full text-left', className)}
      >
        <div className={cn(
          'p-4 rounded-xl border bg-card transition-all duration-200',
          isI2p
            ? 'border-i2p/20 hover:border-i2p/40 hover:bg-i2p/5'
            : 'border-tor/20 hover:border-tor/40 hover:bg-tor/5',
        )}>
          {/* Header line */}
          <div className="flex items-center gap-2 mb-1.5">
            <Shield className={cn('w-3.5 h-3.5 shrink-0', isI2p ? 'text-i2p/60' : 'text-tor/60')} />
            <span className={cn(
              'text-xs font-mono truncate',
              isI2p ? 'text-i2p/70' : 'text-tor/70',
            )}>
              {result.onion || result.url}
            </span>
            <AlertTriangle className="w-3 h-3 text-muted-foreground/40 shrink-0" />
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] ml-auto shrink-0',
                isI2p ? 'border-i2p/20 text-i2p/60' : 'border-tor/20 text-tor/60',
              )}
            >
              {networkLabel}
            </Badge>
          </div>

          {/* Title */}
          <h3 className={cn(
            'font-semibold text-foreground transition-colors mb-1 line-clamp-2 text-sm',
            isI2p ? 'group-hover:text-i2p' : 'group-hover:text-tor',
          )}>
            {result.title}
          </h3>

          {/* Description */}
          {result.description && (
            <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
              {result.description}
            </p>
          )}

          {/* Warning note */}
          <p className="text-[11px] text-muted-foreground/50 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            Requires {isI2p ? 'I2P router' : 'Tor Browser'} — click to see warning
          </p>
        </div>
      </button>

      <OnionWarningDialog
        open={warningOpen}
        onOpenChange={setWarningOpen}
        url={result.url}
        type={networkType}
      />
    </>
  );
}
