"use client";

import { useRouter } from "next/navigation";

const btnOutline =
  "inline-flex items-center justify-center gap-3 rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium text-app-ink shadow-sm transition hover:border-app-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-ring/50";

type Props = { tournamentId: string };

export function TournamentEditNav({ tournamentId }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        className={btnOutline}
        onClick={() => router.push(`/turniere/${tournamentId}`)}
      >
        <span aria-hidden className="-mr-0.5 inline-flex w-5 shrink-0 items-center justify-center">
          ←
        </span>
        <span>Zurück zum Turnier</span>
      </button>
    </div>
  );
}
