import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardErrorBoundary } from "@/components/shared/dashboard-error-boundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardShell>
      <DashboardErrorBoundary>{children}</DashboardErrorBoundary>
    </DashboardShell>
  );
}
