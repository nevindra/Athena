"use client";

import type { SystemPrompt } from "@athena/shared";
import { Plus, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { useCreateApiRegistration } from "~/hooks/use-api-registrations";
import { useConfigurations } from "~/hooks/use-configurations";
import { useSystemPrompts } from "~/hooks/use-system-prompts";
import { useCurrentUser } from "~/hooks/use-current-user";

interface ApiRegistrationData {
  name: string;
  description: string;
  selectedConfiguration: string;
  selectedSystemPrompt: string;
}

interface ApiRegistrationDialogProps {
  children?: React.ReactNode;
}

export function ApiRegistrationDialog({ children }: ApiRegistrationDialogProps) {
  const { userId } = useCurrentUser();
  const { data: configurations } = useConfigurations(userId || "");
  const { data: systemPrompts } = useSystemPrompts(userId || "");
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<ApiRegistrationData>({
    name: "",
    description: "",
    selectedConfiguration: "",
    selectedSystemPrompt: "",
  });

  const createApiRegistration = useCreateApiRegistration();

  const handleInputChange = (field: keyof ApiRegistrationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!userId) {
        toast.error("Authentication required", {
          description: "Please log in to register an API.",
        });
        return;
      }

      await createApiRegistration.mutateAsync({
        userId,
        data: {
          name: formData.name,
          description: formData.description || undefined,
          configurationId: formData.selectedConfiguration,
          systemPromptId: formData.selectedSystemPrompt === "none" ? undefined : formData.selectedSystemPrompt,
          isActive: true,
        },
      });

      toast.success("API registered successfully", {
        description: `${formData.name} has been added to your API management dashboard.`,
      });

      // Reset form and close dialog
      setFormData({
        name: "",
        description: "",
        selectedConfiguration: "",
        selectedSystemPrompt: "",
      });
      setOpen(false);
    } catch (error) {
      toast.error("Registration failed", {
        description: error instanceof Error ? error.message : "Failed to register the API. Please try again.",
      });
    }
  };

  const isFormValid = formData.name && formData.selectedConfiguration;
  const isLoading = createApiRegistration.isPending;

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
          <DialogTitle className="font-bold tracking-tight text-foreground">Register New API</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="api-name" className="text-foreground">API Name *</Label>
              <Input
                id="api-name"
                placeholder="Enter a descriptive name for your API"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-description" className="text-foreground">Description</Label>
              <Textarea
                id="api-description"
                placeholder="Describe what this API is used for"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="configuration-select" className="text-foreground">AI Configuration *</Label>
              <Select
                value={formData.selectedConfiguration}
                onValueChange={(value) => handleInputChange("selectedConfiguration", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an AI configuration" />
                </SelectTrigger>
                <SelectContent>
                  {configurations?.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name} ({config.provider})
                    </SelectItem>
                  ))}
                  {(!configurations || configurations.length === 0) && (
                    <SelectItem value="none" disabled>
                      No configurations available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>


            <div className="space-y-2">
              <Label htmlFor="system-prompt-select" className="text-foreground">System Prompt (Optional)</Label>
              <Select
                value={formData.selectedSystemPrompt}
                onValueChange={(value) => handleInputChange("selectedSystemPrompt", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a system prompt for structured output" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    No system prompt
                  </SelectItem>
                  {systemPrompts?.map((prompt) => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                      {prompt.title} ({prompt.category})
                    </SelectItem>
                  ))}
                  {(!systemPrompts || systemPrompts.length === 0) && (
                    <SelectItem value="no-prompts" disabled>
                      No system prompts available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
