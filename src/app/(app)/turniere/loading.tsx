export default function TurniereLoading() {
  return (
    <div className="w-full animate-pulse px-6 py-10 lg:px-10">
      <div className="h-8 w-48 rounded-lg bg-app-border/60" />
      <div className="mt-2 h-4 w-72 max-w-full rounded bg-app-border/40" />
      <div className="mt-10 h-32 rounded-2xl bg-app-border/30" />
      <div className="mt-4 h-32 rounded-2xl bg-app-border/25" />
    </div>
  );
}
