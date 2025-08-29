import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Settings, Plus } from "lucide-react";
import { useConfigurations } from "~/hooks/use-configurations";
import type { AIConfiguration } from "@athena/shared";

interface ModelSelectorProps {
  selectedModel?: string;
  onModelChange?: (configId: string, config: AIConfiguration) => void;
  onSettingsClick?: () => void;
  className?: string;
  size?: "default" | "sm";
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  onSettingsClick,
  className = "",
  size = "default"
}: ModelSelectorProps) {
  const { data: configurations, isLoading, error } = useConfigurations();
  const [selectedConfigId, setSelectedConfigId] = useState<string>(selectedModel || "");

  // Auto-select first active configuration if none selected
  useEffect(() => {
    if (!selectedConfigId && configurations && configurations.length > 0) {
      const activeConfig = configurations.find(config => config.isActive) || configurations[0];
      setSelectedConfigId(activeConfig.id);
      onModelChange?.(activeConfig.id, activeConfig);
    }
  }, [configurations, selectedConfigId, onModelChange]);

  // Update selected model when prop changes
  useEffect(() => {
    if (selectedModel && selectedModel !== selectedConfigId) {
      setSelectedConfigId(selectedModel);
    }
  }, [selectedModel, selectedConfigId]);

  const handleModelChange = (configId: string) => {
    const selectedConfig = configurations?.find(config => config.id === configId);
    if (selectedConfig) {
      setSelectedConfigId(configId);
      onModelChange?.(configId, selectedConfig);
    }
  };

  const getModelDisplayName = (config: AIConfiguration): string => {
    const providerName = config.provider.charAt(0).toUpperCase() + config.provider.slice(1);
    const modelName = config.settings.model || "Unknown Model";
    return `${config.name} (${providerName} - ${modelName})`;
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1 h-9 bg-muted animate-pulse rounded-md" />
        <Button
          variant="outline"
          size={size === "sm" ? "sm" : "icon"}
          disabled
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  if (error || !configurations || configurations.length === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className="flex-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span>No AI models configured</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onSettingsClick}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Model
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={selectedConfigId} onValueChange={handleModelChange}>
        <SelectTrigger className={size === "sm" ? "h-8 text-sm" : ""}>
          <SelectValue placeholder="Select AI model..." />
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
      
      <Button
        variant="outline"
        size={size === "sm" ? "sm" : "icon"}
        onClick={onSettingsClick}
        title="Manage AI Models"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}