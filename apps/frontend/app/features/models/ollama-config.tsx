import { RefreshCw, Server, TestTube, Save, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
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
import { useCreateConfiguration, useUpdateConfiguration, useTestConnection } from "~/hooks/use-configurations";
import type { OllamaConfigSettings, AIConfiguration } from "@athena/shared";
import { toast } from "sonner";

interface OllamaConfigData extends OllamaConfigSettings {
  name: string; // Add name field for saving
}

interface OllamaConfigProps {
  editingConfig?: AIConfiguration | null;
  onSaved?: () => void;
}

const popularModels = [
  "llama3.2:3b",
  "llama3.2:1b",
  "llama3.1:8b",
  "mistral:7b",
  "codellama:7b",
  "phi3:mini",
  "gemma2:9b",
  "qwen2.5:7b",
];

export function OllamaConfig({ editingConfig, onSaved }: OllamaConfigProps) {
  const [config, setConfig] = useState<OllamaConfigData>({
    name: "",
    serverUrl: "http://localhost:11434",
    model: "",
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    topK: 40,
    numCtx: 4096,
  });

  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  // TanStack Query hooks
  const createConfiguration = useCreateConfiguration();
  const updateConfiguration = useUpdateConfiguration();
  const testConnection = useTestConnection();

  // Load existing configuration when editing
  useEffect(() => {
    if (editingConfig && editingConfig.provider === "ollama") {
      const settings = editingConfig.settings as OllamaConfigSettings;
      setConfig({
        name: editingConfig.name,
        serverUrl: settings.serverUrl,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        topP: settings.topP,
        topK: settings.topK,
        numCtx: settings.numCtx,
      });
    }
  }, [editingConfig]);

  const handleSave = async () => {
    if (!config.name.trim()) {
      toast.error("Please enter a configuration name");
      return;
    }
    
    if (!config.serverUrl.trim()) {
      toast.error("Please enter a server URL");
      return;
    }

    if (!config.model.trim()) {
      toast.error("Please select a model");
      return;
    }

    try {
      const { name, ...settings } = config;
      
      if (editingConfig) {
        // Update existing configuration
        await updateConfiguration.mutateAsync({
          configId: editingConfig.id,
          data: {
            name,
            settings,
          },
        });
        toast.success("Configuration updated successfully!");
      } else {
        // Create new configuration
        await createConfiguration.mutateAsync({
          name,
          provider: "ollama",
          settings,
          isActive: true,
        });
        toast.success("Configuration saved successfully!");
        
        // Reset form for new configurations
        setConfig({
          name: "",
          serverUrl: "http://localhost:11434",
          model: "",
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9,
          topK: 40,
          numCtx: 4096,
        });
      }
      
      // Call the onSaved callback to navigate back
      onSaved?.();
    } catch (error) {
      toast.error(`Failed to ${editingConfig ? 'update' : 'save'} configuration`);
    }
  };

  const handleTest = async () => {
    if (!config.serverUrl.trim()) {
      toast.error("Please enter a server URL to test connection");
      return;
    }

    try {
      const { name, ...settings } = config;
      const result = await testConnection.mutateAsync({
        provider: "ollama",
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

  const fetchAvailableModels = async () => {
    setIsLoadingModels(true);
    try {
      // TODO: Implement actual API call to fetch models
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      setAvailableModels(["llama3.2:3b", "mistral:7b", "codellama:7b"]);
    } catch (error) {
      console.error("Failed to fetch models");
    } finally {
      setIsLoadingModels(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Server Configuration */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="configName">Configuration Name *</Label>
          <Input
            id="configName"
            placeholder="e.g., 'Local Ollama Setup'"
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
          <Label htmlFor="serverUrl">Server URL *</Label>
          <Input
            id="serverUrl"
            type="url"
            placeholder="http://localhost:11434"
            value={config.serverUrl}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, serverUrl: e.target.value }))
            }
          />
          <p className="text-sm text-muted-foreground">
            The URL where your Ollama server is running. Default is
            http://localhost:11434
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="model">Model</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAvailableModels}
              disabled={isLoadingModels || !config.serverUrl}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoadingModels ? "animate-spin" : ""}`}
              />
              {isLoadingModels ? "Loading..." : "Fetch Models"}
            </Button>
          </div>

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
              {availableModels.length > 0 && (
                <>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      <div className="flex items-center">
                        <Badge variant="secondary" className="mr-2 text-xs">
                          Available
                        </Badge>
                        {model}
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1">
                    <div className="border-t my-1" />
                  </div>
                </>
              )}
              {popularModels.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                  {!availableModels.includes(model) && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Popular
                    </Badge>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <p className="text-sm text-muted-foreground">
            Select a model from your local Ollama installation or choose a
            popular model to pull.
          </p>
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
              <Label>Context Length (num_ctx)</Label>
              <span className="text-sm text-muted-foreground">
                {config.numCtx}
              </span>
            </div>
            <Slider
              value={[config.numCtx]}
              onValueChange={([value]) =>
                setConfig((prev) => ({ ...prev, numCtx: value }))
              }
              max={32768}
              min={1024}
              step={512}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Sets the size of the context window used to generate responses.
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

      {/* Installation Guide */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Server className="h-5 w-5 mr-2" />
            Ollama Setup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Don't have Ollama installed? Follow these steps:
          </p>
          <ol className="text-sm space-y-1 ml-4 list-decimal">
            <li>
              Download and install Ollama from{" "}
              <a
                href="https://ollama.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                ollama.ai
              </a>
            </li>
            <li>
              Run{" "}
              <code className="bg-muted px-1 rounded">
                ollama pull {config.model || "llama3.2:3b"}
              </code>{" "}
              to download a model
            </li>
            <li>Start the Ollama server (usually runs automatically)</li>
            <li>Test your connection using the button below</li>
          </ol>
        </CardContent>
      </Card>


      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={!config.serverUrl || testConnection.isPending}
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
          disabled={!config.serverUrl || !config.model || !config.name.trim() || createConfiguration.isPending || updateConfiguration.isPending}
        >
          {(createConfiguration.isPending || updateConfiguration.isPending) ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {(createConfiguration.isPending || updateConfiguration.isPending) ? 
            (editingConfig ? "Updating..." : "Saving...") : 
            (editingConfig ? "Update Configuration" : "Save Configuration")
          }
        </Button>
      </div>
    </div>
  );
}
