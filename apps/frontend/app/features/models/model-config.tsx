import {
  Eye,
  EyeOff,
  Plus,
  TestTube,
  Trash2,
  Save,
  Loader2,
  RefreshCw,
  Server,
} from "lucide-react";
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
import { Textarea } from "~/components/ui/textarea";
import { Checkbox } from "~/components/ui/checkbox";
import {
  useCreateConfiguration,
  useUpdateConfiguration,
  useTestConnection,
} from "~/hooks/use-configurations";
import type { AIConfiguration } from "@athena/shared";
import { toast } from "sonner";
import { QuickSetup } from "~/components/models/quick-setup";
import { ModelParams } from "~/components/models/model-params";
import { CustomSystemPrompt } from "~/components/models/custom-system-prompt";
import {
  type ProviderType,
  type FieldDefinition,
  type ConditionalLogic,
  type SliderOptions,
  type SelectOption,
  getProviderDefinition,
  prepareSettingsForApi,
} from "./provider-definitions";

interface ModelConfigProps {
  provider: ProviderType;
  editingConfig?: AIConfiguration | null;
  onSaved?: () => void;
}

export function ModelConfig({ provider, editingConfig, onSaved }: ModelConfigProps) {
  const providerDef = getProviderDefinition(provider);
  const [config, setConfig] = useState<Record<string, any>>(providerDef.defaultValues);
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

  // State for HTTP API specific features
  const [newHeaderKey, setNewHeaderKey] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");

  // State for Ollama specific features
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  // TanStack Query hooks
  const createConfiguration = useCreateConfiguration();
  const updateConfiguration = useUpdateConfiguration();
  const testConnection = useTestConnection();

  // Load existing configuration when editing
  useEffect(() => {
    if (editingConfig && editingConfig.provider === provider) {
      const settings = editingConfig.settings as any;
      setConfig({
        name: editingConfig.name,
        ...settings,
      });
    } else {
      setConfig(providerDef.defaultValues);
    }
  }, [editingConfig, provider, providerDef.defaultValues]);

  // Check if field should be visible based on conditional logic
  const isFieldVisible = (field: FieldDefinition): boolean => {
    if (!field.conditional) return true;

    const { field: condField, operator, value } = field.conditional;
    const fieldValue = config[condField];

    switch (operator) {
      case "equals":
        return fieldValue === value;
      case "not_equals":
        return fieldValue !== value;
      case "in":
        return Array.isArray(value) && value.includes(fieldValue);
      case "not_in":
        return Array.isArray(value) && !value.includes(fieldValue);
      default:
        return true;
    }
  };

  // Handle field changes
  const handleFieldChange = (key: string, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (key: string) => {
    setShowPassword((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // HTTP API specific: Add header
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

  // HTTP API specific: Remove header
  const removeHeader = (key: string) => {
    setConfig((prev) => {
      const { [key]: removed, ...rest } = prev.headers;
      return { ...prev, headers: rest };
    });
  };

  // HTTP API specific: Select common endpoint
  const selectCommonEndpoint = (url: string) => {
    setConfig((prev) => ({ ...prev, baseUrl: url }));
  };

  // Ollama specific: Fetch available models
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

  // Validation
  const validateForm = (): string | null => {
    // Check required fields
    for (const requiredField of providerDef.validation.required) {
      if (!config[requiredField]?.toString().trim()) {
        const field = providerDef.fields.find(f => f.key === requiredField);
        return `Please enter ${field?.label || requiredField}`;
      }
    }

    // Custom validation
    if (providerDef.validation.custom) {
      return providerDef.validation.custom(config);
    }

    return null;
  };

  // Handle save
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    try {
      const settings = prepareSettingsForApi(provider, config);

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
          provider,
          settings,
          isActive: true,
        });
        toast.success("Configuration saved successfully!");

        // Reset form for new configurations
        setConfig(providerDef.defaultValues);
      }

      // Call the onSaved callback to navigate back
      onSaved?.();
    } catch (error) {
      toast.error(
        `Failed to ${editingConfig ? "update" : "save"} configuration`
      );
    }
  };

  // Handle test connection
  const handleTest = async () => {
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError.replace("Please enter", "Please enter your") + " to test connection");
      return;
    }

    try {
      const settings = prepareSettingsForApi(provider, config);
      const result = await testConnection.mutateAsync({
        provider,
        settings,
      });

      if (result.success) {
        toast.success(
          `Connection successful! ${result.model ? `Model: ${result.model}` : ""} ${
            result.latency ? `(${result.latency}ms)` : ""
          }`
        );
      } else {
        toast.error(result.error || "Connection test failed");
      }
    } catch (error) {
      toast.error("Failed to test connection");
    }
  };

  // Model params handlers (for Gemini and HTTP API)
  const getModelParamsHandlers = () => {
    const createHandler = (key: string, defaultValue: number, min: number, max: number) => ({
      onChange: (value: string) => handleFieldChange(key, value),
      onBlur: (value: string) => {
        if (value === "") {
          handleFieldChange(key, defaultValue);
        } else {
          const num = key.includes("Token") ? Number.parseInt(value) : Number.parseFloat(value);
          if (Number.isNaN(num) || num < min || num > max) {
            handleFieldChange(key, defaultValue);
          } else {
            handleFieldChange(key, num);
          }
        }
      },
    });

    return {
      temperature: createHandler("temperature", 0.7, 0, 2),
      maxTokens: createHandler("maxTokens", 2048, 1, 8192),
      topP: createHandler("topP", provider === "gemini" ? 0.9 : 1.0, 0, 1),
      presencePenalty: createHandler("presencePenalty", 0, -2, 2),
      frequencyPenalty: createHandler("frequencyPenalty", 0, -2, 2),
      streamResponse: {
        onChange: (value: boolean) => handleFieldChange("streamResponse", value),
      },
    };
  };

  // Render individual field
  const renderField = (field: FieldDefinition) => {
    if (!isFieldVisible(field)) return null;

    const value = config[field.key];

    switch (field.type) {
      case "text":
      case "url":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} {field.required && "*"}
            </Label>
            <Input
              id={field.key}
              type={field.type}
              placeholder={field.placeholder}
              value={value || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            />
            {field.description && (
              <p 
                className="text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: field.description }}
              />
            )}
          </div>
        );

      case "password":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} {field.required && "*"}
            </Label>
            <div className="relative">
              <Input
                id={field.key}
                type={showPassword[field.key] ? "text" : "password"}
                placeholder={field.placeholder}
                value={value || ""}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                className="pr-10"
              />
              {field.visibilityToggle && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => togglePasswordVisibility(field.key)}
                >
                  {showPassword[field.key] ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            {field.description && (
              <p 
                className="text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: field.description }}
              />
            )}
          </div>
        );

      case "select":
        const options = field.options as SelectOption[];
        return (
          <div key={field.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={field.key}>
                {field.label} {field.required && "*"}
              </Label>
              {provider === "ollama" && field.key === "model" && (
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
              )}
            </div>
            <Select
              value={value || ""}
              onValueChange={(newValue) => handleFieldChange(field.key, newValue)}
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {/* Show available models for Ollama */}
                {provider === "ollama" && field.key === "model" && availableModels.length > 0 && (
                  <>
                    {availableModels.map((model) => (
                      <SelectItem key={`available-${model}`} value={model}>
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
                
                {options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center">
                      {option.label}
                      {option.badge && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          {option.badge}
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {field.description && (
              <p 
                className="text-sm text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: field.description }}
              />
            )}
          </div>
        );

      case "slider":
        const sliderOptions = field.options as SliderOptions;
        return (
          <div key={field.key} className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>{field.label}</Label>
              <span className="text-sm text-muted-foreground">{value}</span>
            </div>
            <Slider
              value={[value || sliderOptions.min]}
              onValueChange={([newValue]) => handleFieldChange(field.key, newValue)}
              max={sliderOptions.max}
              min={sliderOptions.min}
              step={sliderOptions.step}
              className="w-full"
            />
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case "textarea":
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>
              {field.label} {field.required && "*"}
            </Label>
            <Textarea
              id={field.key}
              placeholder={field.placeholder}
              value={value || ""}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case "checkbox":
        return (
          <div key={field.key} className="flex items-center space-x-2">
            <Checkbox
              id={field.key}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
            />
            <Label htmlFor={field.key}>{field.label}</Label>
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );

      case "headers":
        return (
          <Card key={field.key}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{field.label}</CardTitle>
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
                {Object.entries(value || {}).map(([key, headerValue]) => (
                  <div key={key} className="flex gap-2 items-center">
                    <div className="flex-1 font-mono text-sm bg-muted px-3 py-2 rounded">
                      {key}: {headerValue}
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
                {Object.keys(value || {}).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No custom headers added yet. Add authentication headers above.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  // Render special sections
  const renderSpecialSections = () => {
    return providerDef.specialSections.map((section, index) => {
      switch (section.type) {
        case "quick-setup":
          return <QuickSetup key={index} onSelectEndpoint={selectCommonEndpoint} />;

        case "model-params":
          const handlers = getModelParamsHandlers();
          return (
            <ModelParams
              key={index}
              temperature={config.temperature}
              maxTokens={config.maxTokens}
              topP={config.topP}
              presencePenalty={config.presencePenalty || 0}
              frequencyPenalty={config.frequencyPenalty || 0}
              streamResponse={config.streamResponse !== undefined ? config.streamResponse : true}
              onTemperatureChange={handlers.temperature.onChange}
              onTemperatureBlur={handlers.temperature.onBlur}
              onMaxTokensChange={handlers.maxTokens.onChange}
              onMaxTokensBlur={handlers.maxTokens.onBlur}
              onTopPChange={handlers.topP.onChange}
              onTopPBlur={handlers.topP.onBlur}
              onPresencePenaltyChange={handlers.presencePenalty.onChange}
              onPresencePenaltyBlur={handlers.presencePenalty.onBlur}
              onFrequencyPenaltyChange={handlers.frequencyPenalty.onChange}
              onFrequencyPenaltyBlur={handlers.frequencyPenalty.onBlur}
              onStreamResponseChange={handlers.streamResponse.onChange}
            />
          );

        case "custom-prompt":
          return (
            <CustomSystemPrompt
              key={index}
              value={config.customPrompt || ""}
              onChange={(value) => handleFieldChange("customPrompt", value)}
            />
          );

        case "installation-guide":
          return (
            <Card key={index} className="border-blue-200 bg-blue-50/50">
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
          );

        default:
          return null;
      }
    });
  };

  const isFormValid = () => {
    return validateForm() === null;
  };

  const isLoading = createConfiguration.isPending || updateConfiguration.isPending;

  return (
    <div className="space-y-6">
      {/* Basic Configuration Fields */}
      <div className="space-y-4">
        {providerDef.fields.map(renderField)}
      </div>

      {/* Special Sections */}
      {renderSpecialSections()}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={!isFormValid() || testConnection.isPending}
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
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          {isLoading
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