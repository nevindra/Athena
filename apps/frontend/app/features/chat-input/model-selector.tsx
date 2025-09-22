import type { AIConfiguration } from "@athena/shared";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface ModelSelectorProps {
  configurations?: AIConfiguration[];
  isLoading: boolean;
  selectedModelId: string | null;
  onModelChange: (configId: string) => void;
  onSettingsClick?: () => void;
}

export function ModelSelector({
  configurations,
  isLoading,
  selectedModelId,
  onModelChange,
  onSettingsClick,
}: ModelSelectorProps) {
  const getModelDisplayName = (config: AIConfiguration): string => {
    const modelName = config.settings.model || "Unknown Model";
    return `${config.name} (${modelName})`;
  };

  if (isLoading) {
    return <div className="h-8 w-32 bg-muted/50 animate-pulse rounded-md" />;
  }

  if (!configurations || configurations.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={onSettingsClick}
        className="h-8 text-sm text-muted-foreground hover:bg-muted/50"
      >
        No models configured
      </Button>
    );
  }

  return (
    <Select
      value={selectedModelId || ""}
      onValueChange={onModelChange}
    >
      <SelectTrigger className="h-8 px-3 text-sm font-medium" size="sm">
        <SelectValue placeholder="Select model..." />
      </SelectTrigger>
      <SelectContent>
        {configurations.map((config) => (
          <SelectItem key={config.id} value={config.id}>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  config.isActive ? "bg-green-500 dark:bg-green-400" : "bg-muted-foreground"
                }`}
              />
              <span>{getModelDisplayName(config)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}