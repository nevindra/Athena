"use client";

import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  Image,
  Music,
  Plus,
  Video,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import type { FileCategory, FileItem } from "./file-manager";

interface CategorySidebarProps {
  selectedCategory: FileCategory;
  onCategoryChange: (category: FileCategory) => void;
  onCreateKnowledgeBase: () => void;
  files: FileItem[];
}

interface CategoryItem {
  id: FileCategory;
  label: string;
  icon: React.ComponentType<any>;
  count?: number;
}

export function CategorySidebar({
  selectedCategory,
  onCategoryChange,
  onCreateKnowledgeBase,
  files,
}: CategorySidebarProps) {

  const getFileCountByCategory = (category: FileCategory): number => {
    switch (category) {
      case "all":
        return files.length;
      case "documents":
        return files.filter(
          (file) =>
            file.mimeType &&
            (file.mimeType.includes("pdf") ||
              file.mimeType.includes("word") ||
              file.mimeType.includes("document") ||
              file.mimeType === "text/csv")
        ).length;
      case "images":
        return files.filter((file) => file.mimeType?.startsWith("image/"))
          .length;
      case "audio":
        return files.filter((file) => file.mimeType?.startsWith("audio/"))
          .length;
      case "videos":
        return files.filter((file) => file.mimeType?.startsWith("video/"))
          .length;
      case "knowledge-base":
        return files.filter(
          (file) =>
            file.mimeType === "knowledge-base" ||
            file.path.startsWith("/knowledge-base")
        ).length;
      default:
        return 0;
    }
  };

  const categories: CategoryItem[] = [
    { id: "all", label: "All Files", icon: FileText },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "images", label: "Images", icon: Image },
    { id: "audio", label: "Audio", icon: Music },
    { id: "videos", label: "Videos", icon: Video },
  ];

  const knowledgeBases = files.filter(
    (file) =>
      file.mimeType === "knowledge-base" ||
      file.path.startsWith("/knowledge-base")
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Categories
        </h3>
        <div className="space-y-1">
          {categories.map((category) => {
            const count = getFileCountByCategory(category.id);
            const IconComponent = category.icon;

            return (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start gap-3 h-10 rounded-lg",
                  selectedCategory === category.id && "bg-accent shadow-sm"
                )}
                onClick={() => onCategoryChange(category.id)}
              >
                <IconComponent className="size-4 shrink-0" />
                <span className="flex-1 text-left">{category.label}</span>
                {count > 0 && (
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                    {count}
                  </span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Knowledge Base Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Knowledge Bases
          </h3>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 rounded-md"
            onClick={onCreateKnowledgeBase}
          >
            <Plus className="size-3" />
          </Button>
        </div>

        <div className="space-y-1">
          {knowledgeBases.map((kb) => (
            <Button
              key={kb.id}
              variant="ghost"
              size="sm"
              className={cn(
                "w-full justify-start gap-3 h-10 text-sm rounded-lg",
                selectedCategory === "knowledge-base" && "bg-accent shadow-sm"
              )}
              onClick={() => onCategoryChange("knowledge-base")}
            >
              <Folder className="size-4 text-blue-500" />
              <span className="truncate">{kb.name}</span>
            </Button>
          ))}

          {knowledgeBases.length === 0 && (
            <div className="text-xs text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
              No knowledge bases yet
              <p className="mt-1">Click + to create one</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
