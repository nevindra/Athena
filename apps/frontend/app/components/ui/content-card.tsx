"use client";
import { cn } from "~/lib/utils";
import { ReactNode } from "react";

export interface ContentCardProps {
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
  title?: string;
  description?: string;
  preview?: ReactNode;
  metadata?: string;
  badge?: string;
  hover?: boolean;
}

export function ContentCard({
  children,
  className,
  onClick,
  title,
  description,
  preview,
  metadata,
  badge,
  hover = true,
  ...props
}: ContentCardProps) {
  return (
    <div
      className={cn(
        "group/card relative overflow-hidden rounded-xl border bg-card transition-all",
        hover && "cursor-pointer hover:bg-accent/50 hover:shadow-sm",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {/* Preview Section */}
      {preview && (
        <div className="relative">
          {preview}
        </div>
      )}

      {/* Content Section */}
      <div className="p-4 space-y-2">
        {/* Title and Badge */}
        {(title || badge) && (
          <div className="flex items-start justify-between gap-2">
            {title && (
              <h3
                className={cn(
                  "font-medium text-sm truncate transition-colors",
                  hover && "group-hover/card:text-primary"
                )}
                title={title}
              >
                {title}
              </h3>
            )}
            {badge && (
              <span className="bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0">
                {badge}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        {/* Metadata */}
        {metadata && (
          <p className="text-xs text-muted-foreground">
            {metadata}
          </p>
        )}

        {/* Custom children content */}
        {children}
      </div>
    </div>
  );
}

// File-specific variant for our use case
export interface FileContentCardProps {
  fileName: string;
  fileSize?: string;
  fileType: string;
  timeAgo: string;
  preview: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function FileContentCard({
  fileName,
  fileSize,
  fileType,
  timeAgo,
  preview,
  onClick,
  className,
}: FileContentCardProps) {
  return (
    <ContentCard
      title={fileName}
      badge={fileType}
      metadata={`${fileSize} • ${timeAgo}`}
      preview={preview}
      onClick={onClick}
      className={className}
    />
  );
}
