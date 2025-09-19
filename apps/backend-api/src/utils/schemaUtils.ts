import type { JsonField } from "@athena/shared";
import { z } from "zod";

// Helper function to convert JsonField array to Zod schema
export function buildZodSchema(fields: JsonField[]): z.ZodObject<any> {
  const shape: Record<string, any> = {};

  for (const field of fields) {
    let zodType: any;

    switch (field.type) {
      case "string":
        zodType = z.string();
        if (field.description) {
          zodType = zodType.describe(field.description);
        }
        break;
      case "number":
        zodType = z.number();
        if (field.description) {
          zodType = zodType.describe(field.description);
        }
        break;
      case "boolean":
        zodType = z.boolean();
        if (field.description) {
          zodType = zodType.describe(field.description);
        }
        break;
      case "object":
        if (field.children && field.children.length > 0) {
          zodType = buildZodSchema(field.children);
        } else {
          zodType = z.object({});
        }
        if (field.description) {
          zodType = zodType.describe(field.description);
        }
        break;
      case "array":
        if (field.arrayItemType) {
          switch (field.arrayItemType) {
            case "string":
              zodType = z.array(z.string());
              break;
            case "number":
              zodType = z.array(z.number());
              break;
            case "boolean":
              zodType = z.array(z.boolean());
              break;
            case "object":
              if (field.children && field.children.length > 0) {
                zodType = z.array(buildZodSchema(field.children));
              } else {
                zodType = z.array(z.object({}));
              }
              break;
            default:
              zodType = z.array(z.string()); // Default to string array for safety
          }
        } else {
          zodType = z.array(z.string()); // Default to string array for safety
        }
        if (field.description) {
          zodType = zodType.describe(field.description);
        }
        break;
      default:
        console.warn(`Unknown field type: ${field.type}, defaulting to string`);
        zodType = z.string(); // Default to string for unknown types
    }

    if (field.required) {
      shape[field.name] = zodType;
    } else {
      shape[field.name] = zodType.optional();
    }
  }

  const schema = z.object(shape);
  return schema;
}

// Helper function to validate structured output against expected schema
export function validateStructuredOutput(
  object: any,
  jsonSchema: JsonField[]
): {
  missingFields: string[];
  extraFields: string[];
} {
  const expectedFields = jsonSchema
    .filter((f) => f.required)
    .map((f) => f.name);
  const actualFields = Object.keys(object);

  const missingFields = expectedFields.filter(
    (field) => !(field in object)
  );
  const extraFields = actualFields.filter(
    (field) => !jsonSchema.some((f) => f.name === field)
  );

  return { missingFields, extraFields };
}

// Helper function to format JSON output based on complexity
export function formatJsonOutput(object: any): string {
  const isSimpleObject =
    Object.keys(object).length <= 3 &&
    Object.values(object).every(
      (v) => typeof v !== "object" || v === null
    );

  return isSimpleObject
    ? JSON.stringify(object)
    : JSON.stringify(object, null, 2);
}