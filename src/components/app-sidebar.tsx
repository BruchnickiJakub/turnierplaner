"use client";

import { BrandLogo } from "@/components/brand-logo";
import Link from "next/link";
import { usePathname } from "next/navigation";

function IconQueueList(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={props.className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75zm0-2.25v.75m0 3v.75"
      />
    </svg>
  );
}

function IconEnvelope(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={props.className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function NavButton({
  href,
  label,
  icon,
  fullWidth,
  iconOnly,
  onAfterNavigate,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  fullWidth?: boolean;
  iconOnly?: boolean;
  onAfterNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active =
    href === "/turniere"
      ? pathname === "/turniere"
      : pathname === href || pathname.startsWith(href + "/");

  const layout = iconOnly
    ? "w-full justify-center px-2 py-3"
    : fullWidth
      ? "w-full justify-start px-4 py-3"
      : "px-4 py-2.5";

  return (
    <Link
      href={href}
      title={label}
      onClick={() => onAfterNavigate?.()}
      className={`group flex items-center text-sm font-semibold tracking-tight transition-all duration-200 ${
        iconOnly ? "gap-0" : "gap-3"
      } ${layout} rounded-xl ${
        active
          ? "bg-gradient-to-br from-app-primary to-app-primary-hover text-app-card shadow-lg shadow-app-primary/30 ring-2 ring-white/25"
          : "bg-app-card/95 text-app-ink shadow-sm ring-1 ring-app-border/85 hover:bg-app-card hover:shadow-md hover:ring-app-primary/25"
      }`}
    >
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
          active
            ? "bg-white/15 text-app-card"
            : "bg-app-surface/80 text-app-primary group-hover:bg-app-surface group-hover:text-app-primary"
        }`}
      >
        {icon}
      </span>
      <span className={iconOnly ? "sr-only" : ""}>{label}</span>
    </Link>
  );
}

export type AppSidebarDisplayMode = "drawer" | "expanded" | "compact";

type SidebarProps = {
  /** drawer = Schublade &lt; lg; expanded/compact = feste Spalte ab lg */
  displayMode: AppSidebarDisplayMode;
  /** Nur bei displayMode drawer: sichtbar */
  drawerOpen: boolean;
  userEmail: string | null;
  onNavigate?: () => void;
};

export function AppSidebar({
  displayMode,
  drawerOpen,
  userEmail,
  onNavigate,
}: SidebarProps) {
  const iconOnly = displayMode === "compact";
  const isDrawer = displayMode === "drawer";

  return (
    <aside
      id="app-sidebar-drawer"
      data-mode={displayMode}
      data-open={drawerOpen ? "true" : "false"}
      className={`sticky top-0 z-50 flex h-dvh shrink-0 flex-col overflow-y-auto overscroll-contain border-r border-app-border/70 bg-gradient-to-b from-app-sidebar via-app-sidebar to-app-sidebar/95 py-6 shadow-sm transition-[width] duration-300 ease-out
        max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:w-[min(18rem,calc(100vw-1rem))] max-lg:pt-[max(1.5rem,env(safe-area-inset-top))] max-lg:pb-[env(safe-area-inset-bottom)] max-lg:transition-[transform,visibility] max-lg:duration-300 max-lg:ease-out
        lg:translate-x-0 lg:pointer-events-auto lg:visible
        ${isDrawer && drawerOpen ? "max-lg:translate-x-0 max-lg:visible" : ""}
        ${isDrawer && !drawerOpen ? "max-lg:pointer-events-none max-lg:invisible max-lg:-translate-x-full" : ""}
        ${displayMode === "compact" ? "lg:w-[4.5rem]" : "lg:w-72"}
      `}
    >
      <div className={`shrink-0 ${iconOnly ? "px-2 lg:px-1.5" : "px-4"}`}>
        <BrandLogo compact={iconOnly} className={iconOnly ? "w-full" : ""} />
      </div>
      <nav
        className={`mt-10 flex flex-col gap-2.5 ${iconOnly ? "px-1.5 lg:px-1" : "px-3"}`}
        aria-label="Hauptmenü"
      >
        <NavButton
          href="/turniere"
          fullWidth
          iconOnly={iconOnly}
          label="Turnierliste"
          icon={<IconQueueList className="h-[1.15rem] w-[1.15rem]" />}
          onAfterNavigate={onNavigate}
        />
      </nav>
      <div className="min-h-0 flex-1" aria-hidden />
      <div
        className={`mt-auto shrink-0 border-t border-app-border/55 pt-5 pb-1 ${iconOnly ? "px-1.5 lg:px-1" : "px-3"}`}
      >
        {userEmail ? (
          <Link
            href="/konto"
            title={`Konto (${userEmail})`}
            onClick={() => onNavigate?.()}
            className={`group flex w-full min-w-0 items-start rounded-xl bg-app-card/80 px-3 py-3 text-left text-xs font-medium leading-snug text-app-muted ring-1 ring-app-border/70 transition hover:bg-app-card hover:text-app-ink hover:ring-app-primary/30 ${
              iconOnly ? "justify-center px-2" : "gap-3"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-app-surface/80 text-app-primary ring-1 ring-app-border/50 transition group-hover:bg-app-surface`}
            >
              <IconEnvelope className="h-[1.15rem] w-[1.15rem]" />
            </span>
            <span
              className={`min-w-0 break-all text-app-ink/90 ${iconOnly ? "sr-only" : ""}`}
            >
              {userEmail}
            </span>
          </Link>
        ) : (
          <Link
            href="/konto"
            onClick={() => onNavigate?.()}
            className="block w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-app-muted ring-1 ring-app-border/60 hover:bg-app-card/90 hover:text-app-ink"
          >
            Konto
          </Link>
        )}
      </div>
    </aside>
  );
}
