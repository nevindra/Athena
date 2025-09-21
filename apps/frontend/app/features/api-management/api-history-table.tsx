"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  Filter,
  Search,
} from "lucide-react";

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
  request: any;
  response: any;
}

// Mock data - replace with actual API calls
const mockApiCalls: ApiCall[] = [
  {
    id: "1",
    apiName: "OpenAI Chat API",
    endpoint: "/v1/chat/completions",
    method: "POST",
    status: "success",
    statusCode: 200,
    responseTime: 245,
    timestamp: new Date(Date.now() - 300000).toISOString(),
    requestSize: 1024,
    responseSize: 2048,
    userAgent: "AthenAPI/1.0",
    request: { model: "gpt-4", messages: [{ role: "user", content: "Hello" }] },
    response: { choices: [{ message: { role: "assistant", content: "Hi there!" } }] },
  },
  {
    id: "2",
    apiName: "Custom ML Model",
    endpoint: "/predict",
    method: "POST",
    status: "error",
    statusCode: 500,
    responseTime: 1200,
    timestamp: new Date(Date.now() - 600000).toISOString(),
    requestSize: 2048,
    responseSize: 512,
    userAgent: "AthenAPI/1.0",
    request: { input: "sample data" },
    response: { error: "Internal server error" },
  },
  {
    id: "3",
    apiName: "Data Processing API",
    endpoint: "/process",
    method: "POST",
    status: "timeout",
    statusCode: 408,
    responseTime: 30000,
    timestamp: new Date(Date.now() - 900000).toISOString(),
    requestSize: 4096,
    responseSize: 0,
    userAgent: "AthenAPI/1.0",
    request: { data: "large dataset" },
    response: null,
  },
  {
    id: "4",
    apiName: "OpenAI Chat API",
    endpoint: "/v1/chat/completions",
    method: "POST",
    status: "success",
    statusCode: 200,
    responseTime: 180,
    timestamp: new Date(Date.now() - 1200000).toISOString(),
    requestSize: 512,
    responseSize: 1024,
    userAgent: "AthenAPI/1.0",
    request: { model: "gpt-3.5-turbo", messages: [{ role: "user", content: "Explain AI" }] },
    response: { choices: [{ message: { role: "assistant", content: "AI is..." } }] },
  },
];

export function ApiHistoryTable() {
  const [calls, setCalls] = useState<ApiCall[]>(mockApiCalls);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCall, setSelectedCall] = useState<ApiCall | null>(null);

  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.apiName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || call.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        return <Badge className="bg-green-100 text-green-800 border-green-200">Success</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Error</Badge>;
      case "timeout":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Timeout</Badge>;
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleExport = () => {
    const csvContent = [
      ["Timestamp", "API Name", "Endpoint", "Method", "Status", "Status Code", "Response Time", "Request Size", "Response Size"].join(","),
      ...filteredCalls.map(call => [
        call.timestamp,
        call.apiName,
        call.endpoint,
        call.method,
        call.status,
        call.statusCode,
        call.responseTime,
        call.requestSize,
        call.responseSize,
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "api-history.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search APIs or endpoints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
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
        </div>
        <Button onClick={handleExport} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Call History</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TableCell className="font-medium">{call.apiName}</TableCell>
                  <TableCell className="font-mono text-sm">{call.endpoint}</TableCell>
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
                                <h4 className="font-medium">Request Information</h4>
                                <div className="mt-2 space-y-1 text-sm">
                                  <p><strong>API:</strong> {selectedCall.apiName}</p>
                                  <p><strong>Endpoint:</strong> {selectedCall.endpoint}</p>
                                  <p><strong>Method:</strong> {selectedCall.method}</p>
                                  <p><strong>Timestamp:</strong> {formatTimestamp(selectedCall.timestamp)}</p>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-medium">Response Information</h4>
                                <div className="mt-2 space-y-1 text-sm">
                                  <p><strong>Status Code:</strong> {selectedCall.statusCode}</p>
                                  <p><strong>Response Time:</strong> {selectedCall.responseTime}ms</p>
                                  <p><strong>Request Size:</strong> {formatBytes(selectedCall.requestSize)}</p>
                                  <p><strong>Response Size:</strong> {formatBytes(selectedCall.responseSize)}</p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium">Request Body</h4>
                              <pre className="mt-2 p-3 bg-muted rounded-md text-sm overflow-auto">
                                {JSON.stringify(selectedCall.request, null, 2)}
                              </pre>
                            </div>

                            <div>
                              <h4 className="font-medium">Response Body</h4>
                              <pre className="mt-2 p-3 bg-muted rounded-md text-sm overflow-auto">
                                {selectedCall.response ? JSON.stringify(selectedCall.response, null, 2) : "No response data"}
                              </pre>
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

          {filteredCalls.length === 0 && (
            <div className="text-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No API Calls Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
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