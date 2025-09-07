export type TemplateCategory = 
  | "ai-data"
  | "marketing" 
  | "document-ops"
  | "integrations"
  | "productivity"
  | "ecommerce";

export type TemplateComplexity = "Beginner" | "Intermediate" | "Advanced";

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    nodeType: string;
    description: string;
    parameters?: Record<string, any>;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface WorkflowData {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: {
    x: number;
    y: number;
    zoom: number;
  };
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  longDescription?: string;
  category: TemplateCategory;
  complexity: TemplateComplexity;
  author: string;
  nodeCount: number;
  estimatedSetupTime: string;
  tags: string[];
  workflow: WorkflowData;
  thumbnailUrl?: string;
  featured: boolean;
  usageCount: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TemplateCategoryInfo {
  id: TemplateCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
}