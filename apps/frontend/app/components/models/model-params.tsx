import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";
import { Slider } from "~/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { ProviderType } from "~/features/models/provider-definitions";
import { getProviderDefinition } from "~/features/models/provider-definitions";

interface ModelParamsProps {
  provider: ProviderType;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export function ModelParams({
  provider,
  values,
  onChange,
}: ModelParamsProps) {
  const providerDefinition = getProviderDefinition(provider);
  
  if (!providerDefinition) {
    return null;
  }
  
  // Get model parameter fields directly from provider definition
  const paramFields = providerDefinition.fields.filter(field => 
    field.type === "slider" || (field.type === "select" && field.key === "streamResponse")
  );
  
  // Add badges for better UX
  const allFields = paramFields.map(field => ({
    ...field,
    badge: getBadgeForField(field.key)
  }));
  
  function getBadgeForField(key: string): string {
    switch (key) {
      case "temperature": return "Creativity";
      case "maxTokens": return "Length";
      case "topP": return "Focus";
      case "presencePenalty": return "Topics";
      case "frequencyPenalty": return "Repetition";
      case "streamResponse": return "Real-time";
      case "topK": return "Selection";
      case "numCtx": return "Context";
      default: return "Parameter";
    }
  }
  
  const renderField = (field: { key: string; label: string; type: string; description?: string; options?: { min: number; max: number; step: number } | { value: string; label: string }[]; badge?: string }) => {
    const value = values[field.key];
    
    if (field.type === "slider" && field.options && typeof field.options === 'object' && 'min' in field.options) {
      return (
        <div className="space-y-3" key={field.key}>
          <div className="flex items-center gap-2">
            <Label htmlFor={field.key} className="font-medium">
              {field.label}
            </Label>
            {field.badge && <Badge>{field.badge}</Badge>}
          </div>
          <div className="space-y-2">
            <Slider
              id={field.key}
              min={field.options.min}
              max={field.options.max}
              step={field.options.step}
              value={[typeof value === "string" ? Number.parseFloat(value) || field.options.min : (value as number) || field.options.min]}
              onValueChange={([newValue]) => onChange(field.key, newValue)}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{field.options.min}</span>
              <span className="font-mono">{typeof value === "string" ? Number.parseFloat(value) || field.options.min : (value as number) || field.options.min}</span>
              <span>{field.options.max}</span>
            </div>
          </div>
          {field.description && (
            <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded text-center">
              {field.description}
            </p>
          )}
        </div>
      );
    }
    
    if (field.type === "select" && field.key === "streamResponse") {
      const options = field.options as { value: string; label: string }[];
      return (
        <div className="space-y-3" key={field.key}>
          <div className="flex items-center gap-2">
            <Label htmlFor={field.key} className="font-medium">
              {field.label}
            </Label>
            {field.badge && <Badge>{field.badge}</Badge>}
          </div>
          <Select
            value={value as string || "true"}
            onValueChange={(newValue) => onChange(field.key, newValue)}
          >
            <SelectTrigger className="font-mono w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {field.description && (
            <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded text-center">
              {field.description}
            </p>
          )}
        </div>
      );
    }
    
    return null;
  };
  return (
    <Card className="border-2 border-dashed border-muted-foreground/20 transition-all duration-200 hover:border-muted-foreground/40">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="model-params" className="border-none">
          <AccordionTrigger className="px-6 py-4 text-lg font-semibold rounded-t-lg transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
              Model Parameters
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid gap-6 md:grid-cols-2">
              {allFields.map(renderField)}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}