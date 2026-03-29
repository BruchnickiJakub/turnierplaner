import { AppLayoutShell } from "@/components/app-layout-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userEmail = user?.email?.trim() ?? null;

  return (
    <AppLayoutShell userEmail={userEmail}>{children}</AppLayoutShell>
  );
}
