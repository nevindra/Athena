"use client";

import { useState } from "react";
import { NodePalette } from "./node-palette";
import { WorkflowCanvas } from "./workflow-canvas";
import { WorkflowToolbar } from "./workflow-toolbar";

export function WorkflowBuilder() {
  const [selectedNodeType, setSelectedNodeType] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("New Workflow");

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Node Palette Sidebar */}
      <div className="w-80 border-r border-border/50 bg-card">
        <NodePalette 
          onNodeSelect={setSelectedNodeType}
          selectedNodeType={selectedNodeType}
        />
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Workflow Toolbar */}
        <div className="border-b border-border/50">
          <WorkflowToolbar 
            workflowName={workflowName}
            onWorkflowNameChange={setWorkflowName}
          />
        </div>

        {/* Workflow Canvas */}
        <div className="flex-1 relative">
          <WorkflowCanvas selectedNodeType={selectedNodeType} />
        </div>
      </div>
    </div>
  );
}