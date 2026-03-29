import Image from "next/image";
import Link from "next/link";

type Props = {
  className?: string;
  /** Nur Markierung, Text ausgeblendet (z. B. eingeklappte Sidebar auf Desktop) */
  compact?: boolean;
};

export function BrandLogo({ className = "", compact = false }: Props) {
  return (
    <Link
      href="/turniere"
      title="Zur Turnierliste"
      className={`flex items-center gap-2.5 rounded-lg outline-none ring-app-ring focus-visible:ring-2 ${
        compact ? "justify-center" : ""
      } ${className}`}
    >
      <Image
        src="/brand-mark.svg"
        alt=""
        width={40}
        height={40}
        priority
        className={`shrink-0 ${compact ? "h-8 w-8" : "h-9 w-9"}`}
      />
      <span
        className={`font-semibold tracking-tight text-app-logo ${
          compact ? "sr-only" : ""
        }`}
      >
        Turnierplaner
      </span>
    </Link>
  );
}
