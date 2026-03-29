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

function IconUser(props: { className?: string }) {
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
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function NavButton({
  href,
  label,
  icon,
  fullWidth,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  fullWidth?: boolean;
}) {
  const pathname = usePathname();
  const active =
    href === "/turniere"
      ? pathname === "/turniere"
      : pathname === href || pathname.startsWith(href + "/");

  const layout = fullWidth ? "w-full justify-start px-4 py-3" : "px-4 py-2.5";

  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 text-sm font-semibold tracking-tight transition-all duration-200 ${layout} rounded-xl ${
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
      <span>{label}</span>
    </Link>
  );
}

export function AppSidebar() {
  return (
    <aside className="sticky top-0 flex h-dvh w-72 shrink-0 flex-col overflow-y-auto border-r border-app-border/70 bg-gradient-to-b from-app-sidebar via-app-sidebar to-app-sidebar/95 py-6 shadow-sm">
      <div className="px-4">
        <BrandLogo />
      </div>
      <nav className="mt-10 flex flex-col gap-2.5 px-3" aria-label="Hauptmenü">
        <NavButton
          href="/turniere"
          fullWidth
          label="Turnierliste"
          icon={<IconQueueList className="h-[1.15rem] w-[1.15rem]" />}
        />
      </nav>
      <div className="min-h-0 flex-1" aria-hidden />
      <nav
        className="mt-auto border-t border-app-border/55 px-3 pt-5 pb-1"
        aria-label="Konto"
      >
        <NavButton
          href="/konto"
          fullWidth
          label="Konto"
          icon={<IconUser className="h-[1.15rem] w-[1.15rem]" />}
        />
      </nav>
    </aside>
  );
}
