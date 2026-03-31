import { TournamentListDeleteButton } from "@/components/tournament-list-delete-button";
import { createClient } from "@/lib/supabase/server";
import type { TournamentRow } from "@/types/tournament";
import { getModusLabel } from "@/lib/tournament-modes";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TurnierePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/anmelden");
  }

  const { data, error } = await supabase
    .from("tournaments")
    .select(
      "id, user_id, title, sport, description, team_count, modus_key, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as TournamentRow[];

  const btnPrimary =
    "inline-flex items-center justify-center rounded-xl bg-app-primary px-5 py-2.5 text-sm font-medium text-app-card shadow-md shadow-app-primary/20 transition hover:bg-app-primary-hover";
  const btnOutline =
    "inline-flex items-center justify-center rounded-xl border border-app-border bg-app-card px-5 py-2.5 text-sm font-medium text-app-ink shadow-sm transition hover:border-app-primary/40 hover:bg-app-card";
  const btnEdit =
    "inline-flex items-center justify-center rounded-xl border border-app-border bg-app-card px-4 py-2 text-sm font-medium text-app-ink shadow-sm transition hover:border-app-primary/40 hover:bg-app-surface/50";

  return (
    <div className="w-full px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-10 lg:px-10">
      <header className="flex flex-col gap-4 border-b border-app-border/80 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-app-ink">Meine Turniere</h1>
          <p className="mt-1 text-sm text-app-muted">
            Übersicht deiner angelegten Turniere
          </p>
        </div>
        <Link href="/turniere/neu" className={btnPrimary} prefetch>
          Turnier erstellen
        </Link>
      </header>

      {error ? (
        <div className="mt-8 rounded-xl border border-app-accent/40 bg-app-accent-soft/50 p-4 text-sm text-app-ink">
          <p className="font-medium text-app-primary">Datenbank meldet einen Fehler</p>
          <p className="mt-2 text-app-muted">
            SQL:{" "}
            <code className="rounded bg-app-card/90 px-1.5 py-0.5 text-app-ink">
              supabase-migration-wizard-fields.sql
            </code>
            ,{" "}
            <code className="rounded bg-app-card/90 px-1.5 py-0.5 text-app-ink">
              supabase-migration-participant-names.sql
            </code>
            . Fehler: {error.message}
          </p>
        </div>
      ) : null}

      <div className="mt-8">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-app-border bg-app-card px-8 py-16 text-center shadow-sm">
            <p className="text-app-muted">Du hast noch kein Turnier angelegt.</p>
            <Link href="/turniere/neu" className={`${btnPrimary} mt-6`} prefetch>
              Turnier erstellen
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {rows.map((t) => (
              <li key={t.id}>
                <div className="relative rounded-2xl border border-app-border/90 bg-app-card p-6 shadow-sm transition hover:border-app-primary/35 hover:shadow-md">
                  <Link
                    href={`/turniere/${t.id}`}
                    className="absolute inset-0 z-0 rounded-2xl"
                    prefetch
                    aria-label={`Turnier „${t.title}“ öffnen`}
                  />
                  <div className="relative z-10 flex flex-col gap-4 pointer-events-none sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-semibold text-app-ink">
                        {t.title}
                      </h2>
                      <p className="mt-0.5 text-sm text-app-muted">
                        {t.team_count != null
                          ? `${t.team_count} Teilnehmer`
                          : "Turnier"}
                      </p>
                      <p className="mt-3 text-sm text-app-subtle">
                        {getModusLabel(t.modus_key)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 pointer-events-auto sm:justify-end">
                      <Link
                        href={`/turniere/bearbeiten/${t.id}`}
                        className={btnEdit}
                        prefetch
                      >
                        Bearbeiten
                      </Link>
                      <TournamentListDeleteButton tournamentId={t.id} />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {rows.length > 0 ? (
        <div className="mt-8 flex justify-start">
          <Link href="/turniere/neu" className={btnOutline} prefetch>
            Weiteres Turnier erstellen
          </Link>
        </div>
      ) : null}
    </div>
  );
}
