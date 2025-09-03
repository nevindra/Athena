import { useState } from "react";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "~/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { JsonSchemaBuilder } from "./json-schema-builder";

interface JsonField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  required: boolean;
  children?: JsonField[];
  arrayItemType?: "string" | "number" | "boolean" | "object";
}

interface SystemPrompt {
  id?: string;
  title: string;
  description: string;
  category: string;
  content: string;
  jsonSchema?: JsonField[];
  jsonDescription?: string;
}

interface SystemPromptFormProps {
  prompt?: SystemPrompt;
  onSave: (prompt: Omit<SystemPrompt, 'id'>) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const categories = [
  "Structured Output",
  "Topic Specific",
];

export function SystemPromptForm({ prompt, onSave, onCancel, isLoading }: SystemPromptFormProps) {
  const [formData, setFormData] = useState({
    title: prompt?.title || "",
    description: prompt?.description || "",
    category: prompt?.category || "",
    content: prompt?.content || "",
    jsonSchema: prompt?.jsonSchema || [],
    jsonDescription: prompt?.jsonDescription || "",
  });
  
  const [showPreview, setShowPreview] = useState(false);

  const generateSystemPrompt = (jsonDescription: string, jsonSchema: JsonField[]): string => {
    if (jsonSchema.length === 0) return "";
    
    const buildSchemaText = (fields: JsonField[], indent = 0): string => {
      return fields.map(field => {
        const prefix = "  ".repeat(indent);
        let fieldText = `${prefix}- ${field.name} (${field.type})${field.required ? " *required*" : ""}`;
        if (field.description) {
          fieldText += `: ${field.description}`;
        }
        if (field.type === "array" && field.arrayItemType) {
          fieldText += ` - Array of ${field.arrayItemType}`;
        }
        if (field.children && field.children.length > 0) {
          fieldText += "\n" + buildSchemaText(field.children, indent + 1);
        }
        return fieldText;
      }).join("\n");
    };

    return `You are a structured output generator that creates JSON responses following a specific schema.

Task: ${jsonDescription}

Required JSON Structure:
${buildSchemaText(jsonSchema)}

Instructions:
1. Always respond with valid JSON that matches the exact schema above
2. Include all required fields marked with *required*
3. Use appropriate data types for each field
4. Ensure nested objects and arrays follow the specified structure
5. Do not include any additional fields not defined in the schema
6. Do not include any text outside the JSON response

Generate responses that are accurate, complete, and follow the schema precisely.`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalContent = formData.content;
    
    // If structured output category and has JSON schema, generate system prompt
    if (formData.category === "Structured Output" && formData.jsonSchema.length > 0) {
      finalContent = generateSystemPrompt(formData.jsonDescription, formData.jsonSchema);
    }
    
    if (formData.title && formData.category && (finalContent || formData.jsonSchema.length > 0)) {
      onSave({
        ...formData,
        content: finalContent
      });
    }
  };

  const isValid = formData.title && formData.category && (
    formData.category === "Structured Output" 
      ? formData.jsonSchema.length > 0 && formData.jsonDescription
      : formData.content
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          {prompt ? "Edit System Prompt" : "Create System Prompt"}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prompt Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., JSON Response Generator"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of what this prompt does"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.category === "Structured Output" ? (
                <JsonSchemaBuilder
                  value={formData.jsonSchema}
                  onChange={(jsonSchema) => setFormData(prev => ({ ...prev, jsonSchema }))}
                  description={formData.jsonDescription}
                  onDescriptionChange={(jsonDescription) => setFormData(prev => ({ ...prev, jsonDescription }))}
                />
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="content">System Prompt *</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter your system prompt here..."
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    rows={8}
                    className="font-mono text-sm"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className="flex-1"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Saving..." : "Save Prompt"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {showPreview && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{formData.title || "Untitled"}</h3>
                    {formData.category && (
                      <Badge variant="secondary">{formData.category}</Badge>
                    )}
                  </div>
                  {formData.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {formData.description}
                    </p>
                  )}
                </div>

                <div className="bg-muted/50 rounded-md p-3">
                  <h4 className="text-sm font-medium mb-2">System Prompt:</h4>
                  <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                    {formData.category === "Structured Output" 
                      ? (formData.jsonSchema.length > 0 && formData.jsonDescription
                          ? generateSystemPrompt(formData.jsonDescription, formData.jsonSchema)
                          : "Configure JSON schema and description to generate system prompt...")
                      : (formData.content || "No content yet...")}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}