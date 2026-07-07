import { useState, useCallback } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  isLoading?: boolean;
  /** Large variant for the home page hero. */
  size?: 'default' | 'large';
  className?: string;
  autoFocus?: boolean;
}

export function SearchBar({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  size = 'default',
  className,
  autoFocus = false,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value.trim());
    }
  }, [value, onSubmit]);

  const handleClear = useCallback(() => {
    onChange('');
  }, [onChange]);

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'relative flex items-center w-full rounded-xl border bg-card transition-all duration-200',
        focused && 'border-primary/50 glow-primary',
        !focused && 'border-border hover:border-border/80',
        size === 'large' && 'rounded-2xl',
        className,
      )}
    >
      <div className={cn(
        'flex items-center justify-center shrink-0 text-muted-foreground',
        size === 'large' ? 'pl-5 pr-1' : 'pl-3.5 pr-0.5',
      )}>
        {isLoading ? (
          <Loader2 className={cn('animate-spin', size === 'large' ? 'w-5 h-5' : 'w-4 h-4')} />
        ) : (
          <Search className={cn(size === 'large' ? 'w-5 h-5' : 'w-4 h-4')} />
        )}
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search Nostr, the clearnet, and beyond..."
        autoFocus={autoFocus}
        className={cn(
          'flex-1 bg-transparent outline-none placeholder:text-muted-foreground/60 text-foreground',
          size === 'large' ? 'px-3 py-4 text-lg' : 'px-2.5 py-2.5 text-sm',
        )}
        aria-label="Search query"
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="flex items-center justify-center shrink-0 w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      <div className={cn('shrink-0', size === 'large' ? 'pr-2.5' : 'pr-1.5')}>
        <Button
          type="submit"
          disabled={!value.trim() || isLoading}
          size={size === 'large' ? 'default' : 'sm'}
          className={cn(
            'rounded-lg font-medium',
            size === 'large' && 'px-6',
          )}
        >
          Search
        </Button>
      </div>
    </form>
  );
}
