"use client";

import { AppSidebar, type AppSidebarDisplayMode } from "@/components/app-sidebar";
import { useMediaQuery } from "@/lib/use-media-query";
import { useEffect, useState } from "react";

const SIDEBAR_COLLAPSED_KEY = "turnierplaner-sidebar-collapsed";

function IconMenu(props: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.75}
      stroke="currentColor"
      className={props.className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
      />
    </svg>
  );
}

export function AppLayoutShell({
  children,
  userEmail,
}: {
  children: React.ReactNode;
  userEmail: string | null;
}) {
  const isLg = useMediaQuery("(min-width: 1024px)");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    try {
      setDesktopCollapsed(
        localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1",
      );
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(
        SIDEBAR_COLLAPSED_KEY,
        desktopCollapsed ? "1" : "0",
      );
    } catch {
      /* ignore */
    }
  }, [hydrated, desktopCollapsed]);

  const lg = isLg === true;

  const displayMode: AppSidebarDisplayMode = lg
    ? desktopCollapsed
      ? "compact"
      : "expanded"
    : "drawer";

  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  useEffect(() => {
    if (isLg === true) setDrawerOpen(false);
  }, [isLg]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (drawerOpen) setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const navExpanded = lg ? !desktopCollapsed : drawerOpen;

  const toggleNav = () => {
    if (lg) {
      setDesktopCollapsed((c) => !c);
    } else {
      setDrawerOpen((o) => !o);
    }
  };

  return (
    <div className="flex min-h-dvh min-h-[100dvh] w-full">
      <AppSidebar
        displayMode={displayMode}
        drawerOpen={drawerOpen}
        userEmail={userEmail}
        onNavigate={() => setDrawerOpen(false)}
      />

      {drawerOpen && !lg ? (
        <button
          type="button"
          aria-label="Menü schließen"
          className="fixed inset-0 z-40 bg-app-ink/45 backdrop-blur-[2px] lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      ) : null}

      <div className="flex min-h-dvh min-h-[100dvh] min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center gap-2 border-b border-app-border/70 bg-app-surface/95 px-3 pt-[max(0.25rem,env(safe-area-inset-top))] pb-2 backdrop-blur-md supports-[backdrop-filter]:bg-app-surface/88 sm:gap-3 sm:px-4">
          <button
            type="button"
            className="inline-flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl text-app-ink ring-app-ring transition hover:bg-app-card active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2"
            aria-expanded={navExpanded}
            aria-controls="app-sidebar-drawer"
            onClick={toggleNav}
            title={
              lg
                ? desktopCollapsed
                  ? "Navigation ausklappen"
                  : "Navigation einklappen"
                : undefined
            }
          >
            <IconMenu className="h-6 w-6" />
            <span className="sr-only">
              {lg
                ? desktopCollapsed
                  ? "Navigation ausklappen"
                  : "Navigation einklappen"
                : drawerOpen
                  ? "Menü schließen"
                  : "Menü öffnen"}
            </span>
          </button>
        </header>

        <div
          className="min-w-0 flex-1 bg-app-surface pb-[env(safe-area-inset-bottom)]"
          id="main-content"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
