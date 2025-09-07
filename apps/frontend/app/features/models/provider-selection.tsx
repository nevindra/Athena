import { ArrowLeft, Bot, Globe, Server } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import type { AIProvider } from "~/routes/models";

interface ProviderSelectionProps {
  onProviderSelect: (provider: AIProvider) => void;
  onBack?: () => void;
}

const providers = [
  {
    id: "gemini" as const,
    name: "Google Gemini",
    description: "Google's advanced AI model with multimodal capabilities",
    icon: Bot,
    features: [
      "Text generation",
      "Code assistance",
      "Image understanding",
      "Conversation",
    ],
    color: "border-blue-200 hover:border-blue-300 hover:bg-blue-50/50",
  },
  {
    id: "ollama" as const,
    name: "Ollama",
    description: "Run large language models locally on your machine",
    icon: Server,
    features: [
      "Local deployment",
      "Privacy focused",
      "Customizable models",
      "Offline support",
    ],
    color: "border-green-200 hover:border-green-300 hover:bg-green-50/50",
  },
  {
    id: "http-api" as const,
    name: "Direct HTTP API",
    description: "Connect to any OpenAI-compatible API endpoint",
    icon: Globe,
    features: [
      "Custom endpoints",
      "Flexible authentication",
      "Any OpenAI format",
      "Self-hosted",
    ],
    color: "border-purple-200 hover:border-purple-300 hover:bg-purple-50/50",
  },
];

export function ProviderSelection({
  onProviderSelect,
  onBack,
}: ProviderSelectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Models
          </Button>
        )}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Add New Configuration
          </h1>
          <p className="text-muted-foreground">
            Choose an AI provider to configure your model settings and start
            chatting.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {providers.map((provider) => {
          const Icon = provider.icon;
          return (
            <Card
              key={provider.id}
              className={`transition-all duration-200 cursor-pointer ${provider.color}`}
              onClick={() => onProviderSelect(provider.id)}
            >
              <CardHeader className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-background/80">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{provider.name}</CardTitle>
                  </div>
                </div>
                <CardDescription className="text-sm leading-relaxed">
                  {provider.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Features:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {provider.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <span className="mr-2">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                <Button className="w-full" variant="outline">
                  Configure {provider.name}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="rounded-lg border bg-card p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Need Help Choosing?</h3>
        <p className="text-muted-foreground mb-4">
          Not sure which provider is right for you? Here are some quick
          recommendations:
        </p>
        <div className="grid gap-3 md:grid-cols-3 text-sm">
          <div className="space-y-1">
            <p className="font-medium">For General Use</p>
            <p className="text-muted-foreground">
              Choose <strong>Google Gemini</strong> for reliable performance
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">For Privacy</p>
            <p className="text-muted-foreground">
              Choose <strong>Ollama</strong> to keep data local
            </p>
          </div>
          <div className="space-y-1">
            <p className="font-medium">For Custom APIs</p>
            <p className="text-muted-foreground">
              Choose <strong>HTTP API</strong> for flexibility
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
