import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";

interface CustomSystemPromptProps {
  value: string;
  onChange: (value: string) => void;
}

export function CustomSystemPrompt({ value, onChange }: CustomSystemPromptProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Custom System Prompt (Optional)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Textarea
            placeholder="Enter a custom system prompt to override the default behavior..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            This will be sent as the system message with every request to
            customize AI behavior.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}