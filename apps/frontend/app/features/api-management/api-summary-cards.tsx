"use client";

import {
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Clock,
  Globe,
  Minus,
  TrendingUp,
  Zap
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";

interface SummaryData {
  totalApis: number;
  onlineApis: number;
  avgResponseTime: number;
  totalRequests: number;
  healthScore?: number;
  trends?: {
    apis: "up" | "down" | "stable";
    responseTime: "up" | "down" | "stable";
    requests: "up" | "down" | "stable";
  };
}

interface ApiSummaryCardsProps {
  data: SummaryData;
  isLoading?: boolean;
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "stable";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "danger";
  isLoading?: boolean;
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = "default",
  isLoading = false
}: SummaryCardProps) {
  const getTrendIcon = (trend?: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-3 w-3 text-green-500" />;
      case "down":
        return <ArrowDown className="h-3 w-3 text-red-500" />;
      case "stable":
        return <Minus className="h-3 w-3 text-gray-500" />;
      default:
        return null;
    }
  };

  const getIconClasses = (variant: string) => {
    switch (variant) {
      case "success":
        return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30";
      case "warning":
        return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30";
      case "danger":
        return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getStatusBadge = (variant: string) => {
    switch (variant) {
      case "success":
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">Good</Badge>;
      case "warning":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800">Warning</Badge>;
      case "danger":
        return <Badge variant="destructive">Alert</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="relative overflow-hidden">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-muted rounded w-1/3"></div>
              <div className="h-8 w-8 bg-muted rounded-full"></div>
            </div>
            <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden transition-all duration-200 hover:shadow-md border-border bg-card hover:bg-muted/30">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className={`p-2 rounded-full ${getIconClasses(variant)}`}>
            {icon}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight">{value}</h3>
            {trend && trendValue && (
              <div className="flex items-center gap-1">
                {getTrendIcon(trend)}
                <span className="text-xs font-medium text-muted-foreground">
                  {trendValue}
                </span>
              </div>
            )}
            {getStatusBadge(variant)}
          </div>

          {subtitle && (
            <p className="text-xs text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/10 pointer-events-none" />
      </CardContent>
    </Card>
  );
}

export function ApiSummaryCards({ data, isLoading = false }: ApiSummaryCardsProps) {
  // Calculate health score based on online APIs and performance
  const healthScore = data.healthScore || (data.totalApis > 0 ? Math.round((data.onlineApis / data.totalApis) * 100) : 100);

  // Determine if there are any issues
  const hasWarnings = data.onlineApis < data.totalApis;
  const hasSlowResponse = data.avgResponseTime > 2000; // Consider >2s as slow

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total APIs */}
      <SummaryCard
        title="Total APIs"
        value={data.totalApis}
        subtitle="Registered endpoints"
        icon={<Globe className="h-4 w-4" />}
        trend={data.trends?.apis}
        trendValue={data.trends?.apis === "up" ? "+2 this week" : undefined}
        isLoading={isLoading}
      />

      {/* Online APIs */}
      <SummaryCard
        title="Online APIs"
        value={data.onlineApis}
        subtitle={`${data.totalApis - data.onlineApis} offline`}
        icon={<CheckCircle className="h-4 w-4" />}
        variant={hasWarnings ? "warning" : "success"}
        isLoading={isLoading}
      />

      {/* Average Response Time */}
      <SummaryCard
        title="Avg Response"
        value={`${Math.round(data.avgResponseTime)}ms`}
        subtitle="Last 24 hours"
        icon={<Zap className="h-4 w-4" />}
        trend={data.trends?.responseTime}
        trendValue={data.trends?.responseTime === "down" ? "-50ms" : undefined}
        variant={hasSlowResponse ? "warning" : "default"}
        isLoading={isLoading}
      />

      {/* Total Requests */}
      <SummaryCard
        title="Total Requests"
        value={data.totalRequests.toLocaleString()}
        subtitle="Last 24 hours"
        icon={<TrendingUp className="h-4 w-4" />}
        trend={data.trends?.requests}
        trendValue={data.trends?.requests === "up" ? "+15.2%" : undefined}
        isLoading={isLoading}
      />
    </div>
  );
}
