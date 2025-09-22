import { AppHeader } from "@/components/navigation/app-header";
import { WelcomeScreen } from "~/features/welcome";
import { ChatHistorySidebar } from "~/features/chat/chat-history-sidebar";
import { useState } from "react";
import { useNavigate } from "react-router";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Athena - AI Assistant" },
    {
      name: "description",
      content: "Your intelligent AI assistant ready to help with any task",
    },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleHistoryToggle = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  const handleSelectSession = (session: any) => {
    navigate(`/chat/${session.id}`);
    setIsHistoryOpen(false); // Close sidebar when selecting a session
  };

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Athena AI", href: "/" },
          { label: "Welcome", isCurrentPage: true },
        ]}
        showHistoryToggle={true}
        onHistoryToggle={handleHistoryToggle}
        isHistoryOpen={isHistoryOpen}
      />
      <div className="flex h-full">
        <WelcomeScreen isSidebarOpen={isHistoryOpen} />
        <ChatHistorySidebar
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onSelectSession={handleSelectSession}
        />
      </div>
    </>
  );
}
