"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { FileItem } from "./file-manager";

interface FileActionsProps {
  file: FileItem | null;
  onClose: () => void;
  onRename: (newName: string) => void;
}

export function FileActions({ file, onClose, onRename }: FileActionsProps) {
  const [newName, setNewName] = useState("");

  const handleRename = () => {
    if (!newName.trim()) return;
    onRename(newName.trim());
    onClose();
    setNewName("");
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
      setNewName("");
    } else if (file) {
      // Remove file extension for renaming
      const nameWithoutExt =
        file.type === "file" && file.name.includes(".")
          ? file.name.substring(0, file.name.lastIndexOf("."))
          : file.name;
      setNewName(nameWithoutExt);
    }
  };

  const getFileExtension = (fileName: string): string => {
    const lastDot = fileName.lastIndexOf(".");
    return lastDot > 0 ? fileName.substring(lastDot) : "";
  };

  if (!file) return null;

  const fileExtension = file.type === "file" ? getFileExtension(file.name) : "";

  return (
    <Dialog open={!!file} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Rename {file.type === "folder" ? "Folder" : "File"}
          </DialogTitle>
          <DialogDescription>
            Enter a new name for "{file.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <div className="flex items-center gap-2">
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleRename();
                } else if (e.key === "Escape") {
                  onClose();
                }
              }}
              placeholder={`Enter ${file.type} name`}
              autoFocus
            />
            {fileExtension && (
              <span className="text-sm text-muted-foreground shrink-0">
                {fileExtension}
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={!newName.trim()}>
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
