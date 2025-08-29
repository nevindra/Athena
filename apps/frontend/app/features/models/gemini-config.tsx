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

interface GeminiConfigData extends GeminiConfigSettings {
  name: string; // Add name field for saving
}

export function GeminiConfig() {
  const [config, setConfig] = useState<GeminiConfigData>({
    name: "",
    apiKey: "",
    model: "gemini-1.5-pro",
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40,
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
      const { name, ...settings } = config;
      await createConfiguration.mutateAsync({
        name,
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
      });
    } catch (error) {
      toast.error("Failed to save configuration");
    }
  };

  const handleTest = async () => {
    if (!config.apiKey.trim()) {
      toast.error("Please enter your API key to test connection");
      return;
    }

    try {
      const { name, ...settings } = config;
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
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Model Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-sm text-muted-foreground">
                {config.temperature}
              </span>
            </div>
            <Slider
              value={[config.temperature]}
              onValueChange={([value]) =>
                setConfig((prev) => ({ ...prev, temperature: value }))
              }
              max={2}
              min={0}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness. Lower values make responses more focused and
              deterministic.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Max Tokens</Label>
              <span className="text-sm text-muted-foreground">
                {config.maxTokens}
              </span>
            </div>
            <Slider
              value={[config.maxTokens]}
              onValueChange={([value]) =>
                setConfig((prev) => ({ ...prev, maxTokens: value }))
              }
              max={8192}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Maximum number of tokens to generate in the response.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Top-p</Label>
              <span className="text-sm text-muted-foreground">
                {config.topP}
              </span>
            </div>
            <Slider
              value={[config.topP]}
              onValueChange={([value]) =>
                setConfig((prev) => ({ ...prev, topP: value }))
              }
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Nucleus sampling. Only tokens with cumulative probability up to
              this value are considered.
            </p>
          </div>

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
