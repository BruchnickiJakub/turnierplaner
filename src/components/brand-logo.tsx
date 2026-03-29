import Image from "next/image";
import Link from "next/link";

type Props = { className?: string };

export function BrandLogo({ className = "" }: Props) {
  return (
    <Link
      href="/turniere"
      className={`flex items-center gap-2.5 rounded-lg outline-none ring-app-ring focus-visible:ring-2 ${className}`}
    >
      <Image
        src="/brand-mark.svg"
        alt=""
        width={40}
        height={40}
        priority
        className="h-9 w-9 shrink-0"
      />
      <span className="font-semibold tracking-tight text-app-logo">
        Turnierplaner
      </span>
    </Link>
  );
}
