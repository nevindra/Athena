import { AppHeader } from "@/components/navigation/app-header";
import { ApiHistoryTable } from "@/features/api-management/api-history-table";
import type { Route } from "./+types/api-management.history";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "API History - Athena AI" },
    {
      name: "description",
      content: "View detailed history of API calls and usage",
    },
  ];
}

export default function ApiHistory() {
  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Athena AI", href: "/" },
          { label: "API Management", href: "/api-management" },
          { label: "API History", isCurrentPage: true },
        ]}
      />
      <div className="flex-1 space-y-4 p-4 md:p-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">API History</h1>
          <p className="text-muted-foreground">
            Track and analyze your API usage patterns and performance.
          </p>
        </div>
        <ApiHistoryTable />
      </div>
    </>
  );
}