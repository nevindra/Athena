"use client";

import type {
  FileCategory,
  FileDetailsResponse,
  KnowledgeBaseResponse,
  StorageStatsResponse,
} from "@athena/shared";
import {
  Database,
  FileSpreadsheet,
  FileText,
  Folder,
  FolderPlus,
  Image,
  Music,
  Search,
  Upload,
  Users,
  Video,
  Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { knowledgeBaseApi } from "~/services/knowledge-base-api";
import { knowledgeBaseFilesApi } from "~/services/knowledge-base-files-api";
import { storageApi } from "~/services/storage-api";
import { CategorySidebar } from "./category-sidebar";
import { CreateFolderDialog } from "./create-folder-dialog";
import { FileTable } from "./file-table";
import { FileUpload } from "./file-upload";
import { FileContentCard } from "~/components/ui/content-card";
import {
  formatFileSize,
  formatTimeAgo,
  getFileTypeDisplay,
  handleFileDownload,
  renderFilePreview,
} from "./file-preview-utils";

export interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  uploadDate: Date;
  path: string;
  mimeType?: string;
  thumbnail?: string;
  downloadUrl?: string;
  uploadedBy?: {
    name: string;
    avatar?: string;
    email?: string;
  };
}

export function FileManager() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseResponse[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStatsResponse | null>(null);
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<FileCategory>("all");
  const [isCreateKnowledgeBaseOpen, setIsCreateKnowledgeBaseOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showKnowledgeBaseContent, setShowKnowledgeBaseContent] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Convert API file response to local FileItem format
  const convertToFileItem = (apiFile: any): FileItem => ({
    id: apiFile.id,
    name: apiFile.originalName || apiFile.name,
    type: "file",
    size: apiFile.size,
    uploadDate: new Date(apiFile.createdAt),
    path: apiFile.path,
    mimeType: apiFile.mimeType,
    thumbnail: apiFile.thumbnailUrl,
    downloadUrl: apiFile.downloadUrl,
    uploadedBy: apiFile.uploadedBy ? {
      name: apiFile.uploadedBy.name,
      email: apiFile.uploadedBy.email,
      avatar: apiFile.uploadedBy.avatar || apiFile.uploadedBy.name?.charAt(0)?.toUpperCase(),
    } : undefined,
  });

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load files, knowledge bases, and storage stats in parallel
        const [filesResponse, kbResponse, statsResponse, recentResponse] = await Promise.all([
          knowledgeBaseFilesApi.getFiles({ limit: 50 }),
          knowledgeBaseApi.getKnowledgeBases({ hierarchy: true }),
          storageApi.getStorageStats(),
          knowledgeBaseFilesApi.getRecentFiles(3),
        ]);

        const fileItems = filesResponse?.files ? filesResponse.files.map(convertToFileItem) : [];
        const recentItems = Array.isArray(recentResponse) ? recentResponse.map(convertToFileItem) : [];

        // Add knowledge bases as folder items
        if (Array.isArray(kbResponse)) {
          const kbItems: FileItem[] = kbResponse.map((kb) => ({
            id: kb.id,
            name: kb.name,
            type: "folder",
            uploadDate: new Date(kb.createdAt),
            path: kb.path,
            mimeType: "knowledge-base",
            uploadedBy: {
              name: "System",
              avatar: "S",
            },
          }));
          setKnowledgeBases(kbResponse);
          setFiles([...fileItems, ...kbItems]);
        } else if (kbResponse && typeof kbResponse === 'object' && 'knowledgeBases' in kbResponse) {
          // Handle paginated response format
          const kbItems: FileItem[] = kbResponse.knowledgeBases.map((kb) => ({
            id: kb.id,
            name: kb.name,
            type: "folder",
            uploadDate: new Date(kb.createdAt),
            path: kb.path,
            mimeType: "knowledge-base",
            uploadedBy: {
              name: "System",
              avatar: "S",
            },
          }));
          setKnowledgeBases(kbResponse.knowledgeBases);
          setFiles([...fileItems, ...kbItems]);
        } else {
          setFiles(fileItems);
        }

        setRecentFiles(recentItems);
        setStorageStats(statsResponse);
      } catch (err) {
        console.error("Failed to load data:", err);
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleFileUpload = async (uploadedFiles: File[]) => {
    try {
      const response = await knowledgeBaseFilesApi.uploadFiles(uploadedFiles);

      if (response?.success) {
        // Reload both files and recent files after successful upload
        const [filesResponse, recentResponse] = await Promise.all([
          knowledgeBaseFilesApi.getFiles({ limit: 50 }),
          knowledgeBaseFilesApi.getRecentFiles(3),
        ]);

        const fileItems = filesResponse?.files ? filesResponse.files.map(convertToFileItem) : [];
        const recentItems = Array.isArray(recentResponse) ? recentResponse.map(convertToFileItem) : [];

        setFiles((prev) => {
          const nonFiles = prev.filter(item => item.type === "folder");
          return [...fileItems, ...nonFiles];
        });

        setRecentFiles(recentItems);

        // Clear error on success
        setError(null);
      }

      if (response?.errors && response.errors.length > 0) {
        const errorMessage = response.errors.map(e => `${e.fileName}: ${e.error}`).join(", ");
        setError(`Some files failed to upload: ${errorMessage}`);
      }
    } catch (err) {
      console.error("File upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload files");
    }
  };

  const handleCreateKnowledgeBase = async (name: string) => {
    try {
      const newKb = await knowledgeBaseApi.createKnowledgeBase({
        name,
        description: `Knowledge base created on ${new Date().toLocaleDateString()}`,
      });

      if (!newKb || !newKb.id) {
        throw new Error("Invalid response from server");
      }

      const kbItem: FileItem = {
        id: newKb.id,
        name: newKb.name,
        type: "folder",
        uploadDate: new Date(newKb.createdAt),
        path: newKb.path,
        mimeType: "knowledge-base",
        uploadedBy: {
          name: "Current User",
          avatar: "CU",
        },
      };

      setFiles((prev) => [...prev, kbItem]);
      setKnowledgeBases((prev) => [...prev, newKb]);

      // Clear error on success
      setError(null);
    } catch (err) {
      console.error("Failed to create knowledge base:", err);
      setError(err instanceof Error ? err.message : "Failed to create knowledge base");
    }
  };

  // Handle search with API
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      // Reload all files if search is cleared
      const filesResponse = await knowledgeBaseFilesApi.getFiles({ limit: 50 });
      const fileItems = filesResponse?.files ? filesResponse.files.map(convertToFileItem) : [];
      setFiles((prev) => {
        const kbItems = prev.filter(item => item.mimeType === "knowledge-base");
        return [...fileItems, ...kbItems];
      });
      return;
    }

    try {
      const searchResponse = await knowledgeBaseFilesApi.searchFiles({ q: query });
      const searchResults = searchResponse?.files ? searchResponse.files.map(convertToFileItem) : [];

      // Keep knowledge bases in the results
      const kbItems = files.filter(item => item.mimeType === "knowledge-base");
      setFiles([...searchResults, ...kbItems]);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "Search failed");
    }
  };

  const getFilesByCategory = (category: FileCategory): FileItem[] => {
    return files.filter((file) => {
      switch (category) {
        case "all":
          return true;
        case "documents":
          return (
            file.mimeType &&
            (file.mimeType.includes("pdf") ||
              file.mimeType.includes("word") ||
              file.mimeType.includes("document") ||
              file.mimeType === "text/csv")
          );
        case "images":
          return file.mimeType?.startsWith("image/");
        case "audio":
          return file.mimeType?.startsWith("audio/");
        case "videos":
          return file.mimeType?.startsWith("video/");
        case "knowledge-base":
          return (
            file.mimeType === "knowledge-base" ||
            file.path.startsWith("/knowledge-base")
          );
        default:
          return true;
      }
    });
  };

  const handleDeleteFiles = async (fileIds: string[]) => {
    try {
      // Delete files via API
      await Promise.all(
        fileIds.map(async (fileId) => {
          const file = files.find(f => f.id === fileId);
          if (file?.type === "file") {
            await knowledgeBaseFilesApi.deleteFile(fileId);
          } else if (file?.mimeType === "knowledge-base") {
            await knowledgeBaseApi.deleteKnowledgeBase(fileId);
          }
        })
      );

      // Remove from local state
      setFiles((prev) => prev.filter((file) => !fileIds.includes(file.id)));
      setSelectedFiles([]);
    } catch (err) {
      console.error("Failed to delete files:", err);
      setError(err instanceof Error ? err.message : "Failed to delete files");
    }
  };

  const handleRenameFile = async (fileId: string, newName: string) => {
    try {
      const file = files.find(f => f.id === fileId);

      if (file?.type === "file") {
        await knowledgeBaseFilesApi.updateFile(fileId, { name: newName });
      } else if (file?.mimeType === "knowledge-base") {
        await knowledgeBaseApi.updateKnowledgeBase(fileId, { name: newName });
      }

      // Update local state
      setFiles((prev) =>
        prev.map((file) =>
          file.id === fileId ? { ...file, name: newName } : file
        )
      );
    } catch (err) {
      console.error("Failed to rename file:", err);
      setError(err instanceof Error ? err.message : "Failed to rename file");
    }
  };

  const filteredFiles = getFilesByCategory(selectedCategory);
  const totalFileSize = storageStats?.totalUsed || 0;
  const maxStorage = storageStats?.totalLimit || (10 * 1024 * 1024);

  if (loading) {
    return (
      <div className="flex h-full bg-background items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading knowledge base...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Error Display */}
      {error && (
        <div className="absolute top-4 right-4 z-50 bg-destructive text-destructive-foreground px-4 py-2 rounded-md">
          <button
            onClick={() => setError(null)}
            className="float-right ml-2 text-lg leading-none"
          >
            ×
          </button>
          {error}
        </div>
      )}

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
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Debounce search
                    setTimeout(() => {
                      if (e.target.value === searchQuery) {
                        handleSearch(e.target.value);
                      }
                    }, 500);
                  }}
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

        {/* Recently Upload Section */}
        <div className="p-6 border-b border-border/30">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recently Uploaded</h2>

          </div>

          {recentFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Upload className="size-8 mx-auto mb-2 opacity-50" />
              <p>No recent uploads</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {recentFiles.map((file) => (
                <FileContentCard
                  key={file.id}
                  fileName={file.name}
                  fileSize={formatFileSize(file.size)}
                  fileType={getFileTypeDisplay(file.mimeType)}
                  timeAgo={formatTimeAgo(file.uploadDate)}
                  preview={renderFilePreview(file)}
                  onClick={() => handleFileDownload(file)}
                />
              ))}
            </div>
          )}
        </div>

        {/* All Files Section Header */}
        <div className="p-6">
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
              <span className="text-muted-foreground">Total storage</span>
              <span className="ml-2">
                {(totalFileSize / (1024 * 1024)).toFixed(1)} MB /{" "}
                {(maxStorage / (1024 * 1024)).toFixed(0)} MB
              </span>
            </div>

            <div>
              <span className="text-muted-foreground">Files</span>
              <span className="ml-2">
                {storageStats?.breakdown?.files ?
                  (storageStats.breakdown.files / (1024 * 1024)).toFixed(1) + " MB" :
                  "0 MB"
                }
              </span>
            </div>

            <div>
              <span className="text-muted-foreground">Knowledge bases</span>
              <span className="ml-2">
                {storageStats?.breakdown?.knowledgeBases ?
                  (storageStats.breakdown.knowledgeBases / (1024 * 1024)).toFixed(1) + " MB" :
                  "0 MB"
                }
              </span>
            </div>

            <div>
              <span className="text-muted-foreground">Trash</span>
              <span className="ml-2">
                {storageStats?.breakdown?.trash ?
                  (storageStats.breakdown.trash / (1024 * 1024)).toFixed(1) + " MB" :
                  "0 MB"
                }
              </span>
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
