import { RegisterForm } from "@/components/register-form";
import Link from "next/link";

export default function RegistrierenPage() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-app-canvas px-6 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-app-border/90 bg-app-card p-8 shadow-md">
        <h1 className="text-center text-xl font-semibold text-app-ink">
          Registrieren
        </h1>
        <p className="mt-1 text-center text-sm text-app-muted">Neues Konto</p>
        <div className="mt-8">
          <RegisterForm />
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
