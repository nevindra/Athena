import { ChevronDown } from "lucide-react";
import { Button } from "~/components/ui/button";

interface ScrollToBottomButtonProps {
  showScrollButton: boolean;
  onScrollToBottom?: () => void;
}

export function ScrollToBottomButton({
  showScrollButton,
  onScrollToBottom,
}: ScrollToBottomButtonProps) {
  if (!showScrollButton || !onScrollToBottom) {
    return null;
  }

  return (
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
  );
}