import type { ReactNode } from "react";

export default function ZuschauenLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-app-canvas">
      <header className="border-b border-app-border/80 bg-app-card/90 px-4 py-3 shadow-sm sm:px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-app-subtle">
          Zuschauer — Lesen nur
        </p>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
