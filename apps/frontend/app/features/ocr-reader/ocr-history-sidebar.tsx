"use client";

import { Calendar, ChevronRight, FileText, Image, Trash2, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import type { OcrResult } from "./types";

interface OcrHistorySidebarProps {
  results: OcrResult[];
  isOpen: boolean;
  onClose: () => void;
  onSelectResult: (result: OcrResult) => void;
}

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInHours / 24;

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInMs / (1000 * 60));
    return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;
  } else if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  } else if (diffInDays < 7) {
    const days = Math.floor(diffInDays);
    return `${days} day${days !== 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

const truncateText = (text: string, maxLength: number = 80) => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
};

export function OcrHistorySidebar({ 
  results, 
  isOpen, 
  onClose, 
  onSelectResult 
}: OcrHistorySidebarProps) {
  if (!isOpen) return null;

  const groupedResults = results.reduce((groups, result) => {
    const date = result.createdAt.toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(result);
    return groups;
  }, {} as Record<string, OcrResult[]>);

  const sortedDates = Object.keys(groupedResults).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="w-80 border-l border-border/30 bg-background flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/30 flex items-center justify-between">
        <h3 className="font-semibold">OCR History</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {results.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <FileText className="size-8 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">No OCR history</p>
              <p className="text-xs text-muted-foreground">
                Your processed images will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((date) => (
                <div key={date} className="space-y-2">
                  {/* Date Header */}
                  <div className="flex items-center gap-2 py-2 border-b border-border/20">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {new Date(date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>

                  {/* Results for this date */}
                  <div className="space-y-2">
                    {groupedResults[date].map((result) => (
                      <Card 
                        key={result.id} 
                        className="cursor-pointer hover:bg-accent/50 transition-colors"
                        onClick={() => onSelectResult(result)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {/* Image Preview */}
                            <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                              <img
                                src={result.originalImage}
                                alt={result.fileName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling!.classList.remove('hidden');
                                }}
                              />
                              <Image className="size-6 text-muted-foreground hidden" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-sm truncate">
                                  {result.fileName}
                                </h4>
                                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {result.outputStructure.name}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {result.outputStructure.fields.length} fields
                                </span>
                              </div>

                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {truncateText(result.rawText)}
                              </p>

                              <div className="flex items-center justify-between">
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(result.createdAt)}
                                </span>
                                {result.confidence && (
                                  <span className="text-xs text-muted-foreground">
                                    {Math.round(result.confidence * 100)}% confidence
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      {results.length > 0 && (
        <div className="p-4 border-t border-border/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="size-4 mr-1" />
              Clear All
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}