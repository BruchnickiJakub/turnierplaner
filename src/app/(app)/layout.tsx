import { AppSidebar } from "@/components/app-sidebar";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh w-full">
      <AppSidebar />
      <div className="min-h-dvh min-w-0 w-full flex-1 bg-app-surface">
        {children}
      </div>
    </div>
  );
}
