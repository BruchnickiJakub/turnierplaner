"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClass =
  "rounded-xl border border-app-border bg-app-card px-3 py-2 text-app-ink outline-none transition focus:border-app-primary focus:ring-2 focus:ring-app-ring/40";

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setShowResend(false);
    setLoading(true);

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback?next=/turniere`,
      },
    });

    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    if (data.session) {
      setInfo("Konto ist aktiv.");
      router.push("/turniere");
      router.refresh();
      return;
    }

    if (data.user) {
      setShowResend(true);
      setInfo(
        "Account angelegt. Wenn „E-Mail bestätigen“ in Supabase aktiv ist: Postfach prüfen und Link klicken, danach anmelden. Ohne Bestätigung: in Supabase unter Authentication → Providers → Email die Bestätigung für Tests abschalten.",
      );
      return;
    }

    setError("Unerwartete Antwort – bitte User-Liste in Supabase prüfen.");
  }

  async function handleResend() {
    const em = email.trim();
    if (!em) return;
    setError(null);
    setResendBusy(true);
    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email: em,
    });
    setResendBusy(false);
    if (err) setError(err.message);
    else setInfo("Erneuter Versand ausgelöst (Spam-Ordner prüfen).");
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-email" className="text-sm font-medium text-app-ink">
            E-Mail
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="reg-password" className="text-sm font-medium text-app-ink">
            Passwort
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <p className="text-xs text-app-subtle">Mindestens 6 Zeichen.</p>
        </div>
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="text-sm text-app-muted" role="status">
            {info}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-app-primary px-4 py-2.5 text-sm font-medium text-app-card shadow-md shadow-app-primary/20 transition hover:bg-app-primary-hover disabled:opacity-60"
        >
          {loading ? "…" : "Registrieren"}
        </button>
      </form>

      {showResend ? (
        <button
          type="button"
          onClick={handleResend}
          disabled={resendBusy || !email.trim()}
          className="rounded-xl border border-app-border bg-app-card px-4 py-2.5 text-sm font-medium text-app-ink shadow-sm transition hover:border-app-primary/40 hover:bg-app-surface disabled:opacity-60"
        >
          {resendBusy ? "…" : "Bestätigungsmail erneut senden"}
        </button>
      ) : null}

      <p className="text-center text-sm text-app-muted">
        Schon dabei?{" "}
        <Link
          href="/anmelden"
          className="font-medium text-app-primary underline decoration-app-primary/40 underline-offset-2 hover:text-app-primary-hover"
        >
          Anmelden
        </Link>
      </p>
    </div>
  );
}
