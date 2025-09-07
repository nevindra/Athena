"use client";

import { FileSpreadsheet, FileText, Image, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  id: string;
}

const ACCEPTED_FILE_TYPES = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  "application/pdf": [".pdf"],
  "application/vnd.ms-excel": [".xls"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
    ".xlsx",
  ],
  "text/csv": [".csv"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.includes("spreadsheet") || mimeType === "text/csv")
    return FileSpreadsheet;
  return FileText;
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function FileUpload({ onFileUpload }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const validateFile = (file: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      alert(`File ${file.name} is too large. Maximum size is 50MB.`);
      return false;
    }

    const acceptedTypes = Object.keys(ACCEPTED_FILE_TYPES);
    const acceptedExtensions = Object.values(ACCEPTED_FILE_TYPES).flat();

    const isValidType = acceptedTypes.some((type) => {
      if (type.endsWith("/*")) {
        return file.type.startsWith(type.replace("/*", "/"));
      }
      return file.type === type;
    });

    const isValidExtension = acceptedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext.toLowerCase())
    );

    if (!isValidType && !isValidExtension) {
      alert(`File type not supported: ${file.name}`);
      return false;
    }

    return true;
  };

  const simulateUpload = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      const id = crypto.randomUUID();
      const uploadingFile: UploadingFile = { file, progress: 0, id };

      setUploadingFiles((prev) => [...prev, uploadingFile]);

      const interval = setInterval(() => {
        setUploadingFiles((prev) =>
          prev.map((uf) =>
            uf.id === id
              ? {
                  ...uf,
                  progress: Math.min(uf.progress + Math.random() * 30, 100),
                }
              : uf
          )
        );
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        setUploadingFiles((prev) => prev.filter((uf) => uf.id !== id));
        resolve();
      }, 2000);
    });
  };

  const handleFileUpload = async (files: File[]) => {
    const validFiles = files.filter(validateFile);
    if (validFiles.length === 0) return;

    // Simulate upload for each file
    await Promise.all(validFiles.map(simulateUpload));

    // Call the parent handler with valid files
    onFileUpload(validFiles);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileUpload(files);
    e.target.value = ""; // Reset input
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((uf) => uf.id !== id));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all",
          "hover:border-primary/50 hover:bg-accent/50",
          isDragging && "border-primary bg-primary/10"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto mb-4 size-8 text-muted-foreground" />
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {isDragging ? "Drop files here" : "Drag and drop files here"}
          </p>
          <p className="text-sm text-muted-foreground">
            or{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              browse files
            </Button>
          </p>
          <p className="text-xs text-muted-foreground">
            Supports: Images (PNG, JPG, GIF), Documents (PDF, DOC, DOCX),
            Spreadsheets (XLS, XLSX, CSV)
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum file size: 50MB
          </p>
        </div>
        <input
          id="file-upload"
          type="file"
          multiple
          accept={Object.keys(ACCEPTED_FILE_TYPES).join(",")}
          className="hidden"
          onChange={handleFileInput}
        />
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploading files...</h4>
          {uploadingFiles.map((uploadingFile) => {
            const IconComponent = getFileIcon(uploadingFile.file.type);
            return (
              <div
                key={uploadingFile.id}
                className="flex items-center gap-3 p-3 border rounded-lg bg-card"
              >
                <IconComponent className="size-5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate">
                      {uploadingFile.file.name}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(uploadingFile.file.size)}
                    </span>
                  </div>
                  <Progress value={uploadingFile.progress} className="h-1" />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeUploadingFile(uploadingFile.id)}
                  className="shrink-0"
                >
                  <X className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
