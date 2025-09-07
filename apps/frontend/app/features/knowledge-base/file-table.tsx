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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { cn } from "~/lib/utils";
import { FileActions } from "./file-actions";
import type { FileItem } from "./file-manager";

interface FileTableProps {
  files: FileItem[];
  selectedFiles: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onDeleteFiles: (fileIds: string[]) => void;
  onRenameFile: (fileId: string, newName: string) => void;
}

const getFileIcon = (file: FileItem) => {
  if (file.type === "folder" || file.mimeType === "knowledge-base")
    return Folder;
  if (!file.mimeType) return FileText;

  if (file.mimeType.startsWith("image/")) return Image;
  if (file.mimeType.includes("spreadsheet") || file.mimeType === "text/csv")
    return FileSpreadsheet;
  return FileText;
};

const getFileIconColor = (file: FileItem) => {
  if (file.type === "folder" || file.mimeType === "knowledge-base")
    return "text-blue-500";
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
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const formatDate = (date: Date) => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.ceil(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.ceil(diffDays / 30);
    return months === 1 ? "1 month ago" : `${months} months ago`;
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function FileTable({
  files,
  selectedFiles,
  onSelectionChange,
  onDeleteFiles,
  onRenameFile,
}: FileTableProps) {
  const [actionFile, setActionFile] = useState<FileItem | null>(null);

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
          No files found
        </h3>
        <p className="text-sm text-muted-foreground">
          Upload files to get started
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border/30">
            <TableHead className="w-12">
              <Checkbox
                checked={
                  selectedFiles.length === files.length && files.length > 0
                }
                onCheckedChange={handleSelectAll}
              />
            </TableHead>
            <TableHead className="font-medium">File</TableHead>
            <TableHead className="font-medium w-40">Uploaded by</TableHead>
            <TableHead className="font-medium w-32">Last modified</TableHead>
            <TableHead className="font-medium w-24 text-right">Size</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {files.map((file) => {
            const IconComponent = getFileIcon(file);
            const iconColor = getFileIconColor(file);

            return (
              <TableRow
                key={file.id}
                className={cn(
                  "border-b border-border/20 hover:bg-muted/50 transition-colors",
                  selectedFiles.includes(file.id) && "bg-muted/30"
                )}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedFiles.includes(file.id)}
                    onCheckedChange={(checked) =>
                      handleFileSelect(file.id, !!checked)
                    }
                  />
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-3">
                    <IconComponent
                      className={cn("size-5 shrink-0", iconColor)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate" title={file.name}>
                        {file.name}
                      </p>
                      {file.mimeType && file.mimeType !== "knowledge-base" && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {file.mimeType.split("/")[1] || file.mimeType}
                        </p>
                      )}
                      {file.mimeType === "knowledge-base" && (
                        <p className="text-xs text-muted-foreground">
                          Knowledge Base
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {file.uploadedBy && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {file.uploadedBy.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {file.uploadedBy.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {file.uploadedBy.email}
                        </p>
                      </div>
                    </div>
                  )}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(file.uploadDate)}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground text-right">
                  {formatFileSize(file.size)}
                </TableCell>

                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
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
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* End Message */}
      <div className="text-center py-8 text-sm text-muted-foreground">
        You've reached the end
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
