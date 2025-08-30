"use client";

import {
  MoreHorizontal,
  Trash2,
  Edit3,
  Plus,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = "http://localhost:3000/api";
const USER_ID = "01HZXM0K1QRST9VWXYZ01234AB";

export function NavChatHistory() {
  const { isMobile } = useSidebar();
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const queryClient = useQueryClient();

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ["user-sessions", USER_ID],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/sessions?userId=${USER_ID}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || "Failed to fetch sessions");
      }

      return result.data as ChatSession[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds to stay updated
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete session");
      }
      
      return sessionId;
    },
    onSuccess: () => {
      // Invalidate and refetch sessions
      queryClient.invalidateQueries({ queryKey: ["user-sessions", USER_ID] });
    },
  });

  const updateSessionMutation = useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: string; title: string }) => {
      const response = await fetch(`${API_BASE}/sessions/${sessionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update session");
      }
      
      return { sessionId, title };
    },
    onSuccess: () => {
      // Invalidate and refetch sessions
      queryClient.invalidateQueries({ queryKey: ["user-sessions", USER_ID] });
      setEditingSession(null);
      setNewTitle("");
    },
  });

  const handleNewChat = () => {
    setIsCreatingChat(true);
    // Navigate to home to start a new chat
    window.location.href = "/";
  };

  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
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
              <span className="text-sidebar-foreground/50 text-sm">Loading...</span>
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
                  <span className="truncate text-sm">{session.title || "Untitled Chat"}</span>
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
              <span className="text-sidebar-foreground/50 text-sm">No chats yet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
