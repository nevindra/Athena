import {
  Eye,
  EyeOff,
  Plus,
  TestTube,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
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
import {
  useCreateConfiguration,
  useUpdateConfiguration,
  useTestConnection,
} from "~/hooks/use-configurations";
import type { HttpApiConfigSettings, AIConfiguration } from "@athena/shared";
import { toast } from "sonner";
import { QuickSetup } from "~/components/models/quick-setup";
import { ModelParams } from "~/components/models/model-params";
import { CustomSystemPrompt } from "~/components/models/custom-system-prompt";

interface HttpApiConfigData extends Omit<HttpApiConfigSettings, 'temperature' | 'maxTokens' | 'topP' | 'presencePenalty' | 'frequencyPenalty'> {
  name: string; // Add name field for saving
  // Allow temporary string values during editing for numeric fields
  temperature: number | string;
  maxTokens: number | string;
  topP: number | string;
  presencePenalty: number | string;
  frequencyPenalty: number | string;
}

interface HttpApiConfigProps {
  editingConfig?: AIConfiguration | null;
  onSaved?: () => void;
}


// Helper function to convert config to proper numeric types for API
const prepareSettingsForApi = (config: HttpApiConfigData): HttpApiConfigSettings => {
  const { name, ...settings } = config;
  
  // Prepare the settings object with proper type conversion
  const baseSettings = {
    ...settings,
    temperature: typeof settings.temperature === 'string' ? Number.parseFloat(settings.temperature) || 0.7 : settings.temperature,
    maxTokens: typeof settings.maxTokens === 'string' ? Number.parseInt(settings.maxTokens) || 2048 : settings.maxTokens,
    topP: typeof settings.topP === 'string' ? Number.parseFloat(settings.topP) || 1.0 : settings.topP,
    presencePenalty: typeof settings.presencePenalty === 'string' ? Number.parseFloat(settings.presencePenalty) || 0 : settings.presencePenalty,
    frequencyPenalty: typeof settings.frequencyPenalty === 'string' ? Number.parseFloat(settings.frequencyPenalty) || 0 : settings.frequencyPenalty,
  };

  // Handle API key based on auth type
  if (settings.authType === "none" || settings.authType === "custom" || !settings.apiKey?.trim()) {
    // For "none" and "custom" auth types, or empty API key, don't include apiKey at all
    const { apiKey, ...preparedSettings } = baseSettings;
    return preparedSettings as HttpApiConfigSettings;
  }

  return baseSettings as HttpApiConfigSettings;
};

export function HttpApiConfig({ editingConfig, onSaved }: HttpApiConfigProps) {
  const [config, setConfig] = useState<HttpApiConfigData>({
    name: "",
    baseUrl: "",
    apiKey: "",
    model: "gpt-3.5-turbo",
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1.0,
    presencePenalty: 0,
    frequencyPenalty: 0,
    headers: {},
    authType: "bearer",
    customPrompt: "",
    streamResponse: true,
  });

  const [showApiKey, setShowApiKey] = useState(false);

  // TanStack Query hooks
  const createConfiguration = useCreateConfiguration();
  const updateConfiguration = useUpdateConfiguration();
  const testConnection = useTestConnection();

  // Load existing configuration when editing
  useEffect(() => {
    if (editingConfig && editingConfig.provider === "http-api") {
      const settings = editingConfig.settings as HttpApiConfigSettings;
      setConfig({
        name: editingConfig.name,
        baseUrl: settings.baseUrl,
        apiKey: settings.apiKey,
        model: settings.model,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
        topP: settings.topP,
        presencePenalty: settings.presencePenalty,
        frequencyPenalty: settings.frequencyPenalty,
        headers: settings.headers,
        authType: settings.authType,
        customPrompt: settings.customPrompt,
        streamResponse: settings.streamResponse,
      });
    }
  }, [editingConfig]);

  const handleSave = async () => {
    if (!config.name.trim()) {
      toast.error("Please enter a configuration name");
      return;
    }

    if (!config.baseUrl.trim()) {
      toast.error("Please enter a base URL");
      return;
    }

    if (
      config.authType !== "custom" &&
      config.authType !== "none" &&
      !config.apiKey?.trim()
    ) {
      toast.error("Please enter your API key or token");
      return;
    }

    if (!config.model.trim()) {
      toast.error("Please enter a model name");
      return;
    }

    try {
      const settings = prepareSettingsForApi(config);

      if (editingConfig) {
        // Update existing configuration
        await updateConfiguration.mutateAsync({
          configId: editingConfig.id,
          data: {
            name: config.name,
            settings,
          },
        });
        toast.success("Configuration updated successfully!");
      } else {
        // Create new configuration
        await createConfiguration.mutateAsync({
          name: config.name,
          provider: "http-api",
          settings,
          isActive: true,
        });
        toast.success("Configuration saved successfully!");

        // Reset form for new configurations
        setConfig({
          name: "",
          baseUrl: "",
          apiKey: "",
          model: "gpt-3.5-turbo",
          temperature: 0.7,
          maxTokens: 2048,
          topP: 1.0,
          presencePenalty: 0,
          frequencyPenalty: 0,
          headers: {},
          authType: "bearer",
          customPrompt: "",
          streamResponse: true,
        });
      }

      // Call the onSaved callback to navigate back
      onSaved?.();
    } catch (error) {
      toast.error(
        `Failed to ${editingConfig ? "update" : "save"} configuration`
      );
    }
  };

  const handleTest = async () => {
    if (!config.baseUrl.trim()) {
      toast.error("Please enter a base URL to test connection");
      return;
    }

    if (
      config.authType !== "custom" &&
      config.authType !== "none" &&
      !config.apiKey?.trim()
    ) {
      toast.error("Please enter your API key or token to test connection");
      return;
    }

    try {
      const settings = prepareSettingsForApi(config);
      const result = await testConnection.mutateAsync({
        provider: "http-api",
        settings,
      });

      if (result.success) {
        toast.success(
          `Connection successful! ${result.model ? `Model: ${result.model}` : ""} ${result.latency ? `(${result.latency}ms)` : ""}`
        );
      } else {
        toast.error(result.error || "Connection test failed");
      }
    } catch (error) {
      toast.error("Failed to test connection");
    }
  };

  const [newHeaderKey, setNewHeaderKey] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");

  const addHeader = () => {
    if (newHeaderKey.trim() && newHeaderValue.trim()) {
      setConfig((prev) => ({
        ...prev,
        headers: {
          ...prev.headers,
          [newHeaderKey.trim()]: newHeaderValue.trim(),
        },
      }));
      setNewHeaderKey("");
      setNewHeaderValue("");
    }
  };

  const removeHeader = (key: string) => {
    setConfig((prev) => {
      const { [key]: removed, ...rest } = prev.headers;
      return { ...prev, headers: rest };
    });
  };

  const selectCommonEndpoint = (url: string) => {
    setConfig((prev) => ({ ...prev, baseUrl: url }));
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
      setConfig((prev) => ({ ...prev, topP: 1.0 }));
    } else {
      const num = Number.parseFloat(value);
      if (Number.isNaN(num) || num < 0 || num > 1) {
        setConfig((prev) => ({ ...prev, topP: 1.0 }));
      } else {
        setConfig((prev) => ({ ...prev, topP: num }));
      }
    }
  };

  const handlePresencePenaltyChange = (value: string) => {
    setConfig((prev) => ({ ...prev, presencePenalty: value }));
  };

  const handlePresencePenaltyBlur = (value: string) => {
    if (value === "") {
      setConfig((prev) => ({ ...prev, presencePenalty: 0 }));
    } else {
      const num = Number.parseFloat(value);
      if (Number.isNaN(num) || num < -2 || num > 2) {
        setConfig((prev) => ({ ...prev, presencePenalty: 0 }));
      } else {
        setConfig((prev) => ({ ...prev, presencePenalty: num }));
      }
    }
  };

  const handleFrequencyPenaltyChange = (value: string) => {
    setConfig((prev) => ({ ...prev, frequencyPenalty: value }));
  };

  const handleFrequencyPenaltyBlur = (value: string) => {
    if (value === "") {
      setConfig((prev) => ({ ...prev, frequencyPenalty: 0 }));
    } else {
      const num = Number.parseFloat(value);
      if (Number.isNaN(num) || num < -2 || num > 2) {
        setConfig((prev) => ({ ...prev, frequencyPenalty: 0 }));
      } else {
        setConfig((prev) => ({ ...prev, frequencyPenalty: num }));
      }
    }
  };

  const handleStreamResponseChange = (value: boolean) => {
    setConfig((prev) => ({ ...prev, streamResponse: value }));
  };

  return (
    <div className="space-y-6">
      {/* Quick Setup */}
      <QuickSetup onSelectEndpoint={selectCommonEndpoint} />

      {/* Endpoint Configuration */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="configName">Configuration Name *</Label>
          <Input
            id="configName"
            placeholder="e.g., 'OpenAI API Config'"
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
          <Label htmlFor="baseUrl">Base URL *</Label>
          <Input
            id="baseUrl"
            type="url"
            placeholder="https://api.openai.com/v1"
            value={config.baseUrl}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))
            }
          />
          <p className="text-sm text-muted-foreground">
            The base URL for your API endpoint (without trailing slash)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="authType">Authentication Type</Label>
          <Select
            value={config.authType}
            onValueChange={(value: "bearer" | "api-key" | "custom" | "none") =>
              setConfig((prev) => ({ ...prev, authType: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bearer">Bearer Token</SelectItem>
              <SelectItem value="api-key">API Key Header</SelectItem>
              <SelectItem value="custom">Custom Headers</SelectItem>
              <SelectItem value="none">No Authentication</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {config.authType !== "custom" && config.authType !== "none" && (
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              {config.authType === "bearer" ? "Bearer Token" : "API Key"}
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder={`Enter your ${config.authType === "bearer" ? "bearer token" : "API key"}`}
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
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            placeholder="gpt-3.5-turbo"
            value={config.model}
            onChange={(e) =>
              setConfig((prev) => ({ ...prev, model: e.target.value }))
            }
          />
          <p className="text-sm text-muted-foreground">
            The model identifier to use for requests
          </p>
        </div>
      </div>

      {/* Custom Headers */}
      {config.authType === "custom" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Custom Headers</CardTitle>
              <Button size="sm" onClick={addHeader}>
                <Plus className="h-4 w-4 mr-2" />
                Add Header
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Add new header form */}
              <div className="flex gap-2">
                <Input
                  placeholder="Header name"
                  value={newHeaderKey}
                  onChange={(e) => setNewHeaderKey(e.target.value)}
                />
                <Input
                  placeholder="Header value"
                  value={newHeaderValue}
                  onChange={(e) => setNewHeaderValue(e.target.value)}
                />
                <Button
                  size="sm"
                  onClick={addHeader}
                  disabled={!newHeaderKey.trim() || !newHeaderValue.trim()}
                >
                  Add
                </Button>
              </div>

              {/* Existing headers */}
              {Object.entries(config.headers).map(([key, value]) => (
                <div key={key} className="flex gap-2 items-center">
                  <div className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded">
                    {key}: {value}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeHeader(key)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {Object.keys(config.headers).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No custom headers added yet. Add authentication headers above.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Model Parameters */}
      <ModelParams
        temperature={config.temperature}
        maxTokens={config.maxTokens}
        topP={config.topP}
        presencePenalty={config.presencePenalty}
        frequencyPenalty={config.frequencyPenalty}
        streamResponse={config.streamResponse}
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
          disabled={
            !config.baseUrl ||
            (!config.apiKey?.trim() &&
              config.authType !== "custom" &&
              config.authType !== "none") ||
            testConnection.isPending
          }
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
          disabled={
            !config.baseUrl ||
            (!config.apiKey?.trim() &&
              config.authType !== "custom" &&
              config.authType !== "none") ||
            !config.name.trim() ||
            createConfiguration.isPending ||
            updateConfiguration.isPending
          }
        >
          {createConfiguration.isPending || updateConfiguration.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {createConfiguration.isPending || updateConfiguration.isPending
            ? editingConfig
              ? "Updating..."
              : "Saving..."
            : editingConfig
              ? "Update Configuration"
              : "Save Configuration"}
        </Button>
      </div>
    </div>
  );
}
