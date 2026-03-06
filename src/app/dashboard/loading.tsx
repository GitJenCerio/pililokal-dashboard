export default function DashboardLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border bg-muted" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg border bg-muted" />
      <div className="h-48 animate-pulse rounded-lg border bg-muted" />
    </div>
  );
}
