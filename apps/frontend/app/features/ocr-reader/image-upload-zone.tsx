"use client";

import { Image, Upload, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";

interface ImageUploadZoneProps {
  onImageUpload: (file: File) => void;
  isProcessing?: boolean;
}

interface UploadingImage {
  file: File;
  preview: string;
  progress: number;
}

const ACCEPTED_IMAGE_TYPES = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function ImageUploadZone({ onImageUpload, isProcessing = false }: ImageUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImage, setUploadingImage] = useState<UploadingImage | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      alert(`File ${file.name} is too large. Maximum size is 10MB.`);
      return false;
    }

    const acceptedTypes = Object.keys(ACCEPTED_IMAGE_TYPES);
    const acceptedExtensions = Object.values(ACCEPTED_IMAGE_TYPES).flat();

    const isValidType = acceptedTypes.some((type) => file.type === type);
    const isValidExtension = acceptedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext.toLowerCase())
    );

    if (!isValidType && !isValidExtension) {
      alert(`File type not supported: ${file.name}. Please upload an image file.`);
      return false;
    }

    return true;
  };

  const simulateUpload = (file: File): Promise<void> => {
    return new Promise((resolve) => {
      const preview = URL.createObjectURL(file);
      const uploadingImageData: UploadingImage = { file, preview, progress: 0 };

      setUploadingImage(uploadingImageData);

      const interval = setInterval(() => {
        setUploadingImage((prev) =>
          prev ? { ...prev, progress: Math.min(prev.progress + Math.random() * 25, 100) } : null
        );
      }, 150);

      setTimeout(() => {
        clearInterval(interval);
        setUploadingImage(null);
        setUploadedImage(preview);
        resolve();
      }, 1500);
    });
  };

  const handleImageUpload = async (file: File) => {
    if (!validateFile(file)) return;

    // Simulate upload progress
    await simulateUpload(file);

    // Call the parent handler
    onImageUpload(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleImageUpload(imageFile);
    } else if (files.length > 0) {
      alert('Please drop an image file (PNG, JPG, GIF, WebP)');
    }
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
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    e.target.value = ""; // Reset input
  };

  const clearImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage);
    }
    setUploadedImage(null);
  };

  // Show uploaded image preview
  if (uploadedImage && !isProcessing) {
    return (
      <div className="space-y-4">
        <div className="border rounded-lg p-4 bg-card">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={uploadedImage}
                alt="Uploaded image"
                className="w-24 h-24 object-cover rounded-lg border"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-card-foreground">
                  Image uploaded successfully
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearImage}
                  className="shrink-0"
                >
                  <X className="size-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Ready for OCR processing
              </p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => document.getElementById("image-upload")?.click()}
          >
            Upload Different Image
          </Button>
        </div>

        <input
          id="image-upload"
          type="file"
          accept={Object.keys(ACCEPTED_IMAGE_TYPES).join(",")}
          className="hidden"
          onChange={handleFileInput}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all",
          "hover:border-primary/50 hover:bg-accent/50",
          isDragging && "border-primary bg-primary/10",
          isProcessing && "opacity-50 pointer-events-none"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto mb-4 size-8 text-muted-foreground" />
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {isDragging ? "Drop image here" : "Drag and drop an image here"}
          </p>
          <p className="text-sm text-muted-foreground">
            or{" "}
            <Button
              variant="link"
              className="p-0 h-auto text-primary"
              onClick={() => document.getElementById("image-upload")?.click()}
              disabled={isProcessing}
            >
              browse for image
            </Button>
          </p>
          <p className="text-xs text-muted-foreground">
            Supports: PNG, JPG, GIF, WebP
          </p>
          <p className="text-xs text-muted-foreground">
            Maximum file size: 10MB
          </p>
        </div>
        <input
          id="image-upload"
          type="file"
          accept={Object.keys(ACCEPTED_IMAGE_TYPES).join(",")}
          className="hidden"
          onChange={handleFileInput}
          disabled={isProcessing}
        />
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Processing image with OCR...</span>
          </div>
        </div>
      )}

      {/* Uploading Progress */}
      {uploadingImage && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Uploading image...</p>
          <div className="flex items-center gap-3 p-3 border rounded-lg bg-card">
            <Image className="size-5 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium truncate">
                  {uploadingImage.file.name}
                </p>
                <span className="text-xs text-muted-foreground">
                  {formatFileSize(uploadingImage.file.size)}
                </span>
              </div>
              <Progress value={uploadingImage.progress} className="h-1" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}