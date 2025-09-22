"use client";

import { Edit3, MoreHorizontal, Plus, Trash2 } from "lucide-react";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import {
  useDeleteSession,
  useUpdateSession,
  useUserSessions,
} from "~/hooks/use-sessions";
import { useAuthenticatedUserId } from "~/hooks/use-current-user";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export function NavChatHistory() {
  const { isMobile } = useSidebar();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const userId = useAuthenticatedUserId();
  const { data: sessions, isLoading, error } = useUserSessions(userId);
  const deleteSessionMutation = useDeleteSession(userId);
  const updateSessionMutation = useUpdateSession(userId);

  const handleNewChat = () => {
    setIsCreatingChat(true);
    // Navigate to home to start a new chat
    window.location.href = "/";
  };

  const handleDeleteSession = async (
    sessionId: string,
    event: React.MouseEvent
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (window.confirm("Are you sure you want to delete this chat?")) {
      try {
        await deleteSessionMutation.mutateAsync(sessionId);
      } catch (error) {
        console.error("Failed to delete session:", error);
        alert("Failed to delete chat. Please try again.");
      }
    }
  };

  const handleStartRename = (session: ChatSession, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setEditingSession(session.id);
    setNewTitle(session.title || "");
  };

  const handleSaveRename = async (sessionId: string) => {
    if (!newTitle.trim()) return;

    try {
      await updateSessionMutation.mutateAsync({
        sessionId,
        title: newTitle.trim(),
      });
      setEditingSession(null);
      setNewTitle("");
    } catch (error) {
      console.error("Failed to rename session:", error);
      alert("Failed to rename chat. Please try again.");
    }
  };

  const handleCancelRename = () => {
    setEditingSession(null);
    setNewTitle("");
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Chat History</SidebarGroupLabel>
      <SidebarMenu>
        {/* New Chat Button */}
        <SidebarMenuItem>
          <SidebarMenuButton onClick={handleNewChat} disabled={isCreatingChat}>
            <Plus className="h-4 w-4 text-sidebar-foreground" />
            <span>{isCreatingChat ? "Starting..." : "New Chat"}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* Loading State */}
        {isLoading && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <span className="text-sidebar-foreground/50 text-sm">
                Loading...
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {/* Error State */}
        {error && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <span className="text-destructive text-sm">Failed to load</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}

        {/* Chat Sessions */}
        {sessions?.map((session) => (
          <SidebarMenuItem key={session.id}>
            {editingSession === session.id ? (
              <div className="flex items-center px-2 py-1">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveRename(session.id);
                    } else if (e.key === "Escape") {
                      handleCancelRename();
                    }
                  }}
                  onBlur={() => handleSaveRename(session.id)}
                  className="h-6 text-sm border-none bg-transparent focus-visible:ring-1 focus-visible:ring-primary/20 px-1"
                  autoFocus
                />
              </div>
            ) : (
              <SidebarMenuButton asChild>
                <a href={`/chat/${session.id}`} className="block">
                  <span className="truncate text-sm">
                    {session.title || "Untitled Chat"}
                  </span>
                </a>
              </SidebarMenuButton>
            )}
            {editingSession !== session.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem asChild>
                    <a href={`/chat/${session.id}`}>
                      <span>Open Chat</span>
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => handleStartRename(session, e)}
                    disabled={updateSessionMutation.isPending}
                  >
                    <Edit3 className="h-4 w-4 text-muted-foreground" />
                    <span>Rename</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    disabled={deleteSessionMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                    <span>Delete Chat</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarMenuItem>
        ))}

        {/* Empty State */}
        {!isLoading && !error && (!sessions || sessions.length === 0) && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <span className="text-sidebar-foreground/50 text-sm">
                No chats yet
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
