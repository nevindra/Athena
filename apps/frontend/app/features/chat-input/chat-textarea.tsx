import type { KeyboardEvent } from "react";
import { useRef } from "react";
import { Textarea } from "~/components/ui/textarea";

interface ChatTextareaProps {
  message: string;
  onMessageChange: (message: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled: boolean;
  autoFocus: boolean;
  isCompact: boolean;
}

export function ChatTextarea({
  message,
  onMessageChange,
  onSubmit,
  placeholder,
  disabled,
  autoFocus,
  isCompact,
}: ChatTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      className={`px-2 transition-all duration-200 ${
        isCompact ? "py-3" : "py-4"
      }`}
    >
      <Textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
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
  );
}