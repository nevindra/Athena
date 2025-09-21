"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { useConfigurations } from "~/hooks/use-configurations";
import { Save, TestTube } from "lucide-react";
import { toast } from "sonner";

interface ApiRegistrationData {
  name: string;
  description: string;
  endpoint: string;
  selectedModel: string;
  useStructuredOutput: boolean;
  apiKey: string;
}

export function ApiRegistrationForm() {
  const { data: configurations } = useConfigurations();
  const [formData, setFormData] = useState<ApiRegistrationData>({
    name: "",
    description: "",
    endpoint: "",
    selectedModel: "",
    useStructuredOutput: false,
    apiKey: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleInputChange = (field: keyof ApiRegistrationData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      // Simulate API test - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success("Connection successful", {
        description: "Your API endpoint is reachable and working correctly.",
      });
    } catch (error) {
      toast.error("Connection failed", {
        description: "Unable to connect to the API endpoint. Please check your configuration.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate API registration - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success("API registered successfully", {
        description: `${formData.name} has been added to your API management dashboard.`,
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        endpoint: "",
        selectedModel: "",
        useStructuredOutput: false,
        apiKey: "",
      });
    } catch (error) {
      toast.error("Registration failed", {
        description: "Failed to register the API. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.name && formData.endpoint && formData.selectedModel;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>API Registration</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api-name">API Name *</Label>
              <Input
                id="api-name"
                placeholder="Enter a descriptive name for your API"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-description">Description</Label>
              <Textarea
                id="api-description"
                placeholder="Describe what this API is used for"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-endpoint">API Endpoint *</Label>
              <Input
                id="api-endpoint"
                placeholder="https://api.example.com/v1/chat"
                value={formData.endpoint}
                onChange={(e) => handleInputChange("endpoint", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="Enter your API key (optional)"
                value={formData.apiKey}
                onChange={(e) => handleInputChange("apiKey", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-select">Select Model *</Label>
              <Select
                value={formData.selectedModel}
                onValueChange={(value) => handleInputChange("selectedModel", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a configured model" />
                </SelectTrigger>
                <SelectContent>
                  {configurations?.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name} ({config.provider})
                    </SelectItem>
                  ))}
                  {(!configurations || configurations.length === 0) && (
                    <SelectItem value="none" disabled>
                      No models configured
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="structured-output"
                checked={formData.useStructuredOutput}
                onCheckedChange={(checked) => handleInputChange("useStructuredOutput", checked)}
              />
              <Label htmlFor="structured-output">Use Structured Output</Label>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
              disabled={!formData.endpoint || isTesting}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {isTesting ? "Testing..." : "Test Connection"}
            </Button>
            <Button type="submit" disabled={!isFormValid || isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Registering..." : "Register API"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}