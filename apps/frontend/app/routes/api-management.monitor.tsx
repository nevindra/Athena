import { AppHeader } from "@/components/navigation/app-header";
import { ApiMonitoringDashboard } from "@/features/api-management/api-monitoring-dashboard";
import { ApiDocumentationDialog } from "@/features/api-management/api-documentation-dialog";
import type { Route } from "./+types/api-management.monitor";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Monitor APIs - Athena AI" },
    {
      name: "description",
      content: "Monitor API health and performance metrics",
    },
  ];
}

export default function ApiMonitor() {
  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Athena AI", href: "/" },
          { label: "API Management", href: "/api-management" },
          { label: "Monitor APIs", isCurrentPage: true },
        ]}
      />
      <div className="flex-1 space-y-4 p-4 md:p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">API Management</h1>
          <p className="text-muted-foreground">
            Register, monitor, and manage your custom AI API endpoints.
          </p>
        </div>
        <ApiMonitoringDashboard />
      </div>
    </>
  );
}