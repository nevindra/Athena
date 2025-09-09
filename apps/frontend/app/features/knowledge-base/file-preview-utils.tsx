import {
  FileSpreadsheet,
  FileText,
  Folder,
  Image,
  Music,
  Video,
} from "lucide-react";
import type { FileItem } from "./file-manager";

export const getFileIcon = (mimeType?: string, fileType?: string) => {
  if (fileType === "folder" || mimeType === "knowledge-base") {
    return { icon: Folder, color: "text-blue-500" };
  }
  if (!mimeType) return { icon: FileText, color: "text-muted-foreground" };

  if (mimeType.includes("pdf")) {
    return { icon: FileText, color: "text-red-500" };
  }
  if (mimeType.startsWith("image/")) {
    return { icon: Image, color: "text-green-500" };
  }
  if (mimeType.includes("spreadsheet") || mimeType === "text/csv") {
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

// For table usage - returns just the icon component
export const getFileIconComponent = (file: FileItem) => {
  const { icon } = getFileIcon(file.mimeType, file.type);
  return icon;
};

// For table usage - returns just the color class
export const getFileIconColor = (file: FileItem) => {
  const { color } = getFileIcon(file.mimeType, file.type);
  return color;
};

export const getFileTypeDisplay = (mimeType?: string) => {
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

export const formatFileSize = (bytes?: number) => {
  if (!bytes) return "";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  );
};

export const formatTimeAgo = (date: Date) => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// For table usage - more detailed date formatting
export const formatDate = (date: Date) => {
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

export const handleFileDownload = (file: FileItem) => {
  if (file.downloadUrl && file.type === "file") {
    const link = document.createElement("a");
    link.href = file.downloadUrl;
    link.download = file.name;
    link.click();
  }
};

export const renderFilePreview = (file: FileItem) => {
  const { icon: IconComponent, color } = getFileIcon(file.mimeType, file.type);

  // For images, show the actual image preview
  if (file.mimeType?.startsWith("image/") && file.downloadUrl) {
    return (
      <div className="w-full h-32 rounded-t-lg overflow-hidden bg-muted/20">
        <img
          src={file.thumbnail || file.downloadUrl}
          alt={file.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to icon if image fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            target.parentElement!.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"></path></svg></div>`;
          }}
        />
      </div>
    );
  }

  // For PDFs, show a document preview icon with page indicator
  if (file.mimeType?.includes("pdf")) {
    return (
      <div className="w-full h-32 rounded-t-lg bg-red-50 border-b border-red-100 flex items-center justify-center relative">
        <FileText className="w-12 h-12 text-red-600" />
        <div className="absolute top-2 right-2 bg-red-600 text-white text-xs rounded px-2 py-1 font-medium">
          PDF
        </div>
      </div>
    );
  }

  // For videos, show a play icon
  if (file.mimeType?.startsWith("video/")) {
    return (
      <div className="w-full h-32 rounded-t-lg bg-orange-50 border-b border-orange-100 flex items-center justify-center relative">
        <Video className="w-12 h-12 text-orange-600" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white ml-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
    );
  }

  // For other file types, show colored icon backgrounds
  const getBackgroundColor = (mimeType?: string) => {
    if (mimeType?.includes("spreadsheet") || mimeType === "text/csv") {
      return "bg-emerald-50 border-b border-emerald-100";
    }
    if (mimeType?.startsWith("audio/")) {
      return "bg-purple-50 border-b border-purple-100";
    }
    if (mimeType?.includes("word")) {
      return "bg-blue-50 border-b border-blue-100";
    }
    return "bg-muted/50 border-b border-muted";
  };

  return (
    <div
      className={`w-full h-32 rounded-t-lg ${getBackgroundColor(
        file.mimeType
      )} flex items-center justify-center`}
    >
      <IconComponent className={`size-12 ${color}`} />
    </div>
  );
};