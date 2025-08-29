import { useState, useRef } from "react";
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
import { Paperclip, Send, X } from "lucide-react";
import { useConfigurations } from "~/hooks/use-configurations";
import type { AIConfiguration } from "@athena/shared";

interface EnhancedChatInputProps {
  onSubmit: (message: string, files?: File[]) => void;
  onModelChange?: (configId: string, config: AIConfiguration) => void;
  onSettingsClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  selectedModel?: string;
}

export function EnhancedChatInput({
  onSubmit,
  onModelChange,
  onSettingsClick,
  placeholder = "Type your message here...",
  disabled = false,
  autoFocus = false,
  selectedModel,
}: EnhancedChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedConfigId, setSelectedConfigId] = useState<string>(selectedModel || "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: configurations, isLoading } = useConfigurations();

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
    setFiles(prev => [...prev, ...selectedFiles]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleModelChange = (configId: string) => {
    setSelectedConfigId(configId);
    const selectedConfig = configurations?.find(config => config.id === configId);
    if (selectedConfig) {
      onModelChange?.(configId, selectedConfig);
    }
  };

  const getModelDisplayName = (config: AIConfiguration): string => {
    const modelName = config.settings.model || "Unknown Model";
    return `${config.name} (${modelName})`;
  };

  const selectedConfig = configurations?.find(config => config.id === selectedConfigId);

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* File attachments */}
      {files.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-muted px-3 py-2 rounded-lg text-sm"
            >
              <Paperclip className="h-3 w-3" />
              <span className="truncate max-w-32">{file.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-4 w-4 p-0 hover:bg-destructive/20"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Main input container */}
      <div className="relative border border-border/60 rounded-2xl bg-background/50 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
        {/* Text input area */}
        <div className="px-4 pt-4 pb-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className="min-h-[80px] max-h-40 resize-none border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base leading-relaxed placeholder:text-muted-foreground/60"
            style={{ fieldSizing: 'content' }}
          />
        </div>

        {/* Bottom row with model selector and actions */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          {/* Model selector */}
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="h-8 w-36 bg-muted animate-pulse rounded-md" />
            ) : configurations && configurations.length > 0 ? (
              <Select value={selectedConfigId} onValueChange={handleModelChange}>
                <SelectTrigger className="h-8 min-w-[160px] border-none bg-transparent hover:bg-muted/50 focus:ring-0 text-sm font-medium">
                  <SelectValue placeholder="Select model..." />
                </SelectTrigger>
                <SelectContent>
                  {configurations.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          config.isActive ? "bg-green-500" : "bg-gray-400"
                        }`} />
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
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* File attachment button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-8 w-8 p-0 hover:bg-muted/50 text-muted-foreground hover:text-foreground"
              title="Attach files"
            >
              <Paperclip className="h-4 w-4" />
            </Button>

            {/* Send button */}
            <Button
              onClick={handleSubmit}
              disabled={(!message.trim() && files.length === 0) || disabled || !selectedConfig}
              size="sm"
              className="h-8 w-8 p-0 rounded-full"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
         <p className="text-xs text-muted-foreground text-center pb-2">
            AI can make mistakes. Check important info.
          </p>

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

      {/* Model info */}
      {selectedConfig && (
        <p className="text-xs text-muted-foreground text-center mt-2">
          Using {selectedConfig.name} ({selectedConfig.provider})
        </p>
      )}
    </div>
  );
}