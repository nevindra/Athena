import { AppHeader } from "@/components/navigation/app-header";
import { WelcomeScreen } from "~/features/welcome";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Athena - AI Assistant" },
    {
      name: "description",
      content: "Your intelligent AI assistant ready to help with any task",
    },
  ];
}

export default function Home() {
  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Athena AI", href: "/" },
          { label: "Welcome", isCurrentPage: true },
        ]}
      />
      <WelcomeScreen />
    </>
  );
}
