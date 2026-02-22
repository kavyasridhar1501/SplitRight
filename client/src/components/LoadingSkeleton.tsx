export function SkeletonCard() {
  return (
    <div className="card p-4 space-y-3 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-elevated" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-slate-elevated rounded w-2/3" />
          <div className="h-3 bg-slate-elevated rounded w-1/3" />
        </div>
        <div className="h-5 bg-slate-elevated rounded w-16" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonLine({ width = 'full' }: { width?: string }) {
  return (
    <div className={`h-4 bg-slate-elevated rounded animate-pulse w-${width}`} />
  );
}
