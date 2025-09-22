"use client";

import type { ApiRegistration } from "@athena/shared";
import { MoreHorizontal, Trash2, Edit3, Eye, EyeOff, Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { useDeleteApiRegistration } from "~/hooks/use-api-registrations";
import { ApiDocumentationDialog } from "./api-documentation-dialog";

interface ApiListProps {
  apis: ApiRegistration[];
  userId: string;
}

interface ApiRegistrationCardProps {
  api: ApiRegistration;
  maskedKeys: Set<string>;
  onToggleKeyVisibility: (id: string) => void;
  onCopyApiKey: (key: string) => void;
  onCopyEndpoint: (url: string) => void;
  onViewDocumentation: () => void;
  onDelete: () => void;
  deleteLoading: boolean;
}

function ApiRegistrationCard({
  api,
  maskedKeys,
  onToggleKeyVisibility,
  onCopyApiKey,
  onCopyEndpoint,
  onViewDocumentation,
  onDelete,
  deleteLoading
}: ApiRegistrationCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const maskApiKey = (key?: string) => {
    if (!key) return "Not set";
    return "••••••••" + key.slice(-4);
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-medium text-sm">{api.name}</h3>
              {api.description && (
                <p className="text-xs text-muted-foreground mt-1">{api.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={api.isActive ? "default" : "secondary"}>
                {api.isActive ? "Active" : "Inactive"}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onViewDocumentation}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Documentation
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={onDelete}
                    className="text-destructive"
                    disabled={deleteLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Primary Info - Endpoint */}
          <div className="flex items-center justify-between bg-muted/30 rounded p-2">
            <code className="text-xs font-mono truncate flex-1 mr-2">
              {api.baseUrl}/chat
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyEndpoint(`${api.baseUrl}/chat`)}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>

          {/* Toggle Details Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full justify-center gap-2"
          >
            {showDetails ? "Hide Details" : "Show Details"}
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {/* Detailed Information - Progressive Disclosure */}
          {showDetails && (
            <div className="space-y-3 pt-2 border-t">
              {/* Configuration Details */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Configuration ID:</span>
                  <Badge variant="secondary" className="text-xs">
                    {api.configurationId}
                  </Badge>
                </div>
                {api.systemPromptId && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">System Prompt ID:</span>
                    <Badge variant="outline" className="text-xs">
                      {api.systemPromptId}
                    </Badge>
                  </div>
                )}
              </div>

              {/* API Key Management */}
              <div className="space-y-2">
                <span className="text-xs font-medium text-muted-foreground">API Key:</span>
                <div className="flex items-center gap-2 bg-muted/50 rounded p-2">
                  <span className="text-xs font-mono flex-1">
                    {maskedKeys.has(api.id) ? maskApiKey(api.apiKey) : api.apiKey || "Not set"}
                  </span>
                  {api.apiKey && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onToggleKeyVisibility(api.id)}
                        className="h-6 w-6 p-0"
                      >
                        {maskedKeys.has(api.id) ? (
                          <Eye className="h-3 w-3" />
                        ) : (
                          <EyeOff className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCopyApiKey(api.apiKey)}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {new Date(api.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Updated:</span>
                  <span className="font-medium">
                    {new Date(api.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ApiList({ apis, userId }: ApiListProps) {
  const [maskedKeys, setMaskedKeys] = useState<Set<string>>(new Set(apis.map(api => api.id)));
  const [selectedApi, setSelectedApi] = useState<ApiRegistration | null>(null);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const deleteApiRegistration = useDeleteApiRegistration();

  const toggleKeyVisibility = (apiId: string) => {
    setMaskedKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(apiId)) {
        newSet.delete(apiId);
      } else {
        newSet.add(apiId);
      }
      return newSet;
    });
  };

  const handleDelete = async (apiId: string, apiName: string) => {
    if (!confirm(`Are you sure you want to delete "${apiName}"?`)) {
      return;
    }

    try {
      await deleteApiRegistration.mutateAsync({ userId, registrationId: apiId });
      toast.success("API registration deleted", {
        description: `${apiName} has been removed from your registered APIs.`,
      });
    } catch (error) {
      toast.error("Failed to delete API registration", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (error) {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const handleViewDocumentation = (api: ApiRegistration) => {
    setSelectedApi(api);
    setDocDialogOpen(true);
  };

  if (apis.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No API registrations found.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Register your first API to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {apis.map((api) => (
          <ApiRegistrationCard
            key={api.id}
            api={api}
            maskedKeys={maskedKeys}
            onToggleKeyVisibility={toggleKeyVisibility}
            onCopyApiKey={(key) => copyToClipboard(key, "API Key")}
            onCopyEndpoint={(url) => copyToClipboard(url, "Endpoint URL")}
            onViewDocumentation={() => handleViewDocumentation(api)}
            onDelete={() => handleDelete(api.id, api.name)}
            deleteLoading={deleteApiRegistration.isPending}
          />
        ))}
      </div>

      <ApiDocumentationDialog
        api={selectedApi}
        open={docDialogOpen}
        onOpenChange={setDocDialogOpen}
      />
    </div>
  );
}