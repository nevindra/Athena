import { ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { AIProvider, AIConfiguration } from "@athena/shared";
import { GeminiConfig } from "./gemini-config";
import { HttpApiConfig } from "./http-api-config";
import { OllamaConfig } from "./ollama-config";

interface ProviderConfigProps {
  provider: AIProvider | null;
  onBack: () => void;
  editingConfig?: AIConfiguration | null;
}

const providerTitles = {
  gemini: "Google Gemini Configuration",
  ollama: "Ollama Configuration",
  "http-api": "Direct HTTP API Configuration",
};

const providerDescriptions = {
  gemini: "Configure your Google Gemini API settings and model parameters.",
  ollama: "Set up your local Ollama server connection and model preferences.",
  "http-api":
    "Connect to any OpenAI-compatible API endpoint with custom settings.",
};

export function ProviderConfig({ provider, onBack, editingConfig }: ProviderConfigProps) {
  if (!provider) return null;

  const renderConfigForm = () => {
    switch (provider) {
      case "gemini":
        return <GeminiConfig editingConfig={editingConfig} onSaved={onBack} />;
      case "ollama":
        return <OllamaConfig editingConfig={editingConfig} onSaved={onBack} />;
      case "http-api":
        return <HttpApiConfig editingConfig={editingConfig} onSaved={onBack} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Providers
        </Button>
      </div>

      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {providerTitles[provider]}
        </h1>
        <p className="text-muted-foreground">
          {providerDescriptions[provider]}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>{renderConfigForm()}</CardContent>
      </Card>
    </div>
  );
}
