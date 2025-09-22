import type { AIConfiguration } from "@athena/shared";
import {
  Bot,
  Edit,
  Globe,
  Pause,
  Play,
  Plus,
  Server,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  useConfigurations,
  useDeleteConfiguration,
  useUpdateConfiguration,
} from "~/hooks/use-configurations";
import { useCurrentUser } from "~/hooks/use-current-user";

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
  gemini: "border-border",
  ollama: "border-border",
  "http-api": "border-border",
};

export function ConfigurationList({
  onEditConfiguration,
}: ConfigurationListProps) {
  const { userId } = useCurrentUser();
  const { data: configurations, isLoading, error } = useConfigurations(userId || "");
  const deleteConfiguration = useDeleteConfiguration(userId || "");
  const updateConfiguration = useUpdateConfiguration(userId || "");
  const [configToDelete, setConfigToDelete] = useState<AIConfiguration | null>(
    null
  );

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
      console.error("Failed to delete configuration:", error);
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
        data: { isActive: !config.isActive },
      });
      toast.success(
        `Configuration ${config.isActive ? "deactivated" : "activated"}`
      );
    } catch (error) {
      console.error("Failed to update configuration:", error);
      toast.error("Failed to update configuration");
    }
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card
            key={`loading-skeleton-${Math.random()}-${i}`}
            className="animate-pulse"
          >
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
          {configurations.length} configuration
          {configurations.length !== 1 ? "s" : ""}
        </Badge>
        <Button asChild size="sm" className="gap-2">
          <Link to="/models/add">
            <Plus className="h-4 w-4" />
            Add Configuration
          </Link>
        </Button>
      </div>

      <div className={`gap-4 ${
        configurations.length <= 2
          ? "flex flex-col space-y-4"
          : "grid md:grid-cols-2 lg:grid-cols-3"
      }`}>
        {configurations.map((config) => {
          const Icon = providerIcons[config.provider];
          const colorClass = providerColors[config.provider];
          const isListLayout = configurations.length <= 2;

          return (
            <Card
              key={config.id}
              className={`transition-all duration-200 ${colorClass} ${!config.isActive ? "opacity-60" : ""} ${
                isListLayout ? "max-w-2xl" : ""
              }`}
            >
              <CardHeader className={isListLayout ? "pb-4" : "pb-2"}>
                <div className={`space-y-${isListLayout ? "3" : "2"}`}>
                  <div className="flex items-center justify-between">
                    <div className={`p-${isListLayout ? "2" : "1.5"} rounded-md bg-background/80`}>
                      <Icon className={`h-${isListLayout ? "5" : "4"} w-${isListLayout ? "5" : "4"}`} />
                    </div>
                    <Badge
                      variant={config.isActive ? "default" : "secondary"}
                      className={`text-${isListLayout ? "sm" : "xs"} px-${isListLayout ? "2" : "1.5"} py-${isListLayout ? "1" : "0.5"}`}
                    >
                      {config.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div>
                    <CardTitle className={`${isListLayout ? "text-lg" : "text-sm"} font-medium truncate leading-tight`}>
                      {config.name}
                    </CardTitle>
                    <p className={`${isListLayout ? "text-sm" : "text-xs"} text-muted-foreground truncate`}>
                      {providerNames[config.provider]}
                    </p>
                    {isListLayout && config.config && (
                      <div className="mt-2 space-y-1">
                        {config.config.model && (
                          <p className="text-xs text-muted-foreground">
                            Model: <span className="font-medium">{config.config.model}</span>
                          </p>
                        )}
                        {config.config.baseUrl && (
                          <p className="text-xs text-muted-foreground truncate">
                            Endpoint: <span className="font-medium">{config.config.baseUrl}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className={`pt-0 ${isListLayout ? "pb-4" : "pb-3"}`}>
                <div className="space-y-3">
                  <div className={`${isListLayout ? "grid grid-cols-2 gap-4" : ""}`}>
                    <div className={`text-${isListLayout ? "sm" : "xs"} text-muted-foreground`}>
                      <div className="flex justify-between items-center">
                        <span>Created</span>
                        <span>
                          {new Date(config.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              ...(isListLayout ? { year: "numeric" } : {})
                            }
                          )}
                        </span>
                      </div>
                    </div>
                    {isListLayout && (
                      <div className="text-sm text-muted-foreground">
                        <div className="flex justify-between items-center">
                          <span>Provider</span>
                          <span className="font-medium">{providerNames[config.provider]}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Button
                        size={isListLayout ? "default" : "sm"}
                        variant="outline"
                        onClick={() => handleToggleActive(config)}
                        disabled={updateConfiguration.isPending}
                        className={isListLayout ? "h-8 px-3 text-sm" : "h-6 w-6 p-0"}
                        title={config.isActive ? "Deactivate" : "Activate"}
                      >
                        {config.isActive ? (
                          <>
                            <Pause className={`h-${isListLayout ? "4" : "3"} w-${isListLayout ? "4" : "3"}`} />
                            {isListLayout && <span className="ml-1">Deactivate</span>}
                          </>
                        ) : (
                          <>
                            <Play className={`h-${isListLayout ? "4" : "3"} w-${isListLayout ? "4" : "3"}`} />
                            {isListLayout && <span className="ml-1">Activate</span>}
                          </>
                        )}
                      </Button>

                      {onEditConfiguration && (
                        <Button
                          size={isListLayout ? "default" : "sm"}
                          variant="outline"
                          onClick={() => onEditConfiguration(config)}
                          className={isListLayout ? "h-8 px-3 text-sm" : "h-6 w-6 p-0"}
                          title="Edit"
                        >
                          <Edit className={`h-${isListLayout ? "4" : "3"} w-${isListLayout ? "4" : "3"}`} />
                          {isListLayout && <span className="ml-1">Edit</span>}
                        </Button>
                      )}
                    </div>

                    <Button
                      size={isListLayout ? "default" : "sm"}
                      variant="outline"
                      onClick={() => handleDeleteClick(config)}
                      disabled={deleteConfiguration.isPending}
                      className={`${
                        isListLayout ? "h-8 px-3 text-sm" : "h-6 w-6 p-0"
                      } text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800`}
                      title="Delete"
                    >
                      <Trash2 className={`h-${isListLayout ? "4" : "3"} w-${isListLayout ? "4" : "3"}`} />
                      {isListLayout && <span className="ml-1">Delete</span>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog
        open={!!configToDelete}
        onOpenChange={() => setConfigToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Configuration</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{configToDelete?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Cancel
            </AlertDialogCancel>
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
