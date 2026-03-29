"use client";

import { DeleteTournamentConfirmDialog } from "@/components/delete-tournament-confirm-dialog";

const btnDanger =
  "inline-flex items-center justify-center rounded-xl border border-red-300/90 bg-app-card px-4 py-2 text-sm font-medium text-red-800 shadow-sm transition hover:bg-red-50";

type Props = { tournamentId: string };

export function TournamentListDeleteButton({ tournamentId }: Props) {
  return (
    <DeleteTournamentConfirmDialog
      tournamentId={tournamentId}
      triggerLabel="Löschen"
      triggerClassName={btnDanger}
    />
  );
}
