import { AppLayoutShell } from "@/components/app-layout-shell";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayoutShell>{children}</AppLayoutShell>;
}
