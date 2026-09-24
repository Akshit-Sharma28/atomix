export default function DashboardLoading() {
  return (
    <div className="w-full animate-pulse px-4 py-5 sm:px-6 2xl:px-8">
      <div className="mb-6 border-b border-slate-800 pb-5 pr-32 sm:pr-40">
        <div className="h-8 w-64 rounded-lg bg-slate-800" />
        <div className="mt-3 h-4 max-w-xl rounded bg-slate-900" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-28 rounded-2xl border border-slate-800 bg-slate-900/70"
          />
        ))}
      </div>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-24 rounded-2xl border border-slate-800 bg-slate-900/60"
          />
        ))}
      </div>
    </div>
  );
}
