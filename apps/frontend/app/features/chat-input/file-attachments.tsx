import { Paperclip, X } from "lucide-react";
import { Button } from "~/components/ui/button";

interface FileAttachmentsProps {
  files: File[];
  onRemoveFile: (index: number) => void;
}

export function FileAttachments({ files, onRemoveFile }: FileAttachmentsProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 flex flex-wrap gap-2">
      {files.map((file, index) => (
        <div
          key={index}
          className="flex items-center gap-2 bg-muted/50 backdrop-blur-sm px-3 py-2 rounded-lg text-sm border border-border/20 shadow-sm"
        >
          <Paperclip className="h-3 w-3 text-muted-foreground" />
          <span className="truncate max-w-32 font-medium">{file.name}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemoveFile(index)}
            className="h-4 w-4 p-0 hover:bg-destructive/20 rounded-full"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}