import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card } from "~/components/ui/card";
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

interface ModelParamsProps {
  temperature: number | string;
  maxTokens: number | string;
  topP: number | string;
  presencePenalty: number | string;
  frequencyPenalty: number | string;
  streamResponse: boolean;
  onTemperatureChange: (value: string) => void;
  onTemperatureBlur: (value: string) => void;
  onMaxTokensChange: (value: string) => void;
  onMaxTokensBlur: (value: string) => void;
  onTopPChange: (value: string) => void;
  onTopPBlur: (value: string) => void;
  onPresencePenaltyChange: (value: string) => void;
  onPresencePenaltyBlur: (value: string) => void;
  onFrequencyPenaltyChange: (value: string) => void;
  onFrequencyPenaltyBlur: (value: string) => void;
  onStreamResponseChange: (value: boolean) => void;
}

export function ModelParams({
  temperature,
  maxTokens,
  topP,
  presencePenalty,
  frequencyPenalty,
  streamResponse,
  onTemperatureChange,
  onTemperatureBlur,
  onMaxTokensChange,
  onMaxTokensBlur,
  onTopPChange,
  onTopPBlur,
  onPresencePenaltyChange,
  onPresencePenaltyBlur,
  onFrequencyPenaltyChange,
  onFrequencyPenaltyBlur,
  onStreamResponseChange,
}: ModelParamsProps) {
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
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="temperature" className="font-medium">
                    Temperature
                  </Label>
                  <Badge>Creativity</Badge>
                </div>
                <Input
                  id="temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => onTemperatureChange(e.target.value)}
                  onBlur={(e) => onTemperatureBlur(e.target.value)}
                  className="font-mono text-center"
                />
                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded text-center">
                  Higher values = more creative, lower = more focused
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="maxTokens" className="font-medium">
                    Max Tokens
                  </Label>
                  <Badge>Length</Badge>
                </div>
                <Input
                  id="maxTokens"
                  type="number"
                  min="1"
                  max="8192"
                  value={maxTokens}
                  onChange={(e) => onMaxTokensChange(e.target.value)}
                  onBlur={(e) => onMaxTokensBlur(e.target.value)}
                  className="font-mono text-center"
                />
                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded text-center">
                  Maximum response length in tokens
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="topP" className="font-medium">
                    Top-p
                  </Label>
                  <Badge>Focus</Badge>
                </div>
                <Input
                  id="topP"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={topP}
                  onChange={(e) => onTopPChange(e.target.value)}
                  onBlur={(e) => onTopPBlur(e.target.value)}
                  className="font-mono text-center"
                />
                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded text-center">
                  Nucleus sampling - controls word choice diversity
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="presencePenalty" className="font-medium">
                    Presence Penalty
                  </Label>
                  <Badge>Topics</Badge>
                </div>
                <Input
                  id="presencePenalty"
                  type="number"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={presencePenalty}
                  onChange={(e) => onPresencePenaltyChange(e.target.value)}
                  onBlur={(e) => onPresencePenaltyBlur(e.target.value)}
                  className="font-mono text-center"
                />
                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded text-center">
                  Penalize topics that appear in the text
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="frequencyPenalty" className="font-medium">
                    Frequency Penalty
                  </Label>
                  <Badge>Repetition</Badge>
                </div>
                <Input
                  id="frequencyPenalty"
                  type="number"
                  min="-2"
                  max="2"
                  step="0.1"
                  value={frequencyPenalty}
                  onChange={(e) => onFrequencyPenaltyChange(e.target.value)}
                  onBlur={(e) => onFrequencyPenaltyBlur(e.target.value)}
                  className="font-mono text-center"
                />
                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded text-center">
                  Penalize words that repeat frequently
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="streamResponse" className="font-medium">
                    Stream Response
                  </Label>
                  <Badge>Real-time</Badge>
                </div>
                <Select
                  value={streamResponse ? "enabled" : "disabled"}
                  onValueChange={(value) => onStreamResponseChange(value === "enabled")}
                >
                  <SelectTrigger className="font-mono w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enabled">Enabled</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded text-center">
                  Enable real-time streaming for immediate response feedback
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}