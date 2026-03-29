import { AccountSettings } from "@/components/account-settings";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "./actions";

export default async function KontoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/anmelden");
  }

  const email = user.email ?? "";
  const btnSignOut =
    "inline-flex items-center justify-center rounded-xl border border-red-400/85 bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-red-900/20 transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/55";

  return (
    <div className="min-h-dvh w-full px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <header className="border-b border-app-border/80 pb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-app-ink">
            Konto
          </h1>
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-app-muted">
            <span>Eingeloggt als</span>
            <span className="inline-flex max-w-full items-center rounded-full border border-app-border/90 bg-app-card px-3 py-0.5 font-medium text-app-ink shadow-sm truncate">
              {email || "—"}
            </span>
          </p>
        </header>

        <div className="mt-10">
          <AccountSettings initialEmail={user.email ?? null} />
        </div>

        <footer className="mt-14 flex flex-col gap-4 border-t border-app-border/70 pt-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-app-muted">Sitzung beenden.</p>
          <form action={signOut}>
            <button type="submit" className={btnSignOut}>
              Abmelden
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}
