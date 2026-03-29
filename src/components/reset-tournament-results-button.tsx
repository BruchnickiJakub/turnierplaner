"use client";

import { resetTournamentResults } from "@/app/(app)/turniere/plan-actions";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useState, useTransition } from "react";

const btnTriggerClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-app-border/90 bg-app-card px-4 py-2.5 text-sm font-medium text-app-ink shadow-sm transition hover:border-red-300/80 hover:bg-red-50/80 active:scale-[0.99] disabled:opacity-60 sm:w-auto sm:min-h-0 sm:shrink-0";

type Props = { tournamentId: string };

export function ResetTournamentResultsButton({ tournamentId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const titleId = useId();
  const descId = useId();

  const runReset = useCallback(() => {
    setError(null);
    setDialogOpen(false);
    startTransition(() => {
      void (async () => {
        const res = await resetTournamentResults(tournamentId);
        if (!res.ok) {
          setError(res.error);
          return;
        }
        router.refresh();
      })();
    });
  }, [tournamentId, router]);

  useEffect(() => {
    if (!dialogOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDialogOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [dialogOpen]);

  return (
    <div className="flex min-w-0 flex-col items-stretch gap-1 sm:inline-flex sm:w-auto sm:shrink-0">
      <button
        type="button"
        disabled={pending}
        className={btnTriggerClass}
        onClick={() => setDialogOpen(true)}
      >
        {pending ? "Setze zurück…" : "Ergebnisse zurücksetzen"}
      </button>
      {error ? (
        <p className="text-xs text-red-700" role="alert">
          {error}
        </p>
      ) : null}

      {dialogOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center sm:pb-6"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Dialog schließen"
            className="absolute inset-0 bg-app-ink/35 backdrop-blur-[2px] transition-opacity"
            onClick={() => setDialogOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            className="relative z-10 max-h-[min(90dvh,calc(100%-2rem))] w-full max-w-md overflow-y-auto rounded-2xl border border-app-border/80 bg-app-card p-5 shadow-xl shadow-app-ink/15 ring-2 ring-app-primary/25 sm:p-6"
          >
            <div
              className="absolute -left-px -right-px -top-px h-1.5 rounded-t-2xl bg-gradient-to-r from-app-primary/80 via-app-accent/70 to-app-primary/80"
              aria-hidden
            />
            <h2
              id={titleId}
              className="pr-8 text-lg font-semibold tracking-tight text-app-ink"
            >
              Ergebnisse zurücksetzen?
            </h2>
            <p id={descId} className="mt-3 text-sm leading-relaxed text-app-muted">
              Alle Tore aus Vorrunde und K.O.-Runde werden gelöscht. Die
              Spielpaarungen und Teilnehmer bleiben unverändert; die Tabellen
              zeigen wieder Nullen, bis du neu einträgst.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end sm:gap-3">
              <button
                type="button"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-app-border bg-app-surface/60 px-4 py-2.5 text-sm font-medium text-app-ink transition hover:border-app-primary/35 hover:bg-app-surface sm:w-auto sm:min-h-[2.75rem]"
                onClick={() => setDialogOpen(false)}
              >
                Abbrechen
              </button>
              <button
                type="button"
                disabled={pending}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-red-200/90 bg-red-50/90 px-4 py-2.5 text-sm font-semibold text-red-900 shadow-sm transition hover:bg-red-100 disabled:opacity-60 sm:w-auto sm:min-h-[2.75rem]"
                onClick={runReset}
              >
                {pending ? "Wird gelöscht…" : "Ja, zurücksetzen"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
