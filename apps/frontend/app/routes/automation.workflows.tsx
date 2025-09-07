import { AppHeader } from "@/components/navigation/app-header";
import { WorkflowBuilder } from "~/features/automation/workflow-builder";
import type { Route } from "./+types/automation.workflows";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Workflow Builder - Athena AI" },
    {
      name: "description",
      content: "Create and manage automation workflows with drag-and-drop interface",
    },
  ];
}

export default function AutomationWorkflows() {
  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Athena AI", href: "/" },
          { label: "Automation", href: "#" },
          { label: "Workflow Builder", isCurrentPage: true },
        ]}
      />
      <WorkflowBuilder />
    </>
  );
}