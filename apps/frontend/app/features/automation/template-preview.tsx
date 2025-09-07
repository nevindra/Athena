"use client";

import {
  Background,
  MiniMap,
  ReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Brain,
  Target,
  FileCheck,
  Link,
  Calendar,
  Briefcase,
  Download,
  Star,
  Clock,
  User,
  Activity,
  X,
  ExternalLink
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";
import { TriggerNode } from "./node-types/trigger-node";
import { ActionNode } from "./node-types/action-node";
import { LogicNode } from "./node-types/logic-node";
import type { WorkflowTemplate } from "./types";

interface TemplatePreviewProps {
  template: WorkflowTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (template: WorkflowTemplate) => void;
}

const categoryIcons = {
  "ai-data": Brain,
  "marketing": Target,
  "document-ops": FileCheck,
  "integrations": Link,
  "productivity": Calendar,
  "ecommerce": Briefcase,
};

const complexityColors = {
  "Beginner": "bg-green-100 text-green-800 border-green-300",
  "Intermediate": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Advanced": "bg-red-100 text-red-800 border-red-300",
};

export function TemplatePreview({ template, open, onOpenChange, onUseTemplate }: TemplatePreviewProps) {
  const CategoryIcon = categoryIcons[template.category];
  const complexityColorClass = complexityColors[template.complexity];

  const nodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      action: ActionNode,
      logic: LogicNode,
    }),
    []
  );

  const formatUsageCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleUseTemplate = () => {
    onUseTemplate(template);
    onOpenChange(false);
  };

  const handleOpenInBuilder = () => {
    // TODO: Implement navigation to workflow builder with template data
    console.log("Opening template in workflow builder:", template.name);
    window.open('/automation/workflows', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-muted/50">
                  <CategoryIcon className="size-6" />
                </div>
                <div className="flex items-center gap-2">
                  {template.featured && (
                    <Star className="size-4 text-yellow-500 fill-yellow-500" />
                  )}
                  <Badge variant="outline" className={`${complexityColorClass}`}>
                    {template.complexity}
                  </Badge>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="size-3 mr-1" />
                    {template.rating}
                  </div>
                </div>
              </div>
              
              <DialogTitle className="text-2xl font-bold mb-2">
                {template.name}
              </DialogTitle>
              <DialogDescription className="text-base">
                {template.longDescription || template.description}
              </DialogDescription>
            </div>
            
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="size-4" />
            </Button>
          </div>

          {/* Template Stats */}
          <div className="grid grid-cols-4 gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="size-4" />
              <span>{template.nodeCount} nodes</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" />
              <span>{template.estimatedSetupTime}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Download className="size-4" />
              <span>{formatUsageCount(template.usageCount)} uses</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="size-4" />
              <span>{template.author}</span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex min-h-0">
          {/* Workflow Preview */}
          <div className="flex-1 border-r">
            <div className="h-full bg-background">
              <ReactFlow
                nodes={template.workflow.nodes as Node[]}
                edges={template.workflow.edges as Edge[]}
                nodeTypes={nodeTypes}
                fitView
                attributionPosition="bottom-left"
                proOptions={{ hideAttribution: true }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                className="bg-background"
              >
                <Background
                  variant="dots"
                  gap={20}
                  size={1}
                  className="opacity-30"
                />
                <MiniMap
                  className="bg-card border border-border rounded-lg shadow-sm"
                  nodeColor="#94a3b8"
                  maskColor="rgba(0, 0, 0, 0.1)"
                />
              </ReactFlow>
            </div>
          </div>

          {/* Template Details Sidebar */}
          <div className="w-80 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold mb-2">Template Details</h3>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Tags */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {template.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Workflow Structure */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Workflow Structure</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {template.workflow.nodes.map((node, index) => (
                      <div key={node.id} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-muted" />
                        <span>{node.data.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Setup Requirements */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Setup Requirements</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div>• Configure API connections</div>
                    <div>• Set up trigger conditions</div>
                    <div>• Test workflow execution</div>
                    <div>• Deploy and monitor</div>
                  </div>
                </div>

                <Separator />

                {/* Template Info */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Template Info</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{template.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Updated:</span>
                      <span>{template.updatedAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Category:</span>
                      <span className="capitalize">
                        {template.category.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 flex justify-between">
          <Button variant="outline" onClick={handleOpenInBuilder}>
            <ExternalLink className="size-4 mr-2" />
            Open in Builder
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUseTemplate}>
              <Download className="size-4 mr-2" />
              Use This Template
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}