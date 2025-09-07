import { AppHeader } from "@/components/navigation/app-header";
import { FileManager } from "~/features/knowledge-base/file-manager";
import type { Route } from "./+types/knowledge-base";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Knowledge Base - Athena AI" },
    {
      name: "description",
      content: "Manage your files and documents in the knowledge base",
    },
  ];
}

export default function KnowledgeBase() {
  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Athena AI", href: "/" },
          { label: "Knowledge Base", isCurrentPage: true },
        ]}
      />
      <FileManager />
    </>
  );
}
