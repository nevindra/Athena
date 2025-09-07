import { AppHeader } from "@/components/navigation/app-header";
import { TemplateList } from "~/features/automation/template-list";
import type { Route } from "./+types/automation.templates";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Automation Templates - Athena AI" },
    {
      name: "description",
      content: "Discover and use pre-built automation workflow templates to speed up your automation projects",
    },
  ];
}

export default function AutomationTemplates() {
  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Athena AI", href: "/" },
          { label: "Automation", href: "#" },
          { label: "Templates", isCurrentPage: true },
        ]}
      />
      <TemplateList />
    </>
  );
}