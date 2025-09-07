import { JsonSchemaFields } from "@/components/system-prompt/json-schema-fields";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";

interface JsonField {
  id: string;
  name: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
  required: boolean;
  children?: JsonField[];
  arrayItemType?: "string" | "number" | "boolean" | "object";
}

interface JsonSchemaBuilderProps {
  value: JsonField[];
  onChange: (fields: JsonField[]) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
}

export function JsonSchemaBuilder({
  value,
  onChange,
  description,
  onDescriptionChange,
}: JsonSchemaBuilderProps) {
  const generateJsonSchema = (): string => {
    const buildSchema = (fields: JsonField[]) => {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      fields.forEach((field) => {
        if (!field.name) return;

        if (field.required) {
          required.push(field.name);
        }

        let fieldSchema: any = {
          type: field.type,
          ...(field.description && { description: field.description }),
        };

        if (field.type === "object" && field.children) {
          const childSchema = buildSchema(field.children);
          fieldSchema = {
            type: "object",
            properties: childSchema.properties,
            required: childSchema.required,
            ...(field.description && { description: field.description }),
          };
        } else if (field.type === "array") {
          fieldSchema = {
            type: "array",
            items: {
              type: field.arrayItemType || "string",
            },
            ...(field.description && { description: field.description }),
          };
        }

        properties[field.name] = fieldSchema;
      });

      return { properties, required };
    };

    const schema = buildSchema(value);
    const fullSchema = {
      type: "object",
      properties: schema.properties,
      required: schema.required,
      ...(description && { description }),
    };

    return JSON.stringify(fullSchema, null, 2);
  };

  const generateNormalizedJsonSchema = (): string => {
    const buildNormalizedSchema = (
      fields: JsonField[]
    ): Record<string, any> => {
      const result: Record<string, any> = {};

      fields.forEach((field) => {
        if (!field.name) return;

        if (field.type === "object" && field.children) {
          result[field.name] = buildNormalizedSchema(field.children);
        } else if (field.type === "array") {
          const itemType = field.arrayItemType || "string";
          if (itemType === "object") {
            result[field.name] = [];
          } else {
            result[field.name] = [];
          }
        } else if (field.type === "string") {
          result[field.name] = "";
        } else if (field.type === "number") {
          result[field.name] = 0;
        } else if (field.type === "boolean") {
          result[field.name] = false;
        }
      });

      return result;
    };

    const normalizedSchema = buildNormalizedSchema(value);
    return JSON.stringify(normalizedSchema, null, 2);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="json-description">JSON Structure Description</Label>
        <Textarea
          id="json-description"
          placeholder="Describe what data structure you want to generate (e.g., 'User profile with contact information and preferences')"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          rows={2}
        />
      </div>

      <Card>
        <CardContent className="pt-6">
          <JsonSchemaFields value={value} onChange={onChange} />
        </CardContent>
      </Card>

      {value.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">
                Normalized JSON Schema Preview
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Backend-friendly format
              </p>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64 font-mono">
                {generateNormalizedJsonSchema()}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">JSON Schema Preview</CardTitle>
              <p className="text-xs text-muted-foreground">
                Technical schema format
              </p>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64 font-mono">
                {generateJsonSchema()}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
