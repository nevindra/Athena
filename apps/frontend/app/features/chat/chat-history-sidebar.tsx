import { Card } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Edit3,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  useDeleteSession,
  useUpdateSession,
  useUserSessions,
} from "~/hooks/use-sessions";
import { DEMO_USER_ID } from "~/services/sessions-api";

interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
  lastMessage?: string;
}

interface ChatHistorySidebarProps {
  onSelectSession: (session: ChatSession) => void;
  currentSessionId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatHistorySidebar({
  onSelectSession,
  currentSessionId,
  isOpen,
  onClose,
}: ChatHistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "favorites" | "most_active"
  >("newest");
  const [filterBy, setFilterBy] = useState<"all" | "favorites" | "recent">(
    "all"
  );
  const [favorites] = useState<Set<string>>(new Set()); // This would be managed globally
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const { data: sessions, isLoading, error } = useUserSessions(DEMO_USER_ID);
  const deleteSessionMutation = useDeleteSession(DEMO_USER_ID);
  const updateSessionMutation = useUpdateSession(DEMO_USER_ID);

  // Transform sessions data to include message count and last message
  const transformedSessions: ChatSession[] =
    sessions?.map((session) => ({
      ...session,
      messageCount: session.messages?.length || 0,
      lastMessage:
        session.messages?.[session.messages.length - 1]?.content?.slice(
          0,
          100
        ) || "",
    })) || [];

  // Filter and sort sessions
  const filteredSessions = transformedSessions
    .filter((session) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          session.title?.toLowerCase().includes(query) ||
          session.lastMessage?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .filter((session) => {
      // Category filter
      switch (filterBy) {
        case "favorites":
          return favorites.has(session.id);
        case "recent":
          const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return new Date(session.updatedAt) > oneWeekAgo;
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "favorites":
          const aHasFavorites = favorites.has(a.id);
          const bHasFavorites = favorites.has(b.id);
          if (aHasFavorites && !bHasFavorites) return -1;
          if (!aHasFavorites && bHasFavorites) return 1;
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "most_active":
          return (b.messageCount || 0) - (a.messageCount || 0);
        default: // newest
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
      }
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const minutes = Math.floor(diffInHours * 60);
      return `${minutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateText = (text: string, maxLength = 60) => {
    return text && text.length > maxLength
      ? text.slice(0, maxLength) + "..."
      : text || "";
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: -300, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -300, scale: 0.9 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8
          }}
          className="hidden md:flex w-80 lg:w-80 md:w-72 bg-white/95 backdrop-blur-sm flex-col h-[60vh] shadow-2xl shadow-black/10 rounded-2xl m-4 mr-6 relative"
        >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Chat History
              </h3>
              <p className="text-sm text-gray-500">
                Your conversations with AI assistants
              </p>
            </div>

            {/* Search and Filter Row */}
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white shadow-sm shadow-gray-200/50 border border-gray-200/40 rounded-lg focus:shadow-md focus:shadow-blue-500/20 focus:border-blue-300/60 transition-all duration-200 focus:-translate-y-0.5"
                />
              </div>
              <Select value={filterBy} onValueChange={(value: "all" | "favorites" | "recent") => setFilterBy(value)}>
                <SelectTrigger className="w-28 bg-white shadow-sm shadow-gray-200/50 border border-gray-200/40 rounded-lg focus:shadow-md focus:shadow-blue-500/20 focus:border-blue-300/60 transition-all duration-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="recent">Recent</SelectItem>
                  <SelectItem value="favorites">Favorites</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* History List */}
          <ScrollArea className="flex-1">
            <div className="px-6 pb-6 space-y-4">
              {/* Sort Options */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Recent Chats
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100/50 rounded-md"
                    >
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSortBy("newest")}>
                      Newest first
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("oldest")}>
                      Oldest first
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy("most_active")}>
                      Most active
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-white shadow-lg shadow-gray-200/50 border border-gray-200/40 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                  </div>
                  <p className="text-sm text-gray-600">Loading conversations...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-white shadow-lg shadow-red-200/50 border border-red-200/40 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-5 w-5 text-red-500" />
                  </div>
                  <p className="text-sm text-gray-800 mb-2">
                    Failed to load conversations
                  </p>
                  <p className="text-xs text-gray-500">Please try again later</p>
                </div>
              )}

              {/* Empty State */}
              {!isLoading && !error && filteredSessions.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-white shadow-lg shadow-gray-200/50 border border-gray-200/40 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-800 mb-2">
                    No conversations found
                  </p>
                  {searchQuery ? (
                    <p className="text-xs text-gray-500">Try different search terms</p>
                  ) : (
                    <p className="text-xs text-gray-500">Start a new chat to see it here</p>
                  )}
                </div>
              )}

              {/* Session List */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {filteredSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.3 + (index * 0.05),
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }}
                  >
                  <Card
                    key={session.id}
                    className={`px-3 py-2 cursor-pointer transition-all duration-200 group hover:shadow-lg hover:-translate-y-1 rounded-md ${currentSessionId === session.id
                      ? "bg-white shadow-md shadow-blue-500/20 border border-blue-200/60"
                      : "bg-white/90 shadow-sm shadow-gray-200/50 border border-gray-200/40 hover:shadow-md hover:shadow-gray-300/60"
                      }`}
                    onClick={() => onSelectSession(session)}
                  >
                    {editingSession === session.id ? (
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
                        className="h-7 text-sm border-border/50 bg-background/50"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                          <h4 className="text-sm font-medium leading-tight group-hover:text-blue-600 truncate flex-1 mr-2">
                            {session.title || "Untitled Chat"}
                          </h4>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatDate(session.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {favorites.has(session.id) && (
                            <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                          )}
                          {/* Quick Actions */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted rounded-md"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-2.5 w-2.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-40" align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectSession(session);
                                }}
                              >
                                <MessageSquare className="h-3 w-3 mr-2" />
                                Open
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => handleStartRename(session, e)}
                                disabled={updateSessionMutation.isPending}
                              >
                                <Edit3 className="h-3 w-3 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) =>
                                  handleDeleteSession(session.id, e)
                                }
                                disabled={deleteSessionMutation.isPending}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )}
                  </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200/30">
            <div className="text-center">
              <p className="text-xs text-gray-500">
                {filteredSessions.length} of {transformedSessions.length}{" "}
                conversations
              </p>
            </div>
          </div>
        </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
