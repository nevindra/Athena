import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch, ArrowUpDown, Settings } from "lucide-react";
import { Button } from "~/components/ui/button";

interface LogicNodeData {
  label: string;
  description: string;
  nodeType: string;
}

const getIcon = (nodeType: string) => {
  switch (nodeType) {
    case "logic-if":
      return GitBranch;
    case "logic-switch":
      return ArrowUpDown;
    default:
      return GitBranch;
  }
};

export function LogicNode({ data, selected }: NodeProps<LogicNodeData>) {
  const Icon = getIcon(data.nodeType);
  const isSwitch = data.nodeType === "logic-switch";

  return (
    <div className={`
      bg-card border-2 rounded-lg shadow-sm min-w-48
      ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-purple-200 hover:border-purple-300'}
    `}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-purple-500 border-2 border-white"
      />

      {/* Node Header */}
      <div className="bg-purple-50 border-b border-purple-200 px-3 py-2 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded text-purple-600">
              <Icon className="size-4" />
            </div>
            <span className="text-sm font-medium text-purple-800">{data.label}</span>
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
          {data.nodeType === "logic-if" && (
            <div className="text-xs">
              <span className="text-muted-foreground">Condition:</span>{" "}
              <span className="font-mono bg-muted px-1 rounded">value &gt; 10</span>
            </div>
          )}
          {data.nodeType === "logic-switch" && (
            <div className="text-xs">
              <span className="text-muted-foreground">Cases:</span>{" "}
              <span className="font-mono bg-muted px-1 rounded">3 branches</span>
            </div>
          )}
        </div>
      </div>

      {/* Output Handles */}
      {data.nodeType === "logic-if" ? (
        <>
          {/* True path */}
          <Handle
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "60%" }}
            className="w-3 h-3 bg-green-500 border-2 border-white"
          />
          {/* False path */}
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: "80%" }}
            className="w-3 h-3 bg-red-500 border-2 border-white"
          />
          
          {/* Labels for handles */}
          <div className="absolute right-4 text-xs text-muted-foreground">
            <div style={{ top: "58%" }} className="absolute">True</div>
            <div style={{ top: "78%" }} className="absolute">False</div>
          </div>
        </>
      ) : (
        <>
          {/* Multiple switch outputs */}
          <Handle
            type="source"
            position={Position.Right}
            id="case1"
            style={{ top: "50%" }}
            className="w-3 h-3 bg-purple-500 border-2 border-white"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="case2"
            style={{ top: "70%" }}
            className="w-3 h-3 bg-purple-500 border-2 border-white"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="default"
            style={{ top: "90%" }}
            className="w-3 h-3 bg-gray-500 border-2 border-white"
          />
        </>
      )}
    </div>
  );
}