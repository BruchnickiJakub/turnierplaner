"use client";

import { deleteTournament } from "@/app/(app)/turniere/actions";
import { useEffect, useId, useState } from "react";

type Props = {
  tournamentId: string;
  triggerLabel: string;
  triggerClassName: string;
};

export function DeleteTournamentConfirmDialog({
  tournamentId,
  triggerLabel,
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => setOpen(true)}
      >
        {triggerLabel}
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-app-ink/45 p-4 backdrop-blur-[3px]"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-app-border/95 bg-app-card p-6 shadow-2xl shadow-app-ink/20 ring-1 ring-app-border/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id={titleId}
              className="text-lg font-semibold text-app-ink"
            >
              Turnier wirklich löschen?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-app-muted">
              Dieses Turnier und alle zugehörigen Daten werden dauerhaft
              entfernt. Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
            <form action={deleteTournament} className="mt-8 flex flex-wrap justify-end gap-3">
              <input type="hidden" name="id" value={tournamentId} />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium text-app-ink shadow-sm transition hover:bg-app-surface/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring/45"
                onClick={() => setOpen(false)}
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl border border-red-400/90 bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-red-900/25 transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
              >
                Endgültig löschen
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
