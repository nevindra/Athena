import type { AIConfiguration } from "@athena/shared";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "~/components/ui/card";
import { EnhancedChatInput } from "~/features/chat-input/enhanced-chat-input";
import { useCreateSession } from "~/hooks/use-sessions";
import { useCurrentUser } from "~/hooks/use-current-user";

const TASK_SUGGESTIONS = [
  {
    icon: "📄",
    title: "Answer RFP documentation",
    description: "Help with proposal and documentation tasks"
  },
  {
    icon: "📊",
    title: "Conduct a competitor analysis",
    description: "Research and analyze market competition"
  },
  {
    icon: "💬",
    title: "Provide feedback on communication",
    description: "Review and improve written communications"
  },
];

interface WelcomeScreenProps {
  isSidebarOpen?: boolean;
}

export function WelcomeScreen({ isSidebarOpen = false }: WelcomeScreenProps) {
  const { userId } = useCurrentUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<AIConfiguration | null>(
    null
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
        userId: userId || "",
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

  const handleTaskClick = (title: string) => {
    handleSubmit(title);
  };

  return (
    <motion.div
      className="flex-1 flex flex-col min-h-0"
      animate={{
        marginLeft: isSidebarOpen ? 0 : 0,
        width: isSidebarOpen ? "auto" : "100%"
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }}
    >
      {/* Main content area */}
      <motion.div
        className="flex-1 flex flex-col items-center justify-center px-4 py-12"
        animate={{
          scale: isSidebarOpen ? 0.95 : 1,
          opacity: isSidebarOpen ? 0.8 : 1
        }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
          mass: 0.6
        }}
      >
        <motion.div
          className="max-w-2xl w-full space-y-8"
          animate={{
            x: isSidebarOpen ? 20 : 0
          }}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
        >
          {/* Header section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl font-medium text-foreground">
              Hi, there 👋
            </h1>
            <p className="text-muted-foreground text-lg">
              Tell us what you need, and we'll handle the rest.
            </p>
          </div>

          {/* Assistant card */}
          {/*TODO: ADD ASSISTANT FEATURE*/}
          {/*<div className="mx-auto max-w-md">
            <Card className="p-4 bg-slate-900 border-slate-700 text-white">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">S</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-white">Sam Lee</span>
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                      Data Assistant
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    Designed to help manage sales processes and maximize customer engagement.
                  </p>
                </div>
              </div>
            </Card>
          </div>*/}

          {/* Task suggestions */}
          <div className="max-w-2xl mx-auto">
            <div className="grid grid-cols-3 gap-3">
              {TASK_SUGGESTIONS.map((task, index) => (
                <Card
                  key={index}
                  className="p-3 cursor-pointer hover:bg-accent/50 transition-colors group"
                  onClick={() => handleTaskClick(task.title)}
                >
                  <div className="text-center space-y-2">
                    <span className="text-lg block">{task.icon}</span>
                    <div className="text-xs font-medium text-foreground group-hover:text-blue-600 leading-tight">
                      {task.title}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Input area - fixed at bottom */}
      <div className=" bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <EnhancedChatInput
            onSubmit={handleSubmit}
            onModelChange={handleModelChange}
            onSettingsClick={handleSettingsClick}
            onSystemPromptSettingsClick={handleSystemPromptSettingsClick}
            placeholder="Ask me anything..."
            disabled={isLoading}
            autoFocus
            selectedModel={selectedConfig?.id}
          />
        </div>
      </div>
    </motion.div>
  );
}
