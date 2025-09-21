"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { useConfigurations } from "~/hooks/use-configurations";
import { Plus, Save } from "lucide-react";
import { toast } from "sonner";

interface ApiRegistrationData {
  name: string;
  description: string;
  selectedModel: string;
  useStructuredOutput: boolean;
}

interface ApiRegistrationDialogProps {
  children?: React.ReactNode;
}

export function ApiRegistrationDialog({ children }: ApiRegistrationDialogProps) {
  const { data: configurations } = useConfigurations();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ApiRegistrationData>({
    name: "",
    description: "",
    selectedModel: "",
    useStructuredOutput: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof ApiRegistrationData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
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

      // Reset form and close dialog
      setFormData({
        name: "",
        description: "",
        selectedModel: "",
        useStructuredOutput: false,
      });
      setOpen(false);
    } catch (error) {
      toast.error("Registration failed", {
        description: "Failed to register the API. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = formData.name && formData.selectedModel;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Register API</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New API</DialogTitle>
        </DialogHeader>

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

          <div className="flex justify-end">
            <Button type="submit" disabled={!isFormValid || isLoading}>
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? "Registering..." : "Register API"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}