"use client";

import type { ApiRegistration } from "@athena/shared";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  Eye,
  Filter,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DateRangePicker } from "~/components/ui/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  useAllRecentApiCalls,
  useRecentApiCalls,
} from "~/hooks/use-api-metrics";
import { useApiRegistrations } from "~/hooks/use-api-registrations";

interface ApiCall {
  id: string;
  apiName: string;
  endpoint: string;
  method: string;
  status: "success" | "error" | "timeout";
  statusCode: number;
  responseTime: number;
  timestamp: string;
  requestSize: number;
  responseSize: number;
  userAgent: string;
  ipAddress?: string;
  errorMessage?: string;
}

export function ApiHistoryTable() {
  // TODO: Get actual user ID from auth context
  const userId = "01HZXM0K1QRST9VWXYZ01234AB"; // Using existing user ID

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCall, setSelectedCall] = useState<ApiCall | null>(null);
  const [selectedApiId, setSelectedApiId] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState<
    { from: Date; to: Date } | undefined
  >();

  const {
    data: registrations,
    isLoading: registrationsLoading,
    error: registrationsError,
  } = useApiRegistrations(userId);

  // Get all registration IDs for "all" filter
  const allRegistrationIds = registrations?.map((r) => r.id) || [];

  // Use different hooks based on selection
  const {
    data: singleApiCalls,
    isLoading: singleLoading,
    error: singleError,
    refetch: refetchSingle,
  } = useRecentApiCalls(
    selectedApiId !== "all" ? selectedApiId : "",
    200 // Increased limit for better filtering
  );

  const {
    data: allApiCalls,
    isLoading: allLoading,
    error: allError,
    refetch: refetchAll,
  } = useAllRecentApiCalls(
    selectedApiId === "all" ? allRegistrationIds : [],
    200 // Increased limit for better filtering
  );

  // Choose the appropriate data source
  const recentCalls = selectedApiId === "all" ? allApiCalls : singleApiCalls;
  const callsLoading = selectedApiId === "all" ? allLoading : singleLoading;
  const callsError = selectedApiId === "all" ? allError : singleError;

  // Transform backend data to component format
  const calls: ApiCall[] =
    recentCalls?.map((call) => {
      const registration = registrations?.find(
        (r) => r.id === call.registrationId
      );
      const isSuccess = call.statusCode >= 200 && call.statusCode < 300;
      const isTimeout = call.statusCode === 408;
      const status: ApiCall["status"] = isTimeout
        ? "timeout"
        : isSuccess
          ? "success"
          : "error";

      return {
        id: call.id,
        apiName: registration?.name || "Unknown API",
        endpoint: call.endpoint.startsWith("/external/")
          ? call.endpoint
          : `/external/${call.registrationId}${call.endpoint}`,
        method: call.method,
        status,
        statusCode: call.statusCode,
        responseTime: call.responseTimeMs,
        timestamp:
          typeof call.timestamp === "string"
            ? call.timestamp
            : call.timestamp.toISOString(),
        requestSize: call.requestSizeBytes || 0,
        responseSize: call.responseSizeBytes || 0,
        userAgent: call.userAgent || "Unknown",
        ipAddress: call.ipAddress || undefined,
        errorMessage: call.errorMessage || undefined,
      };
    }) || [];

  // Helper function to get date range for filtering
  const getFilterDateRange = () => {
    if (dateRange) {
      return {
        start: dateRange.from,
        end: dateRange.to,
      };
    }
    return null;
  };

  const filteredCalls = calls.filter((call) => {
    // Search filter
    const matchesSearch =
      call.apiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.endpoint.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const matchesStatus =
      statusFilter === "all" || call.status === statusFilter;

    // Date filter
    let matchesDate = true;
    const filterRange = getFilterDateRange();
    if (filterRange) {
      const callDate = new Date(call.timestamp);
      matchesDate =
        callDate >= filterRange.start && callDate <= filterRange.end;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (selectedApiId === "all") {
        await refetchAll();
      } else {
        await refetchSingle();
      }
      toast.success("API history refreshed");
    } catch (error) {
      toast.error("Failed to refresh API history");
    }
    setIsRefreshing(false);
  };

  const isLoading = registrationsLoading || callsLoading;
  const error = registrationsError || callsError;

  const getStatusIcon = (status: ApiCall["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "timeout":
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: ApiCall["status"]) => {
    switch (status) {
      case "success":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            Success
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            Error
          </Badge>
        );
      case "timeout":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Timeout
          </Badge>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    );
  };

  const handleExport = () => {
    const csvContent = [
      [
        "Timestamp",
        "API Name",
        "Endpoint",
        "Method",
        "Status",
        "Status Code",
        "Response Time",
        "Request Size",
        "Response Size",
      ].join(","),
      ...filteredCalls.map((call) =>
        [
          call.timestamp,
          call.apiName,
          call.endpoint,
          call.method,
          call.status,
          call.statusCode,
          call.responseTime,
          call.requestSize,
          call.responseSize,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "api-history.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive">Failed to load API history data</p>
            <p className="text-sm text-muted-foreground mt-1">
              {error instanceof Error
                ? error.message
                : "Unknown error occurred"}
            </p>
            <Button onClick={handleRefresh} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-2 w-full">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search APIs or endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          <Select value={selectedApiId} onValueChange={setSelectedApiId}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Select API" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All APIs</SelectItem>
              {registrations?.map((reg) => (
                <SelectItem key={reg.id} value={reg.id}>
                  {reg.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="timeout">Timeout</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Select date range (optional)"
            className="w-full sm:w-64"
          />
          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>


        {/* Filter Summary */}
        {(searchTerm ||
          statusFilter !== "all" ||
          selectedApiId !== "all" ||
          dateRange) && (
            <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
              <span>Active filters:</span>
              {searchTerm && (
                <Badge variant="secondary">Search: "{searchTerm}"</Badge>
              )}
              {statusFilter !== "all" && (
                <Badge variant="secondary">Status: {statusFilter}</Badge>
              )}
              {selectedApiId !== "all" && (
                <Badge variant="secondary">
                  API:{" "}
                  {registrations?.find((r) => r.id === selectedApiId)?.name ||
                    "Unknown"}
                </Badge>
              )}
              {dateRange && (
                <Badge variant="secondary">
                  Date Range: {dateRange.from.toLocaleDateString()} -{" "}
                  {dateRange.to.toLocaleDateString()}
                </Badge>
              )}
              <span className="text-xs">({filteredCalls.length} results)</span>
            </div>
          )}
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Call History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Loading API history...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>API Name</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response Time</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.map((call) => (
                  <TableRow key={call.id}>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(call.timestamp)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {call.apiName}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {call.endpoint}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {call.method}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(call.status)}
                        {getStatusBadge(call.status)}
                      </div>
                    </TableCell>
                    <TableCell>{call.responseTime}ms</TableCell>
                    <TableCell className="text-sm">
                      <div>↑ {formatBytes(call.requestSize)}</div>
                      <div>↓ {formatBytes(call.responseSize)}</div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCall(call)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>API Call Details</DialogTitle>
                          </DialogHeader>
                          {selectedCall && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-medium">
                                    Request Information
                                  </h4>
                                  <div className="mt-2 space-y-1 text-sm">
                                    <p>
                                      <strong>API:</strong>{" "}
                                      {selectedCall.apiName}
                                    </p>
                                    <p>
                                      <strong>Endpoint:</strong>{" "}
                                      {selectedCall.endpoint}
                                    </p>
                                    <p>
                                      <strong>Method:</strong>{" "}
                                      {selectedCall.method}
                                    </p>
                                    <p>
                                      <strong>Timestamp:</strong>{" "}
                                      {formatTimestamp(selectedCall.timestamp)}
                                    </p>
                                    {selectedCall.userAgent && (
                                      <p>
                                        <strong>User Agent:</strong>{" "}
                                        {selectedCall.userAgent}
                                      </p>
                                    )}
                                    {selectedCall.ipAddress && (
                                      <p>
                                        <strong>IP Address:</strong>{" "}
                                        {selectedCall.ipAddress}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-medium">
                                    Response Information
                                  </h4>
                                  <div className="mt-2 space-y-1 text-sm">
                                    <p>
                                      <strong>Status Code:</strong>{" "}
                                      {selectedCall.statusCode}
                                    </p>
                                    <p>
                                      <strong>Response Time:</strong>{" "}
                                      {selectedCall.responseTime}ms
                                    </p>
                                    <p>
                                      <strong>Request Size:</strong>{" "}
                                      {formatBytes(selectedCall.requestSize)}
                                    </p>
                                    <p>
                                      <strong>Response Size:</strong>{" "}
                                      {formatBytes(selectedCall.responseSize)}
                                    </p>
                                    {selectedCall.errorMessage && (
                                      <p>
                                        <strong>Error:</strong>{" "}
                                        <span className="text-destructive">
                                          {selectedCall.errorMessage}
                                        </span>
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-center text-muted-foreground py-8">
                                <p>
                                  Request and response body details are not
                                  stored for privacy and performance reasons.
                                </p>
                                <p className="text-sm mt-1">
                                  Only metadata and performance metrics are
                                  tracked.
                                </p>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoading && filteredCalls.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No API Calls Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all" || selectedApiId !== "all"
                  ? "No calls match your current filters."
                  : "No API calls have been made yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
