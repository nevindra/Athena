"use client";

import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useMemo } from "react";
import { TriggerNode } from "./node-types/trigger-node";
import { ActionNode } from "./node-types/action-node";
import { LogicNode } from "./node-types/logic-node";

const initialNodes: Node[] = [
  {
    id: "start",
    type: "trigger",
    position: { x: 100, y: 100 },
    data: {
      label: "HTTP Trigger",
      description: "Receives HTTP requests",
      nodeType: "http-request",
    },
  },
];

const initialEdges: Edge[] = [];

interface WorkflowCanvasProps {
  selectedNodeType: string | null;
}

export function WorkflowCanvas(_: WorkflowCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const nodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      action: ActionNode,
      logic: LogicNode,
    }),
    []
  );

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const reactFlowBounds = event.currentTarget.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type: type.split("-")[0], // e.g., "trigger-http" -> "trigger"
        position,
        data: {
          label: type
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" "),
          nodeType: type,
          description: `${type} node`,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        fitView
        className="bg-background"
      >
        <Controls className="bg-card border border-border rounded-lg shadow-sm" />
        <MiniMap 
          className="bg-card border border-border rounded-lg shadow-sm"
          nodeColor="#94a3b8"
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Background 
          variant="dots"
          gap={20}
          size={1}
          className="opacity-30"
        />
      </ReactFlow>
    </div>
  );
}