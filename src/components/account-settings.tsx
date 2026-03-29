"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { initialEmail: string | null };

export function AccountSettings({ initialEmail }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const inputClass =
    "w-full rounded-xl border border-app-border bg-app-card px-3.5 py-2.5 text-app-ink shadow-sm outline-none transition focus:border-app-primary focus:ring-2 focus:ring-app-ring/35";
  const btnPrimary =
    "inline-flex items-center justify-center rounded-xl bg-app-primary px-5 py-2.5 text-sm font-medium text-app-card shadow-md shadow-app-primary/20 transition hover:bg-app-primary-hover disabled:opacity-60";

  const cardShell =
    "relative overflow-hidden rounded-2xl border border-app-border/90 bg-app-card shadow-sm";
  const cardAccent =
    "pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-app-primary/90 via-app-primary/60 to-app-primary/30";

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setEmailErr(null);
    setEmailMsg(null);
    const next = email.trim();
    if (!next) {
      setEmailErr("E-Mail darf nicht leer sein.");
      return;
    }
    if (next === (initialEmail ?? "")) {
      setEmailMsg("Das ist bereits deine aktuelle E-Mail.");
      return;
    }
    setEmailBusy(true);
    const { error } = await supabase.auth.updateUser({ email: next });
    setEmailBusy(false);
    if (error) {
      setEmailErr(error.message);
      return;
    }
    setEmailMsg(
      "Bestätigungslink wurde an die neue Adresse geschickt (je nach Supabase-Einstellung). Danach gilt die neue E-Mail.",
    );
    router.refresh();
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwErr(null);
    setPwMsg(null);
    if (pw1.length < 6) {
      setPwErr("Passwort mindestens 6 Zeichen.");
      return;
    }
    if (pw1 !== pw2) {
      setPwErr("Passwörter stimmen nicht überein.");
      return;
    }
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw1 });
    setPwBusy(false);
    if (error) {
      setPwErr(error.message);
      return;
    }
    setPw1("");
    setPw2("");
    setPwMsg("Passwort wurde geändert.");
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-app-subtle">
          Zugangsdaten
        </p>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-app-muted">
          Aktualisiere deine Anmeldedaten. Änderungen am Passwort gelten sofort;
          bei der E-Mail kann eine Bestätigung nötig sein.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10 lg:items-start">
        <section className={cardShell}>
          <span className={cardAccent} aria-hidden />
          <div className="p-6 pt-7 sm:p-7 sm:pt-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-app-ink">
                  E-Mail ändern
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-app-muted">
                  Du erhältst ggf. eine Bestätigung an die neue Adresse.
                </p>
              </div>
              <span
                className="hidden shrink-0 rounded-lg bg-app-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-app-muted sm:inline-block"
                title="Profil"
              >
                Profil
              </span>
            </div>
            <form onSubmit={submitEmail} className="mt-6 flex flex-col gap-4">
              <label className="block">
                <span className="text-sm font-medium text-app-ink">
                  Neue E-Mail
                </span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              {emailErr ? (
                <p className="text-sm text-red-700" role="alert">
                  {emailErr}
                </p>
              ) : null}
              {emailMsg ? (
                <p className="text-sm text-app-muted" role="status">
                  {emailMsg}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={emailBusy}
                className={`${btnPrimary} w-full sm:w-fit`}
              >
                {emailBusy ? "Speichern…" : "E-Mail speichern"}
              </button>
            </form>
          </div>
        </section>

        <section className={cardShell}>
          <span className={cardAccent} aria-hidden />
          <div className="p-6 pt-7 sm:p-7 sm:pt-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-app-ink">
                  Passwort ändern
                </h2>
                <p className="mt-1.5 text-sm leading-relaxed text-app-muted">
                  Neues Passwort setzen (mindestens 6 Zeichen).
                </p>
              </div>
              <span
                className="hidden shrink-0 rounded-lg bg-app-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-app-muted sm:inline-block"
                title="Sicherheit"
              >
                Sicherheit
              </span>
            </div>
            <form
              onSubmit={submitPassword}
              className="mt-6 flex flex-col gap-4"
            >
              <label className="block">
                <span className="text-sm font-medium text-app-ink">
                  Neues Passwort
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pw1}
                  onChange={(e) => setPw1(e.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-app-ink">
                  Passwort wiederholen
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  value={pw2}
                  onChange={(e) => setPw2(e.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </label>
              {pwErr ? (
                <p className="text-sm text-red-700" role="alert">
                  {pwErr}
                </p>
              ) : null}
              {pwMsg ? (
                <p className="text-sm text-app-muted" role="status">
                  {pwMsg}
                </p>
              ) : null}
              <button
                type="submit"
                disabled={pwBusy}
                className={`${btnPrimary} w-full sm:w-fit`}
              >
                {pwBusy ? "Speichern…" : "Passwort speichern"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
