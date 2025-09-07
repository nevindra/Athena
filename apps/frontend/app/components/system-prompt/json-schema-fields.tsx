import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";

interface JsonField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  required: boolean;
  children?: JsonField[];
  arrayItemType?: "string" | "number" | "boolean" | "object";
}

interface JsonSchemaFieldsProps {
  value: JsonField[];
  onChange: (fields: JsonField[]) => void;
}

export function JsonSchemaFields({ value, onChange }: JsonSchemaFieldsProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addField = (parentId?: string) => {
    const newField: JsonField = {
      id: generateId(),
      name: "",
      type: "string",
      required: true,
      description: "",
    };

    if (parentId) {
      const updateField = (fields: JsonField[]): JsonField[] => {
        return fields.map((field) => {
          if (field.id === parentId) {
            return {
              ...field,
              children: [...(field.children || []), newField],
            };
          }
          if (field.children) {
            return {
              ...field,
              children: updateField(field.children),
            };
          }
          return field;
        });
      };
      onChange(updateField(value));
    } else {
      onChange([...value, newField]);
    }
  };

  const removeField = (fieldId: string) => {
    const removeFromFields = (fields: JsonField[]): JsonField[] => {
      return fields
        .filter((field) => field.id !== fieldId)
        .map((field) => ({
          ...field,
          children: field.children
            ? removeFromFields(field.children)
            : undefined,
        }));
    };
    onChange(removeFromFields(value));
  };

  const updateField = (fieldId: string, updates: Partial<JsonField>) => {
    const updateInFields = (fields: JsonField[]): JsonField[] => {
      return fields.map((field) => {
        if (field.id === fieldId) {
          return { ...field, ...updates };
        }
        if (field.children) {
          return {
            ...field,
            children: updateInFields(field.children),
          };
        }
        return field;
      });
    };
    onChange(updateInFields(value));
  };

  const toggleExpanded = (fieldId: string) => {
    const newExpanded = new Set(expandedFields);
    if (newExpanded.has(fieldId)) {
      newExpanded.delete(fieldId);
    } else {
      newExpanded.add(fieldId);
    }
    setExpandedFields(newExpanded);
  };

  const renderField = (field: JsonField, depth = 0) => {
    const isExpanded = expandedFields.has(field.id);
    const hasChildren = field.type === "object";

    return (
      <div
        key={field.id}
        className="border rounded-lg p-4 space-y-4"
        style={{ marginLeft: `${depth * 16}px` }}
      >
        <div className="flex items-center gap-2">
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleExpanded(field.id)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}
          <div className="flex-1 grid grid-cols-12 gap-2 items-center">
            <div className="col-span-3">
              <Input
                placeholder="Field name"
                value={field.name}
                onChange={(e) =>
                  updateField(field.id, { name: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div className="col-span-2">
              <Select
                value={field.type}
                onValueChange={(type: any) => updateField(field.id, { type })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="boolean">Boolean</SelectItem>
                  <SelectItem value="object">Object</SelectItem>
                  <SelectItem value="array">Array</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {field.type === "array" && (
              <div className="col-span-2">
                <Select
                  value={field.arrayItemType || "string"}
                  onValueChange={(arrayItemType: any) =>
                    updateField(field.id, { arrayItemType })
                  }
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="string">String[]</SelectItem>
                    <SelectItem value="number">Number[]</SelectItem>
                    <SelectItem value="boolean">Boolean[]</SelectItem>
                    <SelectItem value="object">Object[]</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <div
              className={`${field.type === "array" ? "col-span-3" : "col-span-5"}`}
            >
              <Input
                placeholder="Description (optional)"
                value={field.description || ""}
                onChange={(e) =>
                  updateField(field.id, { description: e.target.value })
                }
                className="text-sm"
              />
            </div>
            <div className="col-span-1 flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.required}
                  onCheckedChange={(required) =>
                    updateField(field.id, { required })
                  }
                />
                <Label className="text-xs">Req</Label>
              </div>
            </div>
            <div className="col-span-1 flex gap-1">
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => addField(field.id)}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeField(field.id)}
                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        {hasChildren && isExpanded && field.children && (
          <div className="pl-4 space-y-2">
            {field.children.map((child) => renderField(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-medium">JSON Schema Fields</Label>
        <Button variant="outline" size="sm" onClick={() => addField()}>
          <Plus className="h-4 w-4 mr-1" />
          Add Field
        </Button>
      </div>

      {value.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <p className="text-sm">No fields defined yet</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => addField()}
            className="mt-2"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Your First Field
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {value.map((field) => renderField(field))}
        </div>
      )}
    </div>
  );
}
