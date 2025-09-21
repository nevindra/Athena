"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Eye,
  EyeOff,
  Globe,
  RefreshCw,
  Zap,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";

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

// Mock data - replace with actual API calls
const mockApiData: ApiStatus[] = [
  {
    id: "1",
    name: "OpenAI Chat API",
    endpoint: "https://athena-api.your-domain.com/api/v1/chat/1",
    apiKey: "ak_1234567890abcdef1234567890abcdef",
    status: "online",
    lastChecked: new Date().toISOString(),
    responseTime: 245,
    uptime: 99.9,
    requestCount: 1250,
    errorRate: 0.1,
  },
  {
    id: "2",
    name: "Custom ML Model",
    endpoint: "https://athena-api.your-domain.com/api/v1/chat/2",
    apiKey: "ak_abcdef1234567890abcdef1234567890",
    status: "warning",
    lastChecked: new Date(Date.now() - 300000).toISOString(),
    responseTime: 1200,
    uptime: 97.5,
    requestCount: 850,
    errorRate: 2.3,
  },
  {
    id: "3",
    name: "Data Processing API",
    endpoint: "https://athena-api.your-domain.com/api/v1/chat/3",
    apiKey: "ak_fedcba0987654321fedcba0987654321",
    status: "offline",
    lastChecked: new Date(Date.now() - 900000).toISOString(),
    responseTime: 0,
    uptime: 85.2,
    requestCount: 320,
    errorRate: 15.8,
  },
];

function ApiKeyDisplay({ apiKey, apiName }: { apiKey: string; apiName: string }) {
  const [isVisible, setIsVisible] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      toast.success("API key copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy API key");
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
      <Button
        variant="ghost"
        size="sm"
        onClick={copyToClipboard}
        className="h-6 w-6 p-0"
      >
        <Copy className="h-3 w-3" />
      </Button>
    </div>
  );
}

export function ApiMonitoringDashboard() {
  const [apis, setApis] = useState<ApiStatus[]>(mockApiData);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Update mock data with new timestamps
    setApis(current =>
      current.map(api => ({
        ...api,
        lastChecked: new Date().toISOString(),
        responseTime: api.status === "online" ? Math.random() * 500 + 100 : 0,
      }))
    );
    setIsRefreshing(false);
  };

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

  // Calculate summary stats
  const totalApis = apis.length;
  const onlineApis = apis.filter(api => api.status === "online").length;
  const avgResponseTime = apis
    .filter(api => api.status === "online")
    .reduce((sum, api) => sum + api.responseTime, 0) / onlineApis || 0;
  const totalRequests = apis.reduce((sum, api) => sum + api.requestCount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total APIs</p>
                <p className="text-2xl font-bold">{totalApis}</p>
              </div>
              <Globe className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Online</p>
                <p className="text-2xl font-bold text-green-600">{onlineApis}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">{Math.round(avgResponseTime)}ms</p>
              </div>
              <Zap className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{totalRequests.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Status Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>API Status</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apis.map((api) => (
              <div
                key={api.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {getStatusIcon(api.status)}
                  <div className="space-y-1">
                    <h3 className="font-medium">{api.name}</h3>
                    <p className="text-sm text-muted-foreground">{api.endpoint}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">API Key:</span>
                      <ApiKeyDisplay apiKey={api.apiKey} apiName={api.name} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <p className="font-medium">{api.responseTime}ms</p>
                    <p className="text-muted-foreground">Response</p>
                  </div>

                  <div className="text-center">
                    <p className="font-medium">{api.uptime}%</p>
                    <p className="text-muted-foreground">Uptime</p>
                  </div>

                  <div className="text-center">
                    <p className="font-medium">{api.requestCount}</p>
                    <p className="text-muted-foreground">Requests</p>
                  </div>

                  <div className="text-center">
                    <p className="font-medium">{api.errorRate}%</p>
                    <p className="text-muted-foreground">Error Rate</p>
                  </div>

                  <div className="text-center">
                    <p className="font-medium">{formatLastChecked(api.lastChecked)}</p>
                    <p className="text-muted-foreground">Last Check</p>
                  </div>

                  {getStatusBadge(api.status)}
                </div>
              </div>
            ))}
          </div>

          {apis.length === 0 && (
            <div className="text-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No APIs Registered</h3>
              <p className="text-muted-foreground">
                Register your first API to start monitoring its performance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}