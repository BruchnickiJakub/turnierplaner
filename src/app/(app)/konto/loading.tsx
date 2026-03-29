export default function KontoLoading() {
  return (
    <div className="w-full animate-pulse px-6 py-10 lg:px-10">
      <div className="h-8 w-32 rounded-lg bg-app-border/60" />
      <div className="mt-2 h-4 w-64 rounded bg-app-border/40" />
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="h-56 rounded-2xl bg-app-border/30" />
        <div className="h-56 rounded-2xl bg-app-border/30" />
      </div>
    </div>
  );
}
