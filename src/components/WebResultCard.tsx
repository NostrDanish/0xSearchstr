import { Globe, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { SearXNGResult } from '@/hooks/useWebSearch';
import { cn } from '@/lib/utils';

interface WebResultCardProps {
  result: SearXNGResult;
  className?: string;
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function WebResultCard({ result, className }: WebResultCardProps) {
  const domain = extractDomain(result.url);

  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('block group', className)}
    >
      <div className="p-4 rounded-xl border border-border/50 bg-card hover:border-clearnet/30 hover:bg-card/80 transition-all duration-200">
        {/* URL line */}
        <div className="flex items-center gap-2 mb-1.5">
          <Globe className="w-3.5 h-3.5 text-clearnet/60 shrink-0" />
          <span className="text-xs text-clearnet/70 font-mono truncate">{domain}</span>
          <ExternalLink className="w-3 h-3 text-muted-foreground/40 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          {result.engine && (
            <Badge variant="outline" className="text-[10px] ml-auto shrink-0 border-clearnet/20 text-clearnet/60">
              {result.engine}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-foreground group-hover:text-clearnet transition-colors mb-1 line-clamp-2 text-sm">
          {result.title || domain}
        </h3>

        {/* Snippet */}
        {result.content && (
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
            {stripHtml(result.content)}
          </p>
        )}

        {/* Date if available */}
        {result.publishedDate && (
          <p className="text-xs text-muted-foreground/50 mt-2">
            {formatDate(result.publishedDate)}
          </p>
        )}
      </div>
    </a>
  );
}

/** Strip HTML tags from a snippet string. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}

/** Format a date string. */
function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
