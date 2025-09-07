import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Badge } from "~/components/ui/badge";
import type { GenerationParameters } from "./image-prompt-input";

interface GenerationParamsProps {
  parameters: GenerationParameters;
  onParametersChange: (parameters: GenerationParameters) => void;
}

const imageCounts = [
  { value: 1, label: "1 image", description: "Single generation" },
  { value: 2, label: "2 images", description: "Compare variations" },
  { value: 3, label: "3 images", description: "Multiple options" },
  { value: 4, label: "4 images", description: "Maximum variety" },
];

const imageSizes = [
  { 
    value: "512x512", 
    label: "512×512", 
    description: "Square (fast)",
    aspectRatio: "1:1",
    megapixels: "0.3MP"
  },
  { 
    value: "1024x1024", 
    label: "1024×1024", 
    description: "Square (HD)",
    aspectRatio: "1:1",
    megapixels: "1.0MP"
  },
  { 
    value: "1024x1792", 
    label: "1024×1792", 
    description: "Portrait",
    aspectRatio: "9:16",
    megapixels: "1.8MP"
  },
  { 
    value: "1792x1024", 
    label: "1792×1024", 
    description: "Landscape",
    aspectRatio: "16:9",
    megapixels: "1.8MP"
  },
];

const imageStyles = [
  { 
    value: "Photorealistic", 
    label: "Photorealistic", 
    description: "Camera-like quality",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
  },
  { 
    value: "Artistic", 
    label: "Artistic", 
    description: "Creative interpretation",
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
  },
  { 
    value: "Abstract", 
    label: "Abstract", 
    description: "Non-representational",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300"
  },
  { 
    value: "Minimalist", 
    label: "Minimalist", 
    description: "Clean and simple",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  },
  { 
    value: "Vintage", 
    label: "Vintage", 
    description: "Retro aesthetic",
    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
  },
  { 
    value: "Cyberpunk", 
    label: "Cyberpunk", 
    description: "Futuristic neon",
    color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300"
  },
];

export function GenerationParams({ parameters, onParametersChange }: GenerationParamsProps) {
  const updateParameter = <K extends keyof GenerationParameters>(
    key: K,
    value: GenerationParameters[K]
  ) => {
    onParametersChange({
      ...parameters,
      [key]: value,
    });
  };

  const selectedSize = imageSizes.find(size => size.value === parameters.size);
  const selectedStyle = imageStyles.find(style => style.value === parameters.style);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-muted/30 rounded-lg border border-border/50">
      {/* Image Count */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          Number of Images
          <Badge variant="secondary" className="text-xs">
            {parameters.count}
          </Badge>
        </Label>
        <Select 
          value={parameters.count.toString()} 
          onValueChange={(value) => updateParameter("count", parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {imageCounts.map((count) => (
              <SelectItem key={count.value} value={count.value.toString()}>
                <div className="flex flex-col">
                  <span>{count.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {count.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Image Size */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          Image Size
          {selectedSize && (
            <Badge variant="secondary" className="text-xs">
              {selectedSize.megapixels}
            </Badge>
          )}
        </Label>
        <Select 
          value={parameters.size} 
          onValueChange={(value) => updateParameter("size", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {imageSizes.map((size) => (
              <SelectItem key={size.value} value={size.value}>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span>{size.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {size.aspectRatio}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {size.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Image Style */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          Art Style
          {selectedStyle && (
            <Badge className={`text-xs ${selectedStyle.color}`}>
              {selectedStyle.label}
            </Badge>
          )}
        </Label>
        <Select 
          value={parameters.style} 
          onValueChange={(value) => updateParameter("style", value)}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {imageStyles.map((style) => (
              <SelectItem key={style.value} value={style.value}>
                <div className="flex flex-col">
                  <span>{style.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {style.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}