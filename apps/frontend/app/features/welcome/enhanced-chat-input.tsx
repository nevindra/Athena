import { useState, useRef, useEffect } from "react";
import type { KeyboardEvent, ChangeEvent } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Paperclip, X, ChevronDown } from "lucide-react";
import { useConfigurations } from "~/hooks/use-configurations";
import { useSystemPrompts } from "~/hooks/use-system-prompts";
import { useModelStore } from "~/stores/model-store";
import { useSystemPromptStore } from "~/stores/system-prompt-store";
import type { AIConfiguration, SystemPrompt } from "@athena/shared";

interface EnhancedChatInputProps {
  onSubmit: (message: string, files?: File[]) => void;
  onModelChange?: (configId: string, config: AIConfiguration) => void;
  onSystemPromptChange?: (
    promptId: string | null,
    prompt: SystemPrompt | null,
  ) => void;
  onSettingsClick?: () => void;
  onSystemPromptSettingsClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  selectedModel?: string;
  onScrollToBottom?: () => void;
  showScrollButton?: boolean;
}

export function EnhancedChatInput({
  onSubmit,
  onModelChange,
  onSystemPromptChange,
  onSettingsClick,
  onSystemPromptSettingsClick,
  placeholder = "Type your message here...",
  disabled = false,
  autoFocus = false,
  selectedModel,
  onScrollToBottom,
  showScrollButton = false,
}: EnhancedChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isCompact, setIsCompact] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: configurations, isLoading } = useConfigurations();
  const { selectedModelId, setSelectedModel: setStoredModel } = useModelStore();

  const { data: systemPrompts } = useSystemPrompts();
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
        (config) => config.id === selectedModelId,
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
        (prompt) => prompt.id === selectedSystemPromptId,
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
    if ((message.trim() || files.length > 0) && !disabled) {
      onSubmit(message.trim(), files);
      setMessage("");
      setFiles([]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
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
      (config) => config.id === configId,
    );
    if (selectedConfig) {
      setStoredModel(configId, selectedConfig);
      onModelChange?.(configId, selectedConfig);
    }
  };

  const handleSystemPromptChange = (promptId: string) => {
    const selectedPrompt = systemPrompts?.find(
      (prompt) => prompt.id === promptId,
    );
    if (selectedPrompt) {
      setStoredSystemPrompt(promptId, selectedPrompt);
      onSystemPromptChange?.(promptId, selectedPrompt);
    }
  };

  const getModelDisplayName = (config: AIConfiguration): string => {
    const modelName = config.settings.model || "Unknown Model";
    return `${config.name} (${modelName})`;
  };

  const getSystemPromptDisplayName = (prompt: SystemPrompt): string => {
    return prompt.title;
  };

  const selectedConfig = configurations?.find(
    (config) => config.id === selectedModelId,
  );

  const selectedSystemPrompt = systemPrompts?.find(
    (prompt) => prompt.id === selectedSystemPromptId,
  );

  return (
    <>
      {/* Scroll to bottom button */}
      {showScrollButton && onScrollToBottom && (
        <div className="flex justify-end mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onScrollToBottom}
            className="h-8 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90 shadow-sm flex items-center gap-1"
            title="Scroll to bottom"
          >
            <ChevronDown className="h-4 w-4" />
            <span className="text-xs">Scroll to bottom</span>
          </Button>
        </div>
      )}

      {/* File attachments */}
      {files.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-muted/50 backdrop-blur-sm px-3 py-2 rounded-lg text-sm border border-border/20 shadow-sm"
            >
              <Paperclip className="h-3 w-3 text-muted-foreground" />
              <span className="truncate max-w-32 font-medium">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-4 w-4 p-0 hover:bg-destructive/20 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main input container */}
      <div className="relative border border-border/30 rounded-xl bg-background/95 backdrop-blur-sm focus-within:border-primary/50 focus-within:bg-background transition-all duration-200 shadow-sm hover:shadow-md">
        {/* Text input area */}
        <div
          className={`px-2 transition-all duration-200 ${isCompact ? "py-3" : "py-4"}`}
        >
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className={`${
              isCompact ? "min-h-[44px]" : "min-h-[80px]"
            } max-h-40 resize-none border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-normal placeholder:text-muted-foreground/60 px-3 py-2 transition-all duration-200`}
            rows={isCompact ? 1 : 3}
          />
        </div>

        {/* Bottom row with controls */}
        <div className="flex items-center justify-between px-5 pb-4 pt-1 border-t border-border/10">
          {/* Left side - Model selector */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-8 w-32 bg-muted/50 animate-pulse rounded-md" />
            ) : configurations && configurations.length > 0 ? (
              <Select
                value={selectedModelId || ""}
                onValueChange={handleModelChange}
              >
                <SelectTrigger className="h-8 px-3 border-none bg-transparent hover:bg-muted/50 focus:ring-0 text-sm font-medium">
                  <SelectValue placeholder="Select model..." />
                </SelectTrigger>
                <SelectContent>
                  {configurations.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            config.isActive ? "bg-green-500" : "bg-gray-400"
                          }`}
                        />
                        <span>{getModelDisplayName(config)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettingsClick}
                className="h-8 text-sm text-muted-foreground hover:bg-muted/50"
              >
                No models configured
              </Button>
            )}

            {/* System Prompts selector */}
            {systemPrompts && systemPrompts.length > 0 && (
              <Select
                value={selectedSystemPromptId || "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setStoredSystemPrompt(null, null);
                    onSystemPromptChange?.(null, null);
                  } else {
                    handleSystemPromptChange(value);
                  }
                }}
              >
                <SelectTrigger className="h-8 px-3 border-none bg-transparent hover:bg-muted/50 focus:ring-0 text-sm font-medium">
                  <SelectValue placeholder="System prompt..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">None</span>
                  </SelectItem>
                  {systemPrompts.map((prompt) => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                      <span>{getSystemPromptDisplayName(prompt)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Right side - Action buttons */}
          <div className="flex items-center gap-3">
            {/* File attachment button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0 hover:bg-muted/50 text-muted-foreground hover:text-foreground rounded-full transition-colors"
              title="Attach files"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Send button */}
            <Button
              onClick={handleSubmit}
              disabled={
                (!message.trim() && files.length === 0) ||
                disabled ||
                !selectedConfig
              }
              size="sm"
              className="h-9 w-9 p-0 rounded-full bg-primary hover:bg-primary/90 shadow-sm disabled:opacity-50 transition-all"
              title="Send message"
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
