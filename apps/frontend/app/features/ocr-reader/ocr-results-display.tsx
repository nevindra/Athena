"use client";

import { Copy, Download, History, Eye } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import type { OcrResult } from "./types";

interface OcrResultsDisplayProps {
  result: OcrResult | null;
  isProcessing: boolean;
  onHistoryToggle: () => void;
  isHistoryOpen: boolean;
}

export function OcrResultsDisplay({ 
  result, 
  isProcessing, 
  onHistoryToggle, 
  isHistoryOpen 
}: OcrResultsDisplayProps) {
  const [activeTab, setActiveTab] = useState<"structured" | "raw">("structured");

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You might want to add a toast notification here
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatStructuredData = (data: Record<string, any>, structure: any) => {
    return JSON.stringify(data, null, 2);
  };

  const renderStructuredFields = (data: Record<string, any>, structure: any) => {
    if (!structure || !structure.fields || structure.fields.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-8">
          <p>No output structure defined</p>
          <p className="text-sm mt-1">Configure the output structure to see structured results here.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {structure.fields.map((field: any) => {
          const value = data[field.key] || "";
          const fieldType = field.type;
          
          return (
            <div key={field.key} className="space-y-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">{field.label}</label>
                {field.required && (
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                )}
                <Badge variant="outline" className="text-xs capitalize">
                  {fieldType}
                </Badge>
              </div>
              <div className="p-3 border rounded-md bg-card">
                <p className="text-sm text-card-foreground">
                  {value || <span className="text-muted-foreground italic">No data extracted</span>}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isProcessing) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-border/30 flex items-center justify-between">
          <h2 className="text-lg font-semibold">OCR Results</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onHistoryToggle}
            className={cn(isHistoryOpen && "bg-accent")}
          >
            <History className="size-4 mr-1" />
            History
          </Button>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <div className="space-y-2">
              <p className="text-lg font-medium">Processing Image</p>
              <p className="text-sm text-muted-foreground">
                Extracting text and applying structure...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b border-border/30 flex items-center justify-between">
          <h2 className="text-lg font-semibold">OCR Results</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={onHistoryToggle}
            className={cn(isHistoryOpen && "bg-accent")}
          >
            <History className="size-4 mr-1" />
            History
          </Button>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <Eye className="size-12 text-muted-foreground mx-auto" />
            <p className="text-lg font-medium">No Results Yet</p>
            <p className="text-sm text-muted-foreground">
              Upload an image to see OCR results here
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b border-border/30 flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold truncate">{result.fileName}</h2>
          <p className="text-sm text-muted-foreground">
            Processed {result.createdAt.toLocaleString()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onHistoryToggle}
          className={cn(isHistoryOpen && "bg-accent")}
        >
          <History className="size-4 mr-1" />
          History
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Image Preview */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Original Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <img
                  src={result.originalImage}
                  alt="Processed image"
                  className="max-w-full max-h-48 object-contain border rounded-lg"
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "structured" | "raw")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="structured">Structured Output</TabsTrigger>
              <TabsTrigger value="raw">Raw Text</TabsTrigger>
            </TabsList>

            <TabsContent value="structured" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      {result.outputStructure.name || "Structured Data"}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyText(formatStructuredData(result.structuredData, result.outputStructure))}
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(
                          formatStructuredData(result.structuredData, result.outputStructure),
                          `${result.fileName}_structured.json`
                        )}
                      >
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </div>
                  {result.outputStructure.description && (
                    <p className="text-xs text-muted-foreground">
                      {result.outputStructure.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  {renderStructuredFields(result.structuredData, result.outputStructure)}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Raw Extracted Text</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyText(result.rawText)}
                      >
                        <Copy className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(result.rawText, `${result.fileName}_raw.txt`)}
                      >
                        <Download className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={result.rawText}
                    readOnly
                    className="min-h-[200px] resize-none"
                    placeholder="No text extracted"
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}