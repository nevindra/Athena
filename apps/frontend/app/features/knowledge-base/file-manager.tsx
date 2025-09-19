"use client";

import {
  Database,
  FileSpreadsheet,
  FileText,
  Folder,
  Image,
  Music,
  Search,
  Upload,
  Users,
  Video,
  Workflow,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { CategorySidebar } from "./category-sidebar";
import { CreateFolderDialog } from "./create-folder-dialog";
import { FileTable } from "./file-table";
import { FileUpload } from "./file-upload";

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  uploadDate: Date;
  path: string;
  mimeType?: string;
  thumbnail?: string;
  uploadedBy?: {
    name: string;
    avatar?: string;
    email?: string;
  };
}

export type FileCategory =
  | "all"
  | "documents"
  | "images"
  | "audio"
  | "videos"
  | "knowledge-base";

export function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: "1",
      name: "prabowo.jpg",
      type: "file",
      size: 101888,
      uploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      path: "/",
      mimeType: "image/jpeg",
      uploadedBy: {
        name: "Amelie Laurent",
        email: "amelie@huntedlux.com",
        avatar: "AL",
      },
    },
    {
      id: "2",
      name: "Hukum Pidana",
      type: "folder",
      uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      path: "/knowledge-base",
      mimeType: "knowledge-base",
      uploadedBy: {
        name: "Armour Foley",
        email: "armour@huntedlux.co",
        avatar: "AF",
      },
    },
    {
      id: "3",
      name: "Dashboard tech requirements",
      type: "file",
      size: 225280,
      uploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      path: "/",
      mimeType: "application/pdf",
      uploadedBy: {
        name: "Amelie Laurent",
        email: "amelie@huntedlux.com",
        avatar: "AL",
      },
    },
    {
      id: "4",
      name: "Q4_2023 Reporting",
      type: "file",
      size: 1228800,
      uploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      path: "/",
      mimeType: "application/pdf",
      uploadedBy: {
        name: "Armour Foley",
        email: "armour@huntedlux.co",
        avatar: "AF",
      },
    },
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>("all");
  const [isCreateKnowledgeBaseOpen, setIsCreateKnowledgeBaseOpen] =
    useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showKnowledgeBaseContent, setShowKnowledgeBaseContent] =
    useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const handleFileUpload = (uploadedFiles: File[]) => {
    const newFiles: FileItem[] = uploadedFiles.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: "file" as const,
      size: file.size,
      uploadDate: new Date(),
      path: "/",
      mimeType: file.type,
      uploadedBy: {
        name: "Current User",
        email: "user@example.com",
        avatar: "CU",
      },
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleCreateKnowledgeBase = (name: string) => {
    const newKnowledgeBase: FileItem = {
      id: crypto.randomUUID(),
      name,
      type: "folder",
      uploadDate: new Date(),
      path: "/knowledge-base",
      mimeType: "knowledge-base",
      uploadedBy: {
        name: "Current User",
        email: "user@example.com",
        avatar: "CU",
      },
    };

    setFiles((prev) => [...prev, newKnowledgeBase]);
  };

  const getFilesByCategory = (category: FileCategory): FileItem[] => {
    return files.filter((file) => {
      const matchesSearch = file.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      switch (category) {
        case "all":
          return matchesSearch;
        case "documents":
          return (
            matchesSearch &&
            file.mimeType &&
            (file.mimeType.includes("pdf") ||
              file.mimeType.includes("word") ||
              file.mimeType.includes("document") ||
              file.mimeType === "text/csv")
          );
        case "images":
          return matchesSearch && file.mimeType?.startsWith("image/");
        case "audio":
          return matchesSearch && file.mimeType?.startsWith("audio/");
        case "videos":
          return matchesSearch && file.mimeType?.startsWith("video/");
        case "knowledge-base":
          return (
            matchesSearch &&
            (file.mimeType === "knowledge-base" ||
              file.path.startsWith("/knowledge-base"))
          );
        default:
          return matchesSearch;
      }
    });
  };

  const handleDeleteFiles = (fileIds: string[]) => {
    setFiles((prev) => prev.filter((file) => !fileIds.includes(file.id)));
    setSelectedFiles([]);
  };

  const handleRenameFile = (fileId: string, newName: string) => {
    setFiles((prev) =>
      prev.map((file) =>
        file.id === fileId ? { ...file, name: newName } : file
      )
    );
  };

  const filteredFiles = getFilesByCategory(selectedCategory);
  const totalFileSize = files.reduce(
    (total, file) => total + (file.size || 0),
    0
  );
  const maxStorage = 10 * 1024 * 1024;
  const recentFiles = files
    .sort((a, b) => b.uploadDate.getTime() - a.uploadDate.getTime())
    .slice(0, 3);

  const createOptions = [
    {
      id: "knowledge-base",
      label: "New knowledge base",
      icon: Database,
      action: () => setIsCreateKnowledgeBaseOpen(true),
    },
    {
      id: "dataset",
      label: "New dataset",
      icon: FileText,
      action: () => console.log("Create dataset"),
    },
    {
      id: "project",
      label: "New project",
      icon: Workflow,
      action: () => console.log("Create project"),
    },
    {
      id: "team",
      label: "New team",
      icon: Users,
      action: () => console.log("Create team"),
    },
  ];

  return (
    <div className="flex h-full bg-background">
      {/* Sidebar - Category Navigation */}
      <div className="w-64 border-r border-border/50 bg-card">
        <CategorySidebar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onCreateKnowledgeBase={() => setIsCreateKnowledgeBaseOpen(true)}
          files={files}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Team Knowledge Base</h1>
              <p className="text-muted-foreground">
                Manage team files and collaborative knowledge bases
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
                <Input
                  placeholder="Search Files"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-16 w-80"
                />
              </div>

              {/* Upload Button */}
              <Button onClick={() => setIsUploadDialogOpen(true)}>
                <Upload className="size-4" />
                Upload
              </Button>
            </div>
          </div>
        </div>

        {/* Project Creation Cards */}
        <div className="p-6 border-b border-border/30">
          <div className="grid grid-cols-4 gap-4 mb-6">
            {createOptions.map((option) => {
              const IconComponent = option.icon;
              return (
                <Button
                  key={option.id}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-accent/50 transition-colors"
                  onClick={option.action}
                >
                  <IconComponent className="size-6 text-muted-foreground" />
                  <span className="text-sm font-medium">{option.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Recently Upload Section */}
        <div className="p-6 border-b border-border/30">
          <h2 className="text-lg font-semibold mb-4">Recently Upload</h2>
          <div className="grid grid-cols-3 gap-4">
            {recentFiles.map((file) => {
              const getFileIcon = (mimeType?: string, fileType?: string) => {
                if (fileType === "folder" || mimeType === "knowledge-base") {
                  return { icon: Folder, color: "text-blue-500" };
                }
                if (!mimeType)
                  return { icon: FileText, color: "text-muted-foreground" };

                if (mimeType.includes("pdf")) {
                  return { icon: FileText, color: "text-red-500" };
                }
                if (mimeType.startsWith("image/")) {
                  return { icon: Image, color: "text-green-500" };
                }
                if (
                  mimeType.includes("spreadsheet") ||
                  mimeType === "text/csv"
                ) {
                  return { icon: FileSpreadsheet, color: "text-emerald-500" };
                }
                if (mimeType.startsWith("audio/")) {
                  return { icon: Music, color: "text-purple-500" };
                }
                if (mimeType.startsWith("video/")) {
                  return { icon: Video, color: "text-orange-500" };
                }
                if (mimeType.includes("word")) {
                  return { icon: FileText, color: "text-blue-600" };
                }
                return { icon: FileText, color: "text-muted-foreground" };
              };

              const getFileTypeDisplay = (mimeType?: string) => {
                if (!mimeType) return "Unknown";
                if (mimeType === "knowledge-base") return "Knowledge Base";
                if (mimeType.includes("pdf")) return "PDF";
                if (mimeType.startsWith("image/")) return "Image";
                if (mimeType.includes("spreadsheet")) return "Spreadsheet";
                if (mimeType === "text/csv") return "CSV";
                if (mimeType.startsWith("audio/")) return "Audio";
                if (mimeType.startsWith("video/")) return "Video";
                if (mimeType.includes("word")) return "Document";
                return mimeType.split("/")[1]?.toUpperCase() || "File";
              };

              const formatFileSize = (bytes?: number) => {
                if (!bytes) return "";
                if (bytes === 0) return "0 Bytes";
                const k = 1024;
                const sizes = ["Bytes", "KB", "MB", "GB"];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return (
                  Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) +
                  " " +
                  sizes[i]
                );
              };

              const { icon: IconComponent, color } = getFileIcon(
                file.mimeType,
                file.type
              );

              return (
                <div
                  key={file.id}
                  className="bg-card border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded flex items-center justify-center">
                      <IconComponent className={`size-5 ${color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)} •{" "}
                        {getFileTypeDisplay(file.mimeType)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* All Files Section Header */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">All files</h2>
            <div className="flex items-center gap-2">
              <Switch
                id="show-knowledge-base"
                checked={showKnowledgeBaseContent}
                onCheckedChange={setShowKnowledgeBaseContent}
              />
              <Label htmlFor="show-knowledge-base" className="text-sm">
                Show content in Knowledge Base
              </Label>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 mb-4">
            <Button
              variant={selectedCategory === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              View all
            </Button>
            <Button
              variant={selectedCategory === "documents" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("documents")}
            >
              Documents
            </Button>
            <Button
              variant={selectedCategory === "images" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("images")}
            >
              Images
            </Button>
            <Button
              variant={selectedCategory === "audio" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("audio")}
            >
              Audio
            </Button>
            <Button
              variant={selectedCategory === "videos" ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory("videos")}
            >
              Videos
            </Button>
            <Button
              variant={
                selectedCategory === "knowledge-base" ? "default" : "ghost"
              }
              size="sm"
              onClick={() => setSelectedCategory("knowledge-base")}
            >
              Knowledge Bases
            </Button>
          </div>

          <div className="text-sm text-muted-foreground mb-4">
            Total {filteredFiles.length} items
          </div>

          {/* File Table */}
          <div className="overflow-auto">
            <FileTable
              files={filteredFiles}
              selectedFiles={selectedFiles}
              onSelectionChange={setSelectedFiles}
              onDeleteFiles={handleDeleteFiles}
              onRenameFile={handleRenameFile}
            />
          </div>
        </div>

        {/* Storage Status Bar */}
        <div className="border-t border-border/30 p-4 bg-muted/20">
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-muted-foreground">Team storage</span>
              <span className="ml-2">
                {(totalFileSize / (1024 * 1024)).toFixed(1)} MB /{" "}
                {(maxStorage / (1024 * 1024)).toFixed(0)} MB
              </span>
            </div>

            <div>
              <span className="text-muted-foreground">Embedding storage</span>
              <span className="ml-2">3 / 100</span>
            </div>

            <div>
              <span className="text-muted-foreground">Team members</span>
              <span className="ml-2">4 active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      {isUploadDialogOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-card border rounded-lg p-6 max-w-2xl w-full mx-4">
            <FileUpload
              onFileUpload={(files) => {
                handleFileUpload(files);
                setIsUploadDialogOpen(false);
              }}
            />
            <Button
              variant="outline"
              onClick={() => setIsUploadDialogOpen(false)}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Create Knowledge Base Dialog */}
      <CreateFolderDialog
        open={isCreateKnowledgeBaseOpen}
        onOpenChange={setIsCreateKnowledgeBaseOpen}
        onCreateFolder={handleCreateKnowledgeBase}
      />
    </div>
  );
}
