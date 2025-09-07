"use client";

import { 
  Play, 
  Save, 
  Settings, 
  Download, 
  Upload, 
  Trash2,
  Edit3
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

interface WorkflowToolbarProps {
  workflowName: string;
  onWorkflowNameChange: (name: string) => void;
}

export function WorkflowToolbar({ workflowName, onWorkflowNameChange }: WorkflowToolbarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState(workflowName);

  const handleSaveName = () => {
    onWorkflowNameChange(editingName);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setEditingName(workflowName);
      setIsEditing(false);
    }
  };

  const handleRunWorkflow = () => {
    console.log("Running workflow:", workflowName);
  };

  const handleSaveWorkflow = () => {
    console.log("Saving workflow:", workflowName);
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-card">
      {/* Left Section - Workflow Info */}
      <div className="flex items-center gap-4">
        {/* Workflow Name */}
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyPress}
              className="h-8 w-48"
              autoFocus
            />
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">{workflowName}</h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="p-1 h-auto"
              >
                <Edit3 className="size-3" />
              </Button>
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Status Badge */}
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">
          Draft
        </Badge>
      </div>

      {/* Right Section - Actions */}
      <div className="flex items-center gap-2">
        {/* Run Workflow */}
        <Button onClick={handleRunWorkflow} className="bg-green-600 hover:bg-green-700">
          <Play className="size-4 mr-2" />
          Test Workflow
        </Button>

        {/* Save */}
        <Button variant="outline" onClick={handleSaveWorkflow}>
          <Save className="size-4 mr-2" />
          Save
        </Button>

        {/* More Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Upload className="size-4 mr-2" />
              Import Workflow
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="size-4 mr-2" />
              Export Workflow
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="size-4 mr-2" />
              Workflow Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="size-4 mr-2" />
              Delete Workflow
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}