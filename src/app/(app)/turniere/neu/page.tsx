import { TournamentWizard } from "@/components/tournament-wizard";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

const btnOutline =
  "inline-flex items-center justify-center rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium text-app-ink shadow-sm transition hover:border-app-primary/40 hover:bg-app-card";

export default async function NeuesTurnierPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/anmelden");
  }

  return (
    <div className="w-full px-6 py-10 lg:px-10">
      <Link href="/turniere" className={btnOutline} prefetch>
        ← Zur Turnierliste
      </Link>
      <h1 className="mt-8 text-2xl font-semibold text-app-ink">
        Turnier erstellen
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-app-muted">
        Phase 1: Name, Teilnehmerzahl, Modus und Einstellungen. Phase 2:
        alle Spieler eintragen (eine Liste oder Gruppe A / B wie im Modus).
      </p>
      <div className="mt-8 w-full rounded-2xl border border-app-border/90 bg-app-card p-6 shadow-sm sm:p-8">
        <TournamentWizard mode="create" />
      </div>
    </div>
  );
}
