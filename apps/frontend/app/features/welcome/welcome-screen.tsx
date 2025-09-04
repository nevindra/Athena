import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "~/components/ui/card";
import { EnhancedChatInput } from "./enhanced-chat-input";
import { useCreateSession } from "~/hooks/use-sessions";
import type { AIConfiguration, SystemPrompt } from "@athena/shared";

const EXAMPLE_PROMPTS = [
  {
    title: "Creative Writing",
    prompt:
      "Help me write a short story about a time traveler who gets stuck in the past",
  },
  {
    title: "Learning",
    prompt:
      "Explain quantum physics in simple terms that a high school student would understand",
  },
  {
    title: "Problem Solving",
    prompt:
      "I'm planning a weekend trip for 4 people. Can you suggest a budget-friendly itinerary?",
  },
  {
    title: "Coding Help",
    prompt:
      "Review this React component and suggest improvements for performance and readability",
  },
];

export function WelcomeScreen() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<AIConfiguration | null>(
    null,
  );
  const createSession = useCreateSession();

  const handleSubmit = async (message: string, files?: File[]) => {
    if (!message.trim() && (!files || files.length === 0)) return;
    if (!selectedConfig) {
      alert("Please select an AI model first");
      return;
    }

    setIsLoading(true);

    try {
      // Create a new chat session with the initial message
      const session = await createSession.mutateAsync({
        userId: "01HZXM0K1QRST9VWXYZ01234AB",
        configurationId: selectedConfig.id,
        initialMessage: message.trim(),
      });

      // Navigate to chat route with the session ID
      navigate(`/chat/${session.id}`, {
        state: {
          selectedConfig: selectedConfig,
          initialFiles: files,
        },
      });
    } catch (error) {
      console.error("Failed to create session:", error);
      alert("Failed to start chat session. Please try again.");
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

  const handleSystemPromptSettingsClick = () => {
    navigate("/system-prompts");
  };

  const handleExampleClick = (prompt: string) => {
    handleSubmit(prompt);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-4xl w-full space-y-12">
          {/* Header section */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-primary-foreground"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h1 className="text-4xl font-semibold text-foreground">
              How can we help you today?
            </h1>
          </div>

          {/* Example prompts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
            {EXAMPLE_PROMPTS.map((example, index) => (
              <Card
                key={index}
                className="p-4 cursor-pointer transition-all hover:bg-accent/50 border-border/50"
                onClick={() => handleExampleClick(example.prompt)}
              >
                <h3 className="font-medium text-foreground mb-2">
                  {example.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {example.prompt}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Input area - fixed at bottom */}
      <div className=" bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <EnhancedChatInput
            onSubmit={handleSubmit}
            onModelChange={handleModelChange}
            onSystemPromptChange={(promptId, prompt) => {
              // Handle system prompt selection - could be passed to session creation
            }}
            onSettingsClick={handleSettingsClick}
            onSystemPromptSettingsClick={handleSystemPromptSettingsClick}
            placeholder="Message..."
            disabled={isLoading}
            autoFocus
            selectedModel={selectedConfig?.id}
          />
        </div>
      </div>
    </div>
  );
}
