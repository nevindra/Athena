import { useState } from "react";

interface ThinkingSectionProps {
  thinkingContent: string;
}

export function ThinkingSection({ thinkingContent }: ThinkingSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mt-2 border border-border/30 rounded-lg bg-muted/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 text-left text-xs font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
      >
        <svg
          className={`w-3 h-3 transition-transform ${
            isExpanded ? "rotate-90" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        {isExpanded ? "Hide" : "Show"} thinking process
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 text-xs text-muted-foreground border-t border-border/20 mt-1 pt-2">
          <pre className="whitespace-pre-wrap font-mono">{thinkingContent}</pre>
        </div>
      )}
    </div>
  );
}
