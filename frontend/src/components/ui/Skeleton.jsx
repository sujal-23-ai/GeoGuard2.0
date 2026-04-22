import { cn } from '../../utils/cn';

export function Skeleton({ className }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-white/8',
        className
      )}
    />
  );
}

export function IncidentCardSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3">
      <Skeleton className="w-8 h-8 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between gap-2">
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-2.5 w-12" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/8 space-y-2">
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-2.5 w-24" />
    </div>
  );
}

export function MediaSkeleton() {
  return (
    <div className="relative rounded-xl overflow-hidden bg-white/5 aspect-video">
      <Skeleton className="absolute inset-0 rounded-none" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
      </div>
    </div>
  );
}

export function PanelSkeleton({ rows = 4 }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <IncidentCardSkeleton key={i} />
      ))}
    </div>
  );
}
