import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";

const commonEndpoints = [
  { name: "OpenAI", url: "https://api.openai.com/v1" },
  { name: "Azure OpenAI", url: "https://your-resource.openai.azure.com" },
  { name: "Anthropic", url: "https://api.anthropic.com" },
  { name: "Local (LM Studio)", url: "http://localhost:1234/v1" },
  { name: "Local (Text Generation WebUI)", url: "http://localhost:5000/v1" },
];

interface QuickSetupProps {
  onSelectEndpoint: (url: string) => void;
}

export function QuickSetup({ onSelectEndpoint }: QuickSetupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Setup</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label>Common API Endpoints</Label>
          <div className="grid gap-2 md:grid-cols-2">
            {commonEndpoints.map((endpoint) => (
              <Button
                key={endpoint.name}
                variant="outline"
                size="sm"
                onClick={() => onSelectEndpoint(endpoint.url)}
                className="justify-start"
              >
                {endpoint.name}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}