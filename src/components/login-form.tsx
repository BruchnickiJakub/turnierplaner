"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

const inputClass =
  "rounded-xl border border-app-border bg-app-card px-3 py-2 text-app-ink outline-none transition focus:border-app-primary focus:ring-2 focus:ring-app-ring/40";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get("fehler") === "auth") {
      setError("Anmeldung über den Link ist fehlgeschlagen. Bitte erneut anmelden.");
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (err) {
      setError(
        err.message.includes("Invalid login credentials")
          ? "E-Mail oder Passwort falsch – oder Konto noch nicht bestätigt (Supabase: E-Mail-Bestätigung)."
          : err.message,
      );
      return;
    }

    router.push("/turniere");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-app-ink">
          E-Mail
        </label>
        <input
          id="email"
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
        <label htmlFor="password" className="text-sm font-medium text-app-ink">
          Passwort
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-app-primary px-4 py-2.5 text-sm font-medium text-app-card shadow-md shadow-app-primary/20 transition hover:bg-app-primary-hover disabled:opacity-60"
      >
        {loading ? "…" : "Anmelden"}
      </button>
      <p className="text-center text-sm text-app-muted">
        Noch kein Konto?{" "}
        <Link
          href="/registrieren"
          className="font-medium text-app-primary underline decoration-app-primary/40 underline-offset-2 hover:text-app-primary-hover"
        >
          Registrieren
        </Link>
      </p>
    </form>
  );
}
