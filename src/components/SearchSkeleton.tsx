import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface SearchSkeletonProps {
  count?: number;
  className?: string;
}

export function SearchSkeleton({ count = 5, className }: SearchSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-border/50 bg-card">
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            {i % 2 === 0 && <Skeleton className="h-4 w-3/5" />}
          </div>
          <div className="flex items-center gap-4 mt-3">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      ))}
    </div>
  );
}
