// JSON field structure for system prompts
export interface JsonField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  required: boolean;
  children?: JsonField[];
  arrayItemType?: "string" | "number" | "boolean" | "object";
}

// Base system prompt interface
export interface BaseSystemPrompt {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  content: string;
  jsonSchema?: JsonField[];
  jsonDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// System prompt from database (with string dates)
export interface SystemPromptDB {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  content: string;
  jsonSchema: JsonField[] | null;
  jsonDescription: string | null;
  createdAt: string;
  updatedAt: string;
}

// System prompt for API responses (with Date objects)
export interface SystemPrompt {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  content: string;
  jsonSchema?: JsonField[];
  jsonDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request types for creating system prompts
export interface CreateSystemPromptRequest {
  title: string;
  description: string;
  category: string;
  content: string;
  jsonSchema?: JsonField[];
  jsonDescription?: string;
}

// Request types for updating system prompts
export interface UpdateSystemPromptRequest {
  title?: string;
  description?: string;
  category?: string;
  content?: string;
  jsonSchema?: JsonField[];
  jsonDescription?: string;
}

// System prompt categories
export type SystemPromptCategory = "Structured Output" | "Topic Specific" | "Custom";

export const SYSTEM_PROMPT_CATEGORIES: SystemPromptCategory[] = [
  "Structured Output",
  "Topic Specific", 
  "Custom"
];