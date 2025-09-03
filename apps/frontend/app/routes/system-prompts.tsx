import { useState } from "react";
import { AppHeader } from "@/components/navigation/app-header";
import { SystemPromptList } from "~/features/system-prompts/system-prompt-list";
import { SystemPromptForm } from "~/features/system-prompts/system-prompt-form";
import { AddNewSystemPrompt } from "~/features/system-prompts/add-new-system-prompt";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/components/ui/alert-dialog";
import { toast } from "sonner";
import { 
  useSystemPrompts, 
  useCreateSystemPrompt, 
  useUpdateSystemPrompt, 
  useDeleteSystemPrompt 
} from "~/hooks/use-system-prompts";
import type { SystemPrompt, CreateSystemPromptRequest } from "@athena/shared";
import type { Route } from "./+types/system-prompts";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "System Prompts - Athena AI" },
    {
      name: "description",
      content: "Manage system prompts for structured outputs and specific topics",
    },
  ];
}

type ViewType = "list" | "form" | "empty";

export default function SystemPrompts() {
  // API hooks
  const { data: systemPrompts, isLoading: isLoadingPrompts, error } = useSystemPrompts();
  const createMutation = useCreateSystemPrompt();
  const updateMutation = useUpdateSystemPrompt();
  const deleteMutation = useDeleteSystemPrompt();

  // Local state
  const [currentView, setCurrentView] = useState<ViewType>("list");
  const [editingPrompt, setEditingPrompt] = useState<SystemPrompt | null>(null);
  const [deletePromptId, setDeletePromptId] = useState<string | null>(null);

  // Determine view based on data
  const effectiveView = systemPrompts?.length === 0 && currentView === "list" ? "empty" : currentView;
  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleCreatePrompt = () => {
    setEditingPrompt(null);
    setCurrentView("form");
  };

  const handleEditPrompt = (prompt: SystemPrompt) => {
    setEditingPrompt(prompt);
    setCurrentView("form");
  };

  const handleSavePrompt = async (promptData: CreateSystemPromptRequest) => {
    try {
      if (editingPrompt) {
        // Update existing prompt
        await updateMutation.mutateAsync({
          promptId: editingPrompt.id,
          data: promptData
        });
        toast.success("System prompt updated successfully");
      } else {
        // Create new prompt
        await createMutation.mutateAsync(promptData);
        toast.success("System prompt created successfully");
      }
      
      setCurrentView("list");
      setEditingPrompt(null);
    } catch (error) {
      toast.error("Failed to save system prompt");
    }
  };

  const handleDeletePrompt = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("System prompt deleted successfully");
    } catch (error) {
      toast.error("Failed to delete system prompt");
    } finally {
      setDeletePromptId(null);
    }
  };

  const handleDuplicatePrompt = async (prompt: SystemPrompt) => {
    try {
      const duplicatedPromptData: CreateSystemPromptRequest = {
        title: `${prompt.title} (Copy)`,
        description: prompt.description,
        category: prompt.category,
        content: prompt.content,
        jsonSchema: prompt.jsonSchema,
        jsonDescription: prompt.jsonDescription,
      };
      
      await createMutation.mutateAsync(duplicatedPromptData);
      toast.success("System prompt duplicated successfully");
    } catch (error) {
      toast.error("Failed to duplicate system prompt");
    }
  };

  const handleCancel = () => {
    setEditingPrompt(null);
    setCurrentView(systemPrompts?.length === 0 ? "empty" : "list");
  };

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: "Athena AI", href: "/" },
          { label: "Configuration", href: "#" },
          { label: "System Prompts", isCurrentPage: true },
        ]}
      />
      
      <div className="flex-1 space-y-4 p-4 md:p-6">
        {isLoadingPrompts && (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Loading system prompts...</div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-12">
            <div className="text-destructive">Failed to load system prompts</div>
          </div>
        )}

        {!isLoadingPrompts && !error && effectiveView === "empty" && (
          <AddNewSystemPrompt onCreate={handleCreatePrompt} />
        )}
        
        {!isLoadingPrompts && !error && effectiveView === "list" && systemPrompts && (
          <SystemPromptList
            prompts={systemPrompts}
            onEdit={handleEditPrompt}
            onDelete={(id) => setDeletePromptId(id)}
            onDuplicate={handleDuplicatePrompt}
            onCreate={handleCreatePrompt}
          />
        )}
        
        {effectiveView === "form" && (
          <SystemPromptForm
            prompt={editingPrompt || undefined}
            onSave={handleSavePrompt}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        )}
      </div>

      <AlertDialog open={!!deletePromptId} onOpenChange={() => setDeletePromptId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete System Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this system prompt? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletePromptId && handleDeletePrompt(deletePromptId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}