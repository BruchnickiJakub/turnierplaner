import { LoginForm } from "@/components/login-form";
import Link from "next/link";
import { Suspense } from "react";

export default function AnmeldenPage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-app-canvas px-4 py-10 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))] sm:px-6 sm:py-16">
      <div className="w-full max-w-sm rounded-2xl border border-app-border/90 bg-app-card p-5 shadow-md sm:p-8">
        <h1 className="text-center text-xl font-semibold text-app-ink">
          Anmelden
        </h1>
        <p className="mt-1 text-center text-sm text-app-muted">
          E-Mail und Passwort
        </p>
        <div className="mt-8">
          <Suspense
            fallback={
              <p className="text-center text-sm text-app-muted">Laden…</p>
            }
          >
            <LoginForm />
          </Suspense>
        </div>
      </div>
      <Link
        href="/"
        className="mt-8 rounded-xl px-4 py-2 text-sm font-medium text-app-muted transition hover:bg-app-sidebar/50 hover:text-app-ink"
      >
        Startseite
      </Link>
    </div>
  );
}
