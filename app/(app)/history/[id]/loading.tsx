/**
 * Loading skeleton for the history detail route.
 * This file creates an implicit Suspense boundary required by Next.js
 * when `cacheComponents: true` is enabled and the route has dynamic params.
 */
export default function HistoryDetailLoading() {
  return (
    <div className="pb-6">
      <div className="mx-auto max-w-2xl px-4 pt-6 space-y-4 animate-pulse">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="space-y-2">
          <div className="h-7 w-40 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="bg-card border border-border rounded-xl p-4 h-10" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 h-24" />
          ))}
        </div>
      </div>
    </div>
  );
}
