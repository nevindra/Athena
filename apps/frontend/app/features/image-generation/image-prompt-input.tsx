import { Settings2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { GenerationParams } from "./generation-params";

interface ImagePromptInputProps {
  onGenerate: (prompt: string, parameters: GenerationParameters) => void;
  isGenerating: boolean;
}

export interface GenerationParameters {
  count: number;
  size: string;
  style: string;
}

const imageModels = [
  { id: "dall-e-3", name: "DALL-E 3", provider: "OpenAI" },
  { id: "dall-e-2", name: "DALL-E 2", provider: "OpenAI" },
  { id: "sdxl", name: "Stable Diffusion XL", provider: "Stability AI" },
  { id: "midjourney", name: "Midjourney", provider: "Midjourney" },
];

export function ImagePromptInput({ onGenerate, isGenerating }: ImagePromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedModel, setSelectedModel] = useState("dall-e-3");
  const [parameters, setParameters] = useState<GenerationParameters>({
    count: 1,
    size: "1024x1024",
    style: "Photorealistic",
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = () => {
    if (prompt.trim() && !isGenerating) {
      onGenerate(prompt.trim(), parameters);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const insertSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const selectedModelData = imageModels.find(m => m.id === selectedModel);

  return (
    <div className="space-y-6">
      {/* Model Selection */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Label className="text-sm font-medium">Image Model</Label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {imageModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span>{model.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {model.provider}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2"
        >
          <Settings2 className="h-4 w-4" />
          Advanced
        </Button>
      </div>

      {/* Advanced Parameters */}
      {showAdvanced && (
        <GenerationParams
          parameters={parameters}
          onParametersChange={setParameters}
        />
      )}

      {/* Prompt Input */}
      <div className="space-y-2">
        <Label htmlFor="prompt" className="text-sm font-medium">
          Describe your image
        </Label>
        <div className="relative">
          <Textarea
            id="prompt"
            placeholder="Describe the image you want to generate..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyPress}
            className="min-h-[120px] resize-none pr-20 text-base leading-relaxed"
            disabled={isGenerating}
          />
          <div className="absolute right-3 bottom-3 flex items-center gap-2">
            <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded border">
              ⌘ Enter
            </kbd>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-between items-center pt-4 border-t border-border/30">
        <div className="text-sm text-muted-foreground">
          {selectedModelData && (
            <span>Using {selectedModelData.name} • {parameters.count} image{parameters.count > 1 ? 's' : ''} • {parameters.size}</span>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!prompt.trim() || isGenerating}
          size="lg"
          className="px-8 gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg"
        >
          {isGenerating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Image{parameters.count > 1 ? 's' : ''}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
