import type { AIConfiguration, SystemPrompt } from "@athena/shared";
import { Paperclip } from "lucide-react";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useConfigurations } from "~/hooks/use-configurations";
import { useSystemPrompts } from "~/hooks/use-system-prompts";
import { useCurrentUser } from "~/hooks/use-current-user";
import { useModelStore } from "~/stores/model-store";
import { useSystemPromptStore } from "~/stores/system-prompt-store";
import { ChatTextarea } from "./chat-textarea";
import { FileAttachments } from "./file-attachments";
import { ModelSelector } from "./model-selector";
import { ScrollToBottomButton } from "./scroll-to-bottom-button";
import { SystemPromptSelector } from "./system-prompt-selector";

interface EnhancedChatInputProps {
  onSubmit: (message: string, files?: File[]) => void;
  onModelChange?: (configId: string, config: AIConfiguration) => void;
  onSystemPromptChange?: (
    promptId: string | null,
    prompt: SystemPrompt | null
  ) => void;
  onSettingsClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onScrollToBottom?: () => void;
  showScrollButton?: boolean;
}

export function EnhancedChatInput({
  onSubmit,
  onModelChange,
  onSystemPromptChange,
  onSettingsClick,
  placeholder = "Type your message here...",
  disabled = false,
  autoFocus = false,
  onScrollToBottom,
  showScrollButton = false,
}: EnhancedChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isCompact, setIsCompact] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { userId } = useCurrentUser();
  const { data: configurations, isLoading } = useConfigurations(userId || "");
  const { selectedModelId, setSelectedModel: setStoredModel } = useModelStore();

  const { data: systemPrompts } = useSystemPrompts(userId || "");
  const {
    selectedSystemPromptId,
    setSelectedSystemPrompt: setStoredSystemPrompt,
  } = useSystemPromptStore();

  // Auto-select first available model or use persisted selection
  useEffect(() => {
    if (!configurations || configurations.length === 0) return;

    // If we have a persisted model ID, check if it still exists in configurations
    if (selectedModelId) {
      const persistedConfig = configurations.find(
        (config) => config.id === selectedModelId
      );
      if (persistedConfig) {
        // Persisted model still exists, use it
        onModelChange?.(selectedModelId, persistedConfig);
        return;
      }
    }

    // No valid persisted model, select the first available one
    const firstConfig = configurations[0];
    if (firstConfig) {
      setStoredModel(firstConfig.id, firstConfig);
      onModelChange?.(firstConfig.id, firstConfig);
    }
  }, [configurations, selectedModelId, setStoredModel, onModelChange]);

  // Use persisted system prompt selection if available
  useEffect(() => {
    if (!systemPrompts || systemPrompts.length === 0) return;

    // If we have a persisted system prompt ID, check if it still exists in system prompts
    if (selectedSystemPromptId) {
      const persistedPrompt = systemPrompts.find(
        (prompt) => prompt.id === selectedSystemPromptId
      );
      if (persistedPrompt) {
        // Persisted system prompt still exists, use it
        onSystemPromptChange?.(selectedSystemPromptId, persistedPrompt);
        return;
      }
    }

    // No valid persisted system prompt, default to none (empty state)
    onSystemPromptChange?.(null, null);
  }, [systemPrompts, selectedSystemPromptId, onSystemPromptChange]);

  // Calculate if input should be compact based on content
  useEffect(() => {
    if (!message.trim()) {
      setIsCompact(true);
      return;
    }

    // Count lines by splitting on newlines
    const lines = message.split("\n");
    const hasMultipleLines = lines.length > 2;

    // Also check if any single line is too long (rough estimate)
    const hasLongLine = lines.some((line) => line.length > 50);

    setIsCompact(!hasMultipleLines && !hasLongLine);
  }, [message]);

  const handleSubmit = () => {
    if ((message.trim() || files.length > 0) && !disabled && selectedConfig?.isActive) {
      onSubmit(message.trim(), files);
      setMessage("");
      setFiles([]);
    }
  };


  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleModelChange = (configId: string) => {
    const selectedConfig = configurations?.find(
      (config) => config.id === configId
    );
    if (selectedConfig) {
      setStoredModel(configId, selectedConfig);
      onModelChange?.(configId, selectedConfig);
    }
  };

  const handleSystemPromptChange = (promptId: string | null) => {
    if (promptId === null) {
      setStoredSystemPrompt(null, null);
      onSystemPromptChange?.(null, null);
      return;
    }

    const selectedPrompt = systemPrompts?.find(
      (prompt) => prompt.id === promptId
    );
    if (selectedPrompt) {
      setStoredSystemPrompt(promptId, selectedPrompt);
      onSystemPromptChange?.(promptId, selectedPrompt);
    }
  };

  const selectedConfig = configurations?.find(
    (config) => config.id === selectedModelId
  );

  return (
    <>
      <ScrollToBottomButton
        showScrollButton={showScrollButton}
        onScrollToBottom={onScrollToBottom}
      />

      <FileAttachments files={files} onRemoveFile={removeFile} />

      {/* Main input container */}
      <div className="relative border border-border rounded-xl bg-card backdrop-blur-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200 shadow-sm hover:shadow-md">
        <ChatTextarea
          message={message}
          onMessageChange={setMessage}
          onSubmit={handleSubmit}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          isCompact={isCompact}
        />

        {/* Bottom row with controls */}
        <div className="flex items-center justify-between px-5 pb-4 pt-1 border-t border-border/20">
          {/* Left side - Model selector */}
          <div className="flex items-center gap-2">
            <ModelSelector
              configurations={configurations}
              isLoading={isLoading}
              selectedModelId={selectedModelId}
              onModelChange={handleModelChange}
              onSettingsClick={onSettingsClick}
            />

            <SystemPromptSelector
              systemPrompts={systemPrompts}
              selectedSystemPromptId={selectedSystemPromptId}
              onSystemPromptChange={handleSystemPromptChange}
            />
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-3">
            {/* File attachment button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground text-muted-foreground rounded-full transition-colors"
              title="Attach files"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Send button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-block">
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      (!message.trim() && files.length === 0) ||
                      disabled ||
                      !selectedConfig ||
                      !selectedConfig.isActive
                    }
                    size="sm"
                    className="h-9 w-9 p-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm disabled:opacity-50 transition-all"
                  >
                    <svg
                      className="h-4 w-4 text-primary-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {selectedConfig && !selectedConfig.isActive
                  ? `Cannot send: "${selectedConfig.name}" is inactive`
                  : "Send message"}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,text/*,.pdf,.doc,.docx"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </>
  );
}
