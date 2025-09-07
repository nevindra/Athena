"use client";

import {
  Download,
  Edit2,
  FileSpreadsheet,
  FileText,
  Folder,
  Image,
  MoreVertical,
  Move,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Checkbox } from "~/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { FileActions } from "./file-actions";
import type { FileItem } from "./file-manager";

interface FileGridProps {
  files: FileItem[];
  viewMode: "grid" | "list";
  selectedFiles: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onDeleteFiles: (fileIds: string[]) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onPathChange: (path: string) => void;
}

const getFileIcon = (file: FileItem) => {
  if (file.type === "folder") return Folder;
  if (!file.mimeType) return FileText;

  if (file.mimeType.startsWith("image/")) return Image;
  if (file.mimeType.includes("spreadsheet") || file.mimeType === "text/csv")
    return FileSpreadsheet;
  return FileText;
};

const getFileIconColor = (file: FileItem) => {
  if (file.type === "folder") return "text-blue-500";
  if (!file.mimeType) return "text-muted-foreground";

  if (file.mimeType.startsWith("image/")) return "text-green-500";
  if (file.mimeType.includes("spreadsheet") || file.mimeType === "text/csv")
    return "text-emerald-500";
  if (file.mimeType.includes("pdf")) return "text-red-500";
  if (file.mimeType.includes("word")) return "text-blue-600";
  return "text-muted-foreground";
};

const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatDate = (date: Date) => {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function FileGrid({
  files,
  viewMode,
  selectedFiles,
  onSelectionChange,
  onDeleteFiles,
  onRenameFile,
  onPathChange,
}: FileGridProps) {
  const [actionFile, setActionFile] = useState<FileItem | null>(null);

  const handleFileClick = (file: FileItem) => {
    if (file.type === "folder") {
      const newPath =
        file.path === "/" ? `/${file.name}` : `${file.path}/${file.name}`;
      onPathChange(newPath);
    }
  };

  const handleFileSelect = (fileId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedFiles, fileId]);
    } else {
      onSelectionChange(selectedFiles.filter((id) => id !== fileId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(files.map((file) => file.id));
    } else {
      onSelectionChange([]);
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Folder className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No files or folders
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload files or create a folder to get started
        </p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedFiles.length === files.length}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm font-medium">
              {selectedFiles.length > 0
                ? `${selectedFiles.length} selected`
                : `${files.length} items`}
            </span>
          </div>
          {selectedFiles.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDeleteFiles(selectedFiles)}
            >
              <Trash2 className="size-4 mr-2" />
              Delete Selected
            </Button>
          )}
        </div>

        <div className="border rounded-lg">
          <div className="grid grid-cols-12 gap-4 p-3 border-b bg-muted/50 text-sm font-medium">
            <div className="col-span-1"></div>
            <div className="col-span-5">Name</div>
            <div className="col-span-2">Size</div>
            <div className="col-span-3">Modified</div>
            <div className="col-span-1"></div>
          </div>

          {files.map((file) => {
            const IconComponent = getFileIcon(file);
            const iconColor = getFileIconColor(file);

            return (
              <div
                key={file.id}
                className={cn(
                  "grid grid-cols-12 gap-4 p-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors",
                  selectedFiles.includes(file.id) && "bg-accent/30"
                )}
              >
                <div className="col-span-1 flex items-center">
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={(checked) =>
                      handleFileSelect(file.id, !!checked)
                    }
                  />
                </div>

                <div
                  className="col-span-5 flex items-center gap-3 cursor-pointer"
                  onClick={() => handleFileClick(file)}
                >
                  <IconComponent className={cn("size-5 shrink-0", iconColor)} />
                  <span className="font-medium truncate">{file.name}</span>
                </div>

                <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                  {formatFileSize(file.size)}
                </div>

                <div className="col-span-3 flex items-center text-sm text-muted-foreground">
                  {formatDate(file.uploadDate)}
                </div>

                <div className="col-span-1 flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setActionFile(file)}>
                        <Edit2 className="size-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      {file.type === "file" && (
                        <DropdownMenuItem>
                          <Download className="size-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Move className="size-4 mr-2" />
                        Move
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDeleteFiles([file.id])}
                      >
                        <Trash2 className="size-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>

        <FileActions
          file={actionFile}
          onClose={() => setActionFile(null)}
          onRename={(newName) => {
            if (actionFile) {
              onRenameFile(actionFile.id, newName);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedFiles.length === files.length}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} selected`
              : `${files.length} items`}
          </span>
        </div>
        {selectedFiles.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDeleteFiles(selectedFiles)}
          >
            <Trash2 className="size-4 mr-2" />
            Delete Selected
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {files.map((file) => {
          const IconComponent = getFileIcon(file);
          const iconColor = getFileIconColor(file);

          return (
            <div
              key={file.id}
              className={cn(
                "group relative border rounded-lg p-4 hover:bg-accent/50 transition-all cursor-pointer",
                selectedFiles.includes(file.id) && "bg-accent/30 border-primary"
              )}
              onClick={() => handleFileClick(file)}
            >
              <div className="absolute top-2 left-2">
                <Checkbox
                  checked={selectedFiles.includes(file.id)}
                  onCheckedChange={(checked) =>
                    handleFileSelect(file.id, !!checked)
                  }
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setActionFile(file)}>
                      <Edit2 className="size-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    {file.type === "file" && (
                      <DropdownMenuItem>
                        <Download className="size-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <Move className="size-4 mr-2" />
                      Move
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDeleteFiles([file.id])}
                    >
                      <Trash2 className="size-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-col items-center text-center space-y-3 mt-4">
                <IconComponent className={cn("size-8", iconColor)} />
                <div className="space-y-1 min-w-0 w-full">
                  <p className="text-sm font-medium truncate" title={file.name}>
                    {file.name}
                  </p>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {file.size && <p>{formatFileSize(file.size)}</p>}
                    <p>{formatDate(file.uploadDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <FileActions
        file={actionFile}
        onClose={() => setActionFile(null)}
        onRename={(newName) => {
          if (actionFile) {
            onRenameFile(actionFile.id, newName);
          }
        }}
      />
    </div>
  );
}
