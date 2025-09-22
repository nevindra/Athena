import type { SystemPrompt } from "@athena/shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface SystemPromptSelectorProps {
  systemPrompts?: SystemPrompt[];
  selectedSystemPromptId: string | null;
  onSystemPromptChange: (promptId: string | null) => void;
}

export function SystemPromptSelector({
  systemPrompts,
  selectedSystemPromptId,
  onSystemPromptChange,
}: SystemPromptSelectorProps) {
  const getSystemPromptDisplayName = (prompt: SystemPrompt): string => {
    return prompt.title;
  };

  if (!systemPrompts || systemPrompts.length === 0) {
    return null;
  }

  return (
    <Select
      value={selectedSystemPromptId || "none"}
      onValueChange={(value) => {
        if (value === "none") {
          onSystemPromptChange(null);
        } else {
          onSystemPromptChange(value);
        }
      }}
    >
      <SelectTrigger className="h-8 px-3 text-sm font-medium" size="sm">
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
  );
}