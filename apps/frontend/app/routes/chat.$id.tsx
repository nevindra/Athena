import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { AppHeader } from "~/components/app-header";
import { EnhancedChatInput } from "~/features/welcome/enhanced-chat-input";
import { Message } from "~/features/chat/message";
import { useSession, useAddMessage, useChatCompletion } from "~/hooks/use-sessions";
import type { Route } from "./+types/chat.$id";
import type { AIConfiguration } from "@athena/shared";

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
  const [selectedConfig, setSelectedConfig] = useState<AIConfiguration | null>(
    location.state?.selectedConfig || null
  );
  const [attachedFiles, setAttachedFiles] = useState<File[]>(
    location.state?.initialFiles || []
  );

  const sessionQuery = useSession(params.id);
  const addMessage = useAddMessage();
  const chatCompletion = useChatCompletion();

  useEffect(() => {
    // Load session data when available
    if (sessionQuery.data) {
      const sessionMessages = sessionQuery.data.messages?.map((msg: BackendMessage) => {
        // Convert backend attachments to frontend format
        const attachments = msg.attachments && Array.isArray(msg.attachments) 
          ? msg.attachments.map(att => ({
              type: "image" as const,
              url: `http://localhost:3000/api/files/${msg.sessionId}/${att.id}?userId=01HZXM0K1QRST9VWXYZ01234AB`,
              name: att.filename,
            }))
          : undefined;

        return {
          id: msg.id,
          content: msg.content,
          role: msg.role as "user" | "assistant",
          timestamp: new Date(msg.createdAt),
          attachments: attachments && attachments.length > 0 ? attachments : undefined,
        };
      }) || [];
      
      setMessages(sessionMessages);

      // If this is a new session with only one user message, get AI response
      if (sessionMessages.length === 1 && sessionMessages[0].role === "user") {
        handleAIResponse(sessionMessages);
      }
    }
  }, [sessionQuery.data]);

  const handleAIResponse = async (currentMessages: Message[], files?: File[]) => {
    if (!selectedConfig) return;
    
    setIsLoading(true);
    try {
      const response = await chatCompletion.mutateAsync({
        messages: currentMessages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        userId: "01HZXM0K1QRST9VWXYZ01234AB",
        configurationId: selectedConfig.id,
        sessionId: params.id,
        files,
      });

      const aiMessage: Message = {
        id: crypto.randomUUID(),
        content: response.message,
        role: "assistant",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Failed to get AI response:", error);
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        content: "Sorry, I encountered an error. Please try again.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModelChange = (_configId: string, config: AIConfiguration) => {
    setSelectedConfig(config);
  };

  const handleSettingsClick = () => {
    navigate("/models");
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
    setMessages(prev => [...prev, userMessage]);

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
      setMessages(prev => [...prev, errorMessage]);
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
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
            <button 
              onClick={() => navigate("/")}
              className="text-primary hover:underline"
            >
              Go back to home
            </button>
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
          { label: sessionQuery.data?.title || `Session ${params.id.slice(0, 8)}...`, isCurrentPage: true },
        ]}
      />
      <div className="flex-1 flex flex-col bg-background">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {messages.map((message) => (
              <Message
                key={message.id}
                id={message.id}
                content={message.content}
                role={message.role}
                timestamp={message.timestamp}
                attachments={message.attachments}
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

        {/* Input area with enhanced chat input */}
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <EnhancedChatInput
              onSubmit={handleNewMessage}
              onModelChange={handleModelChange}
              onSettingsClick={handleSettingsClick}
              placeholder="Type your message here..."
              disabled={isLoading}
              selectedModel={selectedConfig?.id}
            />
          </div>
        </div>
      </div>
    </>
  );
}
