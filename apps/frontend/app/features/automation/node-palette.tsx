"use client";

import { 
  Bot, 
  Clock, 
  Database, 
  GitBranch, 
  Mail, 
  Search, 
  Webhook, 
  Zap,
  Filter,
  RotateCcw,
  ArrowUpDown
} from "lucide-react";
import { useState } from "react";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Separator } from "~/components/ui/separator";

interface NodeType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: "trigger" | "action" | "logic" | "transform";
  dragType: string;
}

const nodeTypes: NodeType[] = [
  // Triggers
  {
    id: "http-trigger",
    name: "HTTP Request",
    description: "Trigger workflow with HTTP requests",
    icon: Webhook,
    category: "trigger",
    dragType: "trigger-http",
  },
  {
    id: "schedule-trigger",
    name: "Schedule",
    description: "Run workflow on a schedule",
    icon: Clock,
    category: "trigger",
    dragType: "trigger-schedule",
  },
  
  // Actions
  {
    id: "ai-chat",
    name: "AI Chat",
    description: "Send messages to AI models",
    icon: Bot,
    category: "action",
    dragType: "action-ai-chat",
  },
  {
    id: "send-email",
    name: "Send Email",
    description: "Send emails via SMTP",
    icon: Mail,
    category: "action",
    dragType: "action-send-email",
  },
  {
    id: "database-query",
    name: "Database Query",
    description: "Execute database queries",
    icon: Database,
    category: "action",
    dragType: "action-database",
  },
  
  // Logic
  {
    id: "if-condition",
    name: "IF Condition",
    description: "Execute conditional logic",
    icon: GitBranch,
    category: "logic",
    dragType: "logic-if",
  },
  {
    id: "switch",
    name: "Switch",
    description: "Route based on multiple conditions",
    icon: ArrowUpDown,
    category: "logic",
    dragType: "logic-switch",
  },
  
  // Transform
  {
    id: "filter-data",
    name: "Filter",
    description: "Filter data based on conditions",
    icon: Filter,
    category: "transform",
    dragType: "transform-filter",
  },
  {
    id: "transform-data",
    name: "Transform",
    description: "Transform and map data",
    icon: RotateCcw,
    category: "transform",
    dragType: "transform-map",
  },
];

const categories = {
  trigger: { name: "Triggers", color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
  action: { name: "Actions", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
  logic: { name: "Logic", color: "text-purple-600", bgColor: "bg-purple-50 border-purple-200" },
  transform: { name: "Transform", color: "text-orange-600", bgColor: "bg-orange-50 border-orange-200" },
};

interface NodePaletteProps {
  onNodeSelect: (nodeType: string | null) => void;
  selectedNodeType: string | null;
}

export function NodePalette({ onNodeSelect, selectedNodeType }: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNodes = nodeTypes.filter(node =>
    node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    node.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const nodesByCategory = filteredNodes.reduce((acc, node) => {
    if (!acc[node.category]) {
      acc[node.category] = [];
    }
    acc[node.category].push(node);
    return acc;
  }, {} as Record<string, NodeType[]>);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="size-5 text-primary" />
          <h2 className="font-semibold">Node Library</h2>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Node Categories */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-6">
          {Object.entries(nodesByCategory).map(([category, nodes]) => {
            const categoryConfig = categories[category as keyof typeof categories];
            
            return (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <h3 className={`text-sm font-medium ${categoryConfig.color}`}>
                    {categoryConfig.name}
                  </h3>
                  <Separator className="flex-1" />
                </div>
                
                <div className="space-y-2">
                  {nodes.map((node) => (
                    <div
                      key={node.id}
                      draggable
                      onDragStart={(event) => onDragStart(event, node.dragType)}
                      onClick={() => onNodeSelect(node.id)}
                      className={`
                        p-3 rounded-lg border-2 border-dashed cursor-move transition-all hover:shadow-sm
                        ${categoryConfig.bgColor}
                        ${selectedNodeType === node.id ? 'ring-2 ring-primary/50' : ''}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-1.5 rounded ${categoryConfig.color}`}>
                          <node.icon className="size-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-foreground">
                            {node.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {node.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}