import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Webhook, Clock, Settings } from "lucide-react";
import { Button } from "~/components/ui/button";

interface TriggerNodeData {
  label: string;
  description: string;
  nodeType: string;
}

const getIcon = (nodeType: string) => {
  switch (nodeType) {
    case "trigger-http":
      return Webhook;
    case "trigger-schedule":
      return Clock;
    default:
      return Webhook;
  }
};

export function TriggerNode({ data, selected }: NodeProps<TriggerNodeData>) {
  const Icon = getIcon(data.nodeType);

  return (
    <div className={`
      bg-card border-2 rounded-lg shadow-sm min-w-48
      ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-green-200 hover:border-green-300'}
    `}>
      {/* Node Header */}
      <div className="bg-green-50 border-b border-green-200 px-3 py-2 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded text-green-600">
              <Icon className="size-4" />
            </div>
            <span className="text-sm font-medium text-green-800">{data.label}</span>
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
          {data.nodeType === "trigger-http" && (
            <div className="text-xs">
              <span className="text-muted-foreground">Method:</span>{" "}
              <span className="font-mono bg-muted px-1 rounded">POST</span>
            </div>
          )}
          {data.nodeType === "trigger-schedule" && (
            <div className="text-xs">
              <span className="text-muted-foreground">Schedule:</span>{" "}
              <span className="font-mono bg-muted px-1 rounded">Every 5 min</span>
            </div>
          )}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-green-500 border-2 border-white"
      />
    </div>
  );
}