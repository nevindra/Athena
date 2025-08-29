import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface ChatInputProps {
  onSubmit: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function ChatInput({
  onSubmit,
  placeholder = "Type a message...",
  disabled = false,
  autoFocus = false,
}: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = () => {
    if (message.trim() && !disabled) {
      onSubmit(message.trim());
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex items-center gap-3 w-full max-w-3xl mx-auto">
      <div className="relative flex-1">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="h-12 pr-12 text-base rounded-xl border-border/60 bg-background/50 focus-visible:border-primary/60 focus-visible:ring-primary/20"
        />
        <Button
          onClick={handleSubmit}
          disabled={!message.trim() || disabled}
          size="icon"
          className="absolute right-1 top-1 h-10 w-10 rounded-lg"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          <span className="sr-only">Send message</span>
        </Button>
      </div>
    </div>
  );
}
