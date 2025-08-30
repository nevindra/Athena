import { Eye, EyeOff, TestTube, Save, Loader2 } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Slider } from "~/components/ui/slider";
import { useCreateConfiguration, useTestConnection } from "~/hooks/use-configurations";
import type { GeminiConfigSettings } from "@athena/shared";
import { toast } from "sonner";
import { ModelParams } from "~/components/models/model-params";
import { CustomSystemPrompt } from "~/components/models/custom-system-prompt";

interface GeminiConfigData extends Omit<GeminiConfigSettings, 'temperature' | 'maxTokens' | 'topP'> {
  name: string; // Add name field for saving
  customPrompt?: string; // Add custom prompt field
  // Allow temporary string values during editing for numeric fields
  temperature: number | string;
  maxTokens: number | string;
  topP: number | string;
}

// Helper function to convert config to proper numeric types for API
const prepareSettingsForApi = (config: GeminiConfigData): GeminiConfigSettings => {
  const { name, customPrompt, ...settings } = config;
  
  return {
    ...settings,
    temperature: typeof settings.temperature === 'string' ? Number.parseFloat(settings.temperature) || 0.7 : settings.temperature,
    maxTokens: typeof settings.maxTokens === 'string' ? Number.parseInt(settings.maxTokens) || 2048 : settings.maxTokens,
    topP: typeof settings.topP === 'string' ? Number.parseFloat(settings.topP) || 0.9 : settings.topP,
  };
};

export function GeminiConfig() {
  const [config, setConfig] = useState<GeminiConfigData>({
    name: "",
    apiKey: "",
    model: "gemini-1.5-pro",
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40,
    customPrompt: "",
  });

  const [showApiKey, setShowApiKey] = useState(false);
  
  // TanStack Query hooks
  const createConfiguration = useCreateConfiguration();
  const testConnection = useTestConnection();

  const handleSave = async () => {
    if (!config.name.trim()) {
      toast.error("Please enter a configuration name");
      return;
    }
    
    if (!config.apiKey.trim()) {
      toast.error("Please enter your API key");
      return;
    }

    try {
      const settings = prepareSettingsForApi(config);
      await createConfiguration.mutateAsync({
        name: config.name,
        provider: "gemini",
        settings,
        isActive: true,
      });
      
      toast.success("Configuration saved successfully!");
      
      // Reset form
      setConfig({
        name: "",
        apiKey: "",
        model: "gemini-1.5-pro",
        temperature: 0.7,
        maxTokens: 2048,
        topP: 0.9,
        topK: 40,
        customPrompt: "",
      });
    } catch (error) {
      toast.error("Failed to save configuration");
    }
  };

  // Model params handlers
  const handleTemperatureChange = (value: string) => {
    setConfig((prev) => ({ ...prev, temperature: value }));
  };

  const handleTemperatureBlur = (value: string) => {
    if (value === "") {
      setConfig((prev) => ({ ...prev, temperature: 0.7 }));
    } else {
      const num = Number.parseFloat(value);
      if (Number.isNaN(num) || num < 0 || num > 2) {
        setConfig((prev) => ({ ...prev, temperature: 0.7 }));
      } else {
        setConfig((prev) => ({ ...prev, temperature: num }));
      }
    }
  };

  const handleMaxTokensChange = (value: string) => {
    setConfig((prev) => ({ ...prev, maxTokens: value }));
  };

  const handleMaxTokensBlur = (value: string) => {
    if (value === "") {
      setConfig((prev) => ({ ...prev, maxTokens: 2048 }));
    } else {
      const num = Number.parseInt(value);
      if (Number.isNaN(num) || num < 1 || num > 8192) {
        setConfig((prev) => ({ ...prev, maxTokens: 2048 }));
      } else {
        setConfig((prev) => ({ ...prev, maxTokens: num }));
      }
    }
  };

  const handleTopPChange = (value: string) => {
    setConfig((prev) => ({ ...prev, topP: value }));
  };

  const handleTopPBlur = (value: string) => {
    if (value === "") {
      setConfig((prev) => ({ ...prev, topP: 0.9 }));
    } else {
      const num = Number.parseFloat(value);
      if (Number.isNaN(num) || num < 0 || num > 1) {
        setConfig((prev) => ({ ...prev, topP: 0.9 }));
      } else {
        setConfig((prev) => ({ ...prev, topP: num }));
      }
    }
  };

  // Dummy handlers for unused parameters (Gemini doesn't use these)
  const handlePresencePenaltyChange = () => {};
  const handlePresencePenaltyBlur = () => {};
  const handleFrequencyPenaltyChange = () => {};
  const handleFrequencyPenaltyBlur = () => {};
  const handleStreamResponseChange = () => {};

  const handleTest = async () => {
    if (!config.apiKey.trim()) {
      toast.error("Please enter your API key to test connection");
      return;
    }

    try {
      const settings = prepareSettingsForApi(config);
      const result = await testConnection.mutateAsync({
        provider: "gemini",
        settings,
      });
      
      if (result.success) {
        toast.success(`Connection successful! ${result.model ? `Model: ${result.model}` : ""} ${result.latency ? `(${result.latency}ms)` : ""}`);
      } else {
        toast.error(result.error || "Connection test failed");
      }
    } catch (error) {
      toast.error("Failed to test connection");
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Configuration */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="configName">Configuration Name *</Label>
          <Input
            id="configName"
            placeholder="e.g., 'My Gemini Pro Config'"
            value={config.name}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, name: e.target.value }))
            }
          />
          <p className="text-sm text-muted-foreground">
            A friendly name to identify this configuration
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key *</Label>
          <div className="relative">
            <Input
              id="apiKey"
              type={showApiKey ? "text" : "password"}
              placeholder="Enter your Google Gemini API key"
              value={config.apiKey}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, apiKey: e.target.value }))
              }
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Get your API key from the{" "}
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Google AI Studio
            </a>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select
            value={config.model}
            onValueChange={(value) =>
              setConfig((prev) => ({ ...prev, model: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
              <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
              <SelectItem value="gemini-1.0-pro">Gemini 1.0 Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Model Parameters */}
      <ModelParams
        temperature={config.temperature}
        maxTokens={config.maxTokens}
        topP={config.topP}
        presencePenalty={0}
        frequencyPenalty={0}
        streamResponse={false}
        onTemperatureChange={handleTemperatureChange}
        onTemperatureBlur={handleTemperatureBlur}
        onMaxTokensChange={handleMaxTokensChange}
        onMaxTokensBlur={handleMaxTokensBlur}
        onTopPChange={handleTopPChange}
        onTopPBlur={handleTopPBlur}
        onPresencePenaltyChange={handlePresencePenaltyChange}
        onPresencePenaltyBlur={handlePresencePenaltyBlur}
        onFrequencyPenaltyChange={handleFrequencyPenaltyChange}
        onFrequencyPenaltyBlur={handleFrequencyPenaltyBlur}
        onStreamResponseChange={handleStreamResponseChange}
      />

      {/* Gemini-specific TopK parameter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Gemini-Specific Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Top-k</Label>
              <span className="text-sm text-muted-foreground">
                {config.topK}
              </span>
            </div>
            <Slider
              value={[config.topK]}
              onValueChange={([value]) =>
                setConfig((prev) => ({ ...prev, topK: value }))
              }
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Limits the number of highest probability tokens to consider for
              each step.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custom System Prompt */}
      <CustomSystemPrompt
        value={config.customPrompt || ""}
        onChange={(value) => setConfig((prev) => ({ ...prev, customPrompt: value }))}
      />

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={!config.apiKey || testConnection.isPending}
        >
          {testConnection.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <TestTube className="h-4 w-4 mr-2" />
          )}
          {testConnection.isPending ? "Testing..." : "Test Connection"}
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={!config.apiKey || !config.name.trim() || createConfiguration.isPending}
        >
          {createConfiguration.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {createConfiguration.isPending ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
