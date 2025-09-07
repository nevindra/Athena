"use client";

import { FolderPlus } from "lucide-react";
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

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFolder: (name: string) => void;
}

export function CreateFolderDialog({
  open,
  onOpenChange,
  onCreateFolder,
}: CreateFolderDialogProps) {
  const [folderName, setFolderName] = useState("");

  const handleCreate = () => {
    if (!folderName.trim()) return;
    onCreateFolder(folderName.trim());
    onOpenChange(false);
    setFolderName("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setFolderName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="size-5" />
            New Knowledge Base
          </DialogTitle>
          <DialogDescription>
            Enter a name for the new knowledge base
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="folder-name">Knowledge Base Name</Label>
          <Input
            id="folder-name"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleCreate();
              } else if (e.key === "Escape") {
                onOpenChange(false);
              }
            }}
            placeholder="Enter knowledge base name"
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!folderName.trim()}>
            Create Knowledge Base
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
