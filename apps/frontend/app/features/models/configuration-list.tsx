import { Bot, Globe, Server, Edit, Trash2, Play, Pause, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "~/components/ui/alert-dialog";
import { useConfigurations, useDeleteConfiguration, useUpdateConfiguration } from "~/hooks/use-configurations";
import type { AIConfiguration, AIProvider } from "@athena/shared";
import { toast } from "sonner";
import { Link } from "react-router";
import { useState } from "react";

interface ConfigurationListProps {
  onEditConfiguration?: (config: AIConfiguration) => void;
}

const providerIcons = {
  gemini: Bot,
  ollama: Server,
  "http-api": Globe,
};

const providerNames = {
  gemini: "Google Gemini",
  ollama: "Ollama",
  "http-api": "HTTP API",
};

const providerColors = {
  gemini: "border-blue-200 bg-blue-50/50",
  ollama: "border-green-200 bg-green-50/50", 
  "http-api": "border-purple-200 bg-purple-50/50",
};

export function ConfigurationList({ onEditConfiguration }: ConfigurationListProps) {
  const { data: configurations, isLoading, error } = useConfigurations();
  const deleteConfiguration = useDeleteConfiguration();
  const updateConfiguration = useUpdateConfiguration();
  const [configToDelete, setConfigToDelete] = useState<AIConfiguration | null>(null);

  const handleDeleteClick = (config: AIConfiguration) => {
    setConfigToDelete(config);
  };

  const handleConfirmDelete = async () => {
    if (!configToDelete) return;

    try {
      await deleteConfiguration.mutateAsync(configToDelete.id);
      toast.success("Configuration deleted successfully");
      setConfigToDelete(null);
    } catch (error) {
      toast.error("Failed to delete configuration");
      setConfigToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setConfigToDelete(null);
  };

  const handleToggleActive = async (config: AIConfiguration) => {
    try {
      await updateConfiguration.mutateAsync({
        configId: config.id,
        data: { isActive: !config.isActive }
      });
      toast.success(`Configuration ${config.isActive ? 'deactivated' : 'activated'}`);
    } catch (error) {
      toast.error("Failed to update configuration");
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={`loading-skeleton-${Math.random()}-${i}`} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Failed to load configurations</p>
        <p className="text-sm text-red-600">{error.message}</p>
      </div>
    );
  }

  if (!configurations || configurations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-sm">
          {configurations.length} configuration{configurations.length !== 1 ? 's' : ''}
        </Badge>
        <Button asChild size="sm" className="gap-2">
          <Link to="/models/add">
            <Plus className="h-4 w-4" />
            Add Configuration
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {configurations.map((config) => {
          const Icon = providerIcons[config.provider];
          const colorClass = providerColors[config.provider];
          
          return (
            <Card 
              key={config.id} 
              className={`transition-all duration-200 ${colorClass} ${!config.isActive ? 'opacity-60' : ''}`}
            >
              <CardHeader className="pb-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-md bg-background/80">
                      <Icon className="h-4 w-4" />
                    </div>
                    <Badge 
                      variant={config.isActive ? "default" : "secondary"}
                      className="text-xs px-1.5 py-0.5"
                    >
                      {config.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className="text-sm font-medium truncate leading-tight">
                      {config.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground truncate">
                      {providerNames[config.provider]}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0 pb-3">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">
                    <div className="flex justify-between items-center">
                      <span>Created</span>
                      <span>{new Date(config.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(config)}
                        disabled={updateConfiguration.isPending}
                        className="h-6 w-6 p-0"
                        title={config.isActive ? "Deactivate" : "Activate"}
                      >
                        {config.isActive ? (
                          <Pause className="h-3 w-3" />
                        ) : (
                          <Play className="h-3 w-3" />
                        )}
                      </Button>
                      
                      {onEditConfiguration && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEditConfiguration(config)}
                          className="h-6 w-6 p-0"
                          title="Edit"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(config)}
                      disabled={deleteConfiguration.isPending}
                      className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!configToDelete} onOpenChange={() => setConfigToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{configToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteConfiguration.isPending}
            >
              {deleteConfiguration.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}