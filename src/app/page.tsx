import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-app-canvas px-6 py-16">
      <main className="w-full max-w-lg text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-app-subtle">
          Willkommen
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-app-ink sm:text-4xl">
          Kurz einsteigen
        </h1>
        <p className="mt-4 text-base leading-relaxed text-app-muted">
          Registrieren oder anmelden. Nach der Anmeldung gelangst du zu deiner
          persönlichen Übersicht.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/registrieren"
            className="inline-flex items-center justify-center rounded-xl bg-app-primary px-6 py-3 text-sm font-medium text-app-card shadow-md shadow-app-primary/25 transition hover:bg-app-primary-hover"
          >
            Registrieren
          </Link>
          <Link
            href="/anmelden"
            className="inline-flex items-center justify-center rounded-xl border border-app-border bg-app-card px-6 py-3 text-sm font-medium text-app-ink shadow-sm transition hover:border-app-primary/35 hover:bg-app-card"
          >
            Anmelden
          </Link>
        </div>
      </main>
    </div>
  );
}
