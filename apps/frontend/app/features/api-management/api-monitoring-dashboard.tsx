"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  ExternalLink,
  Globe,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Zap,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { toast } from "sonner";
import { useApiRegistrations, useDeleteApiRegistration, useUpdateApiRegistration } from "~/hooks/use-api-registrations";
import { useApiMetrics, useMetricsSummary } from "~/hooks/use-api-metrics";
import { ApiDocumentationDialog } from "./api-documentation-dialog";
import { ApiSummaryCards } from "./api-summary-cards";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import { CopyButton } from "~/components/ui/copy-button";
import { useConfigurations } from "~/hooks/use-configurations";
import { useSystemPrompts } from "~/hooks/use-system-prompts";
import { useCurrentUser } from "~/hooks/use-current-user";
import type { ApiRegistration, TimeRange } from "@athena/shared";
import { calculateSuccessRate, calculateErrorRate } from "@athena/shared";

interface ApiStatus {
  id: string;
  name: string;
  endpoint: string;
  apiKey: string;
  status: "online" | "offline" | "warning";
  lastChecked: string;
  responseTime: number;
  uptime: number;
  requestCount: number;
  errorRate: number;
}

interface ApiMetricsDetails {
  successCount: number;
  errorCount4xx: number;
  errorCount5xx: number;
  totalErrorCount: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
}


interface ApiMonitoringCardProps {
  api: ApiStatus;
  metrics: ApiMetricsDetails;
  onViewDocumentation: () => void;
  onEdit: () => void;
  onDelete: () => void;
  deleteLoading: boolean;
}

function ApiKeyDisplay({ apiKey, apiName }: { apiKey: string; apiName: string }) {
  const [isVisible, setIsVisible] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast.success("API key copied to clipboard", {
        duration: 2000,
      });
    } catch (err) {
      toast.error("Failed to copy API key", {
        duration: 3000,
      });
      throw err;
    }
  };

  const displayKey = isVisible ? apiKey : `${apiKey.substring(0, 8)}${"•".repeat(24)}`;

  return (
    <div className="flex items-center gap-2 max-w-xs">
      <code className="text-xs bg-muted px-2 py-1 rounded font-mono truncate">
        {displayKey}
      </code>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsVisible(!isVisible)}
        className="h-6 w-6 p-0"
      >
        {isVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </Button>
      <CopyButton
        onCopy={copyToClipboard}
        label="API key"
      />
    </div>
  );
}

function ApiMonitoringCard({ api, metrics, onViewDocumentation, onEdit, onDelete, deleteLoading }: ApiMonitoringCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const getStatusIcon = (status: ApiStatus["status"]) => {
    switch (status) {
      case "online":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "offline":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: ApiStatus["status"]) => {
    switch (status) {
      case "online":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Online</Badge>;
      case "warning":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case "offline":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Offline</Badge>;
    }
  };

  const formatLastChecked = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const copyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(api.endpoint);
      toast.success("Endpoint copied to clipboard", {
        duration: 2000,
      });
    } catch (err) {
      toast.error("Failed to copy endpoint", {
        duration: 3000,
      });
      throw err;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        {/* Primary Information - Always Visible */}
        <div className="space-y-3">
          {/* Header with Status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(api.status)}
              <div>
                <h3 className="font-medium text-sm">{api.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Last checked: {formatLastChecked(api.lastChecked)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusBadge(api.status)}
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
                  <DropdownMenuItem onClick={onEdit}>
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

          {/* Core Metrics - Always Visible */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-muted/50 rounded p-2">
              <p className="text-sm font-medium">{api.requestCount}</p>
              <p className="text-xs text-muted-foreground">Requests</p>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <p className="text-sm font-medium text-green-600">{metrics.successRate}%</p>
              <p className="text-xs text-muted-foreground">Success</p>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <p className="text-sm font-medium">{api.responseTime}ms</p>
              <p className="text-xs text-muted-foreground">Avg RT</p>
            </div>
          </div>

          {/* Endpoint with Copy Button */}
          <div className="flex items-center justify-between bg-muted/30 rounded p-2">
            <code className="text-xs font-mono truncate flex-1 mr-2">{api.endpoint}</code>
            <CopyButton
              onCopy={copyEndpoint}
              label="endpoint URL"
              className="flex-shrink-0"
            />
          </div>

          {/* Toggle Details Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full justify-center gap-2"
          >
            {showDetails ? "Hide Details" : "View Details"}
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {/* Detailed Information - Progressive Disclosure */}
          {showDetails && (
            <div className="space-y-3 pt-2 border-t">
              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Success:</span>
                  <span className="font-medium text-green-600">{metrics.successCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Failed:</span>
                  <span className="font-medium text-red-600">{metrics.totalErrorCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Min Response:</span>
                  <span className="font-medium">{metrics.minResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Max Response:</span>
                  <span className="font-medium">{metrics.maxResponseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">4xx Errors:</span>
                  <span className="font-medium text-orange-600">{metrics.errorCount4xx}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">5xx Errors:</span>
                  <span className="font-medium text-red-600">{metrics.errorCount5xx}</span>
                </div>
              </div>

              {/* API Key Management */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="w-full justify-center gap-2 text-xs"
                >
                  {showApiKey ? "Hide API Key" : "Show API Key"}
                  {showApiKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>

                {showApiKey && (
                  <div className="bg-muted/50 rounded p-2">
                    <ApiKeyDisplay apiKey={api.apiKey} apiName={api.name} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ApiMonitoringDashboard() {
  const { userId } = useCurrentUser();

  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [selectedApi, setSelectedApi] = useState<ApiRegistration | null>(null);
  const [docDialogOpen, setDocDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEditApi, setSelectedEditApi] = useState<ApiRegistration | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: "",
    description: "",
    configurationId: "",
    systemPromptId: "",
    isActive: true,
  });

  const { data: registrations, isLoading, error } = useApiRegistrations(userId || "");
  const { data: configurations } = useConfigurations(userId || "");
  const { data: systemPrompts } = useSystemPrompts(userId || "");
  const { data: metricsSummary } = useMetricsSummary(userId || "", timeRange);
  const deleteApiRegistration = useDeleteApiRegistration();
  const updateApiRegistration = useUpdateApiRegistration();

  // Convert API registrations to monitoring format with enhanced data from summary
  const apis: ApiStatus[] = registrations?.map((reg) => {
    // Find corresponding metrics from the summary
    const apiMetrics = metricsSummary?.apiMetrics.find(m => m.registrationId === reg.id);
    const errorRate = apiMetrics ? calculateErrorRate(
      apiMetrics.errorCounts["4xx"] + apiMetrics.errorCounts["5xx"],
      apiMetrics.totalRequests
    ) : 0;

    return {
      id: reg.id,
      name: reg.name,
      endpoint: `${reg.baseUrl}/chat`,
      apiKey: reg.apiKey,
      status: reg.isActive ? (errorRate > 50 ? "warning" : "online") : "offline" as const,
      lastChecked: reg.updatedAt,
      responseTime: Number(apiMetrics?.responseTimes.average) || 0,
      uptime: Math.max(0, 100 - errorRate),
      requestCount: Number(apiMetrics?.totalRequests) || 0,
      errorRate: errorRate,
    };
  }) || [];


  const handleViewDocumentation = (apiId: string) => {
    const api = registrations?.find(reg => reg.id === apiId);
    if (api) {
      setSelectedApi(api);
      setDocDialogOpen(true);
    }
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

  const handleEdit = (apiId: string) => {
    const api = registrations?.find(reg => reg.id === apiId);
    if (api) {
      setSelectedEditApi(api);
      setEditFormData({
        name: api.name,
        description: api.description || "",
        configurationId: api.configurationId,
        systemPromptId: api.systemPromptId || "",
        isActive: api.isActive,
      });
      setEditDialogOpen(true);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditApi) return;

    try {
      await updateApiRegistration.mutateAsync({
        userId,
        registrationId: selectedEditApi.id,
        data: {
          name: editFormData.name,
          description: editFormData.description,
          configurationId: editFormData.configurationId,
          systemPromptId: editFormData.systemPromptId || undefined,
          isActive: editFormData.isActive,
        },
      });

      toast.success("API registration updated", {
        description: `${editFormData.name} has been updated successfully.`,
      });
      setEditDialogOpen(false);
    } catch (error) {
      toast.error("Failed to update API registration", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleEditInputChange = (field: string, value: string | boolean) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Calculate summary stats from real metrics data
  const totalApis = apis.length;
  const onlineApis = apis.filter(api => api.status === "online").length;
  const avgResponseTime = Number(metricsSummary?.summary.responseTimes.average) || 0;
  const totalRequests = Number(metricsSummary?.summary.totalRequests) || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">Failed to load API monitoring data</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error ? error.message : "Unknown error occurred"}
            </p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <ApiSummaryCards
        data={{
          totalApis,
          onlineApis,
          avgResponseTime,
          totalRequests,
          trends: {
            apis: "stable",
            responseTime: avgResponseTime < 1000 ? "down" : "stable",
            requests: totalRequests > 0 ? "up" : "stable"
          }
        }}
        isLoading={isLoading}
      />

      {/* API Status Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>API Status</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">24h</SelectItem>
                <SelectItem value="7d">7d</SelectItem>
                <SelectItem value="30d">30d</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading API monitoring data...</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {apis.map((api) => {
                // Get detailed metrics for this specific API
                const apiMetrics = metricsSummary?.apiMetrics.find(m => m.registrationId === api.id);
                const successCount = Number(apiMetrics?.successCount) || 0;
                const errorCount4xx = Number(apiMetrics?.errorCounts["4xx"]) || 0;
                const errorCount5xx = Number(apiMetrics?.errorCounts["5xx"]) || 0;
                const totalErrorCount = errorCount4xx + errorCount5xx;
                const minResponseTime = Number(apiMetrics?.responseTimes.min) || 0;
                const maxResponseTime = Number(apiMetrics?.responseTimes.max) || 0;
                const successRate = api.requestCount > 0 ? Math.round((successCount / api.requestCount) * 100) : 0;

                return (
                  <ApiMonitoringCard
                    key={api.id}
                    api={api}
                    metrics={{
                      successCount,
                      errorCount4xx,
                      errorCount5xx,
                      totalErrorCount,
                      minResponseTime,
                      maxResponseTime,
                      successRate,
                    }}
                    onViewDocumentation={() => handleViewDocumentation(api.id)}
                    onEdit={() => handleEdit(api.id)}
                    onDelete={() => handleDelete(api.id, api.name)}
                    deleteLoading={deleteApiRegistration.isPending}
                  />
                );
              })}

              {apis.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No APIs Registered</h3>
                  <p className="text-muted-foreground">
                    Register your first API to start monitoring its performance.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ApiDocumentationDialog
        api={selectedApi}
        open={docDialogOpen}
        onOpenChange={setDocDialogOpen}
      />

      {/* Edit API Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit API Registration</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => handleEditInputChange("name", e.target.value)}
                placeholder="Enter API name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => handleEditInputChange("description", e.target.value)}
                placeholder="Enter API description (optional)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-configuration">AI Configuration</Label>
              <Select
                value={editFormData.configurationId}
                onValueChange={(value) => handleEditInputChange("configurationId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a configuration" />
                </SelectTrigger>
                <SelectContent>
                  {configurations?.map((config) => (
                    <SelectItem key={config.id} value={config.id}>
                      {config.name} ({config.provider})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-system-prompt">System Prompt (Optional)</Label>
              <Select
                value={editFormData.systemPromptId}
                onValueChange={(value) => handleEditInputChange("systemPromptId", value === "none" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a system prompt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No system prompt</SelectItem>
                  {systemPrompts?.map((prompt) => (
                    <SelectItem key={prompt.id} value={prompt.id}>
                      {prompt.title} ({prompt.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-is-active"
                checked={editFormData.isActive}
                onChange={(e) => handleEditInputChange("isActive", e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-is-active">Active</Label>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateApiRegistration.isPending}
              >
                {updateApiRegistration.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}