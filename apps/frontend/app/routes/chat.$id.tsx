import { AppHeader } from "@/components/navigation/app-header";
import { Button } from "@/components/ui/button";
import type { AIConfiguration } from "@athena/shared";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Message } from "~/features/chat/message";
import { ChatHistorySidebar } from "~/features/chat/chat-history-sidebar";
import { EnhancedChatInput } from "~/features/chat-input/enhanced-chat-input";
import {
  useAddMessage,
  useChatCompletion,
  useSession,
} from "~/hooks/use-sessions";
import { useSystemPromptStore } from "~/stores/system-prompt-store";
import type { Route } from "./+types/chat.$id";

export function meta({ params }: Route.MetaArgs) {
  return [
    { title: `Chat ${params.id} - Athena` },
    { name: "description", content: "AI Chat Session" },
  ];
}

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  attachments?: { type: "image"; url: string; name?: string }[];
}

interface BackendMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }> | null;
  createdAt: string;
}

export default function Chat({ params }: Route.ComponentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<AIConfiguration | null>(
    location.state?.selectedConfig || null
  );
  // Use system prompt ID from store instead of local state
  const { selectedSystemPromptId } = useSystemPromptStore();
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const sessionQuery = useSession(params.id);
  const addMessage = useAddMessage();
  const chatCompletion = useChatCompletion();

  // Check scroll position and content overflow
  const checkScrollPosition = useCallback(() => {
    if (!messagesContainerRef.current) {
      return;
    }

    const container = messagesContainerRef.current;
    const scrollTop = container.scrollTop;
    const clientHeight = container.clientHeight;
    const scrollHeight = container.scrollHeight;
    // Account for sticky input height - increase threshold to 120px
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 120;
    const hasOverflow = scrollHeight > clientHeight;

    setShowScrollToBottom(hasOverflow && !isAtBottom);
  }, []);

  // Add scroll event listener and resize observer
  useEffect(() => {
    if (!sessionQuery.data || !messagesContainerRef.current) return;

    const container = messagesContainerRef.current;

    const handleScroll = () => {
      checkScrollPosition();
    };

    // ResizeObserver to detect content size changes
    const resizeObserver = new ResizeObserver(() => {
      checkScrollPosition();
    });

    container.addEventListener("scroll", handleScroll, { passive: true });
    resizeObserver.observe(container);

    // Check initial position
    checkScrollPosition();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      resizeObserver.disconnect();
    };
  }, [checkScrollPosition, sessionQuery.data]);

  // Check scroll position when messages change and auto-scroll for user messages
  useEffect(() => {
    if (!sessionQuery.data || !messagesContainerRef.current) return;

    checkScrollPosition();

    // Auto-scroll to bottom when user sends a message or when loading new content
    const container = messagesContainerRef.current;
    const wasAtBottom =
      container.scrollTop + container.clientHeight >=
      container.scrollHeight - 120;

    if (wasAtBottom || messages.length === 0) {
      // Small delay to ensure DOM has updated
      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      }, 0);
    }
  }, [messages, sessionQuery.data, checkScrollPosition]);

  useEffect(() => {
    // Load session data when available
    if (sessionQuery.data) {
      const sessionMessages =
        sessionQuery.data.messages?.map((msg: BackendMessage) => {
          // Convert backend attachments to frontend format
          const attachments =
            msg.attachments && Array.isArray(msg.attachments)
              ? msg.attachments.map((att) => ({
                type: "image" as const,
                url: `/api/files/${msg.sessionId}/${att.id}?userId=01HZXM0K1QRST9VWXYZ01234AB`,
                name: att.filename,
              }))
              : undefined;

          return {
            id: msg.id,
            content: msg.content,
            role: msg.role as "user" | "assistant",
            timestamp: new Date(msg.createdAt),
            attachments:
              attachments && attachments.length > 0 ? attachments : undefined,
          };
        }) || [];

      setMessages(sessionMessages);

      // If this is a new session with only one user message, get AI response
      if (sessionMessages.length === 1 && sessionMessages[0].role === "user") {
        handleAIResponse(sessionMessages);
      }
    }
  }, [sessionQuery.data]);

  const handleAIResponse = async (
    currentMessages: Message[],
    files?: File[],
    replaceLastAssistantMessage = false
  ) => {
    if (!selectedConfig) return;

    setIsLoading(true);
    try {
      const response = await chatCompletion.mutateAsync({
        messages: currentMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        userId: "01HZXM0K1QRST9VWXYZ01234AB",
        configurationId: selectedConfig.id,
        sessionId: params.id,
        systemPromptId: selectedSystemPromptId || undefined,
        files,
      });

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: response.message,
        role: "assistant",
        timestamp: new Date(),
      };

      if (replaceLastAssistantMessage) {
        setMessages((prev) => {
          const lastMessageIndex = prev.length - 1;
          if (lastMessageIndex >= 0 && prev[lastMessageIndex].role === "assistant") {
            const newMessages = [...prev];
            newMessages[lastMessageIndex] = aiMessage;
            return newMessages;
          }
          return [...prev, aiMessage];
        });
      } else {
        setMessages((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Failed to get AI response:", error);

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      
      if (replaceLastAssistantMessage) {
        setMessages((prev) => {
          const lastMessageIndex = prev.length - 1;
          if (lastMessageIndex >= 0 && prev[lastMessageIndex].role === "assistant") {
            const newMessages = [...prev];
            newMessages[lastMessageIndex] = errorMessage;
            return newMessages;
          }
          return [...prev, errorMessage];
        });
      } else {
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshMessage = (messageId: string) => {
    // Find the message and regenerate response up to that point
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || messages[messageIndex].role !== "assistant") return;

    // Get all messages up to but excluding the assistant message to be refreshed
    const contextMessages = messages.slice(0, messageIndex);
    
    // Regenerate the response and replace the last assistant message
    handleAIResponse(contextMessages, undefined, true);
  };

  const handleModelChange = (_configId: string, config: AIConfiguration) => {
    setSelectedConfig(config);
  };

  const handleSettingsClick = () => {
    navigate("/models");
  };

  const handleSystemPromptSettingsClick = () => {
    navigate("/system-prompts");
  };

  const handleScrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const handleHistoryToggle = () => {
    setIsHistoryOpen(!isHistoryOpen);
  };

  const handleSelectSession = (session: any) => {
    navigate(`/chat/${session.id}`);
    setIsHistoryOpen(false); // Close sidebar when selecting a session
  };

  const handleNewMessage = async (message: string, files?: File[]) => {
    if (!message.trim() && (!files || files.length === 0)) return;
    if (!selectedConfig) return;

    // Process files to create data URLs for display
    const attachments: { type: "image"; url: string; name?: string }[] = [];
    if (files && files.length > 0) {
      for (const file of files) {
        if (file.type.startsWith("image/")) {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          attachments.push({
            type: "image",
            url: dataUrl,
            name: file.name,
          });
        }
      }
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      content: message,
      role: "user",
      timestamp: new Date(),
      attachments: attachments.length > 0 ? attachments : undefined,
    };

    // Add user message to UI immediately
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Save user message to session
      await addMessage.mutateAsync({
        sessionId: params.id,
        message: {
          role: "user",
          content: message, // Use original message without file description
        },
        files,
      });

      // Get AI response for all messages including the new one
      const allMessages = [...messages, userMessage];
      await handleAIResponse(allMessages, files);
    } catch (error) {
      console.error("Failed to send message:", error);

      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: "Failed to send message. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  if (sessionQuery.isLoading) {
    return (
      <>
        <AppHeader
          breadcrumbs={[
            { label: "Athena AI", href: "/" },
            { label: "Chat", href: "/" },
            { label: "Loading...", isCurrentPage: true },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading chat session...</p>
          </div>
        </div>
      </>
    );
  }

  if (sessionQuery.error) {
    return (
      <>
        <AppHeader
          breadcrumbs={[
            { label: "Athena AI", href: "/" },
            { label: "Chat", href: "/" },
            { label: "Error", isCurrentPage: true },
          ]}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">Failed to load chat session</p>
            <Button
              onClick={() => navigate("/")}
              className="text-primary hover:underline"
            >
              Go back to home
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Athena AI", href: "/" },
          { label: "Chat", href: "/" },
          {
            label:
              sessionQuery.data?.title || `Session ${params.id.slice(0, 8)}...`,
            isCurrentPage: true,
          },
        ]}
        showHistoryToggle={true}
        onHistoryToggle={handleHistoryToggle}
        isHistoryOpen={isHistoryOpen}
      />
      <div className="flex h-full min-h-0">
        {/* Main Chat Content */}
        <div className="flex-1 flex flex-col">
          {/* Messages Container */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto pb-24"
            style={{
              scrollBehavior: "auto",
            }}
          >
            <div className="max-w-4xl mx-auto px-4 py-8">
              {/* Messages */}
              <div className="space-y-6">
                {messages.map((message) => (
                  <Message
                    key={message.id}
                    id={message.id}
                    content={message.content}
                    role={message.role}
                    timestamp={message.timestamp}
                    attachments={message.attachments}
                    onRefresh={message.role === "assistant" ? () => handleRefreshMessage(message.id) : undefined}
                  />
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-4 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                          <div
                            className="w-2 h-2 bg-current rounded-full animate-pulse"
                            style={{ animationDelay: "0.2s" }}
                          />
                          <div
                            className="w-2 h-2 bg-current rounded-full animate-pulse"
                            style={{ animationDelay: "0.4s" }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          Thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Chat Input Container - Separate bottom container */}
          <div className="sticky bottom-0 w-full">
            <div className="max-w-4xl mx-auto px-4 py-4">
              <EnhancedChatInput
                onSubmit={handleNewMessage}
                onModelChange={handleModelChange}
                onSettingsClick={handleSettingsClick}
                onSystemPromptSettingsClick={handleSystemPromptSettingsClick}
                onScrollToBottom={
                  showScrollToBottom ? handleScrollToBottom : undefined
                }
                showScrollButton={showScrollToBottom}
                placeholder="Type your message here..."
                disabled={isLoading}
                selectedModel={selectedConfig?.id}
              />
            </div>
          </div>
        </div>

        {/* Chat History Sidebar */}
        <ChatHistorySidebar 
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          onSelectSession={handleSelectSession}
          currentSessionId={params.id}
        />
      </div>
    </>
  );
}
