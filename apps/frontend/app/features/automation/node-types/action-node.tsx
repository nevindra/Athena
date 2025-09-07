import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, Mail, Database, Settings } from "lucide-react";
import { Button } from "~/components/ui/button";

interface ActionNodeData {
  label: string;
  description: string;
  nodeType: string;
}

const getIcon = (nodeType: string) => {
  switch (nodeType) {
    case "action-ai-chat":
      return Bot;
    case "action-send-email":
      return Mail;
    case "action-database":
      return Database;
    default:
      return Bot;
  }
};

export function ActionNode({ data, selected }: NodeProps<ActionNodeData>) {
  const Icon = getIcon(data.nodeType);

  return (
    <div className={`
      bg-card border-2 rounded-lg shadow-sm min-w-48
      ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-blue-200 hover:border-blue-300'}
    `}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />

      {/* Node Header */}
      <div className="bg-blue-50 border-b border-blue-200 px-3 py-2 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded text-blue-600">
              <Icon className="size-4" />
            </div>
            <span className="text-sm font-medium text-blue-800">{data.label}</span>
          </div>
          <Button variant="ghost" size="sm" className="p-1 h-auto">
            <Settings className="size-3" />
          </Button>
        </div>
      </div>

      {/* Node Content */}
      <div className="p-3">
        <p className="text-xs text-muted-foreground mb-2">{data.description}</p>
        
        {/* Node Configuration Preview */}
        <div className="space-y-1">
          {data.nodeType === "action-ai-chat" && (
            <div className="text-xs">
              <span className="text-muted-foreground">Model:</span>{" "}
              <span className="font-mono bg-muted px-1 rounded">GPT-4</span>
            </div>
          )}
          {data.nodeType === "action-send-email" && (
            <div className="text-xs">
              <span className="text-muted-foreground">To:</span>{" "}
              <span className="font-mono bg-muted px-1 rounded">user@example.com</span>
            </div>
          )}
          {data.nodeType === "action-database" && (
            <div className="text-xs">
              <span className="text-muted-foreground">Query:</span>{" "}
              <span className="font-mono bg-muted px-1 rounded">SELECT *</span>
            </div>
          )}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-blue-500 border-2 border-white"
      />
    </div>
  );
}