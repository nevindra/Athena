import { z } from "zod";

// JSON field validation schema with recursive structure
export const jsonFieldSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(1, "Field ID is required"),
    name: z.string().min(1, "Field name is required"),
    type: z.enum(["string", "number", "boolean", "object", "array"]),
    description: z.string().optional(),
    required: z.boolean(),
    children: z.array(jsonFieldSchema).optional(),
    arrayItemType: z.enum(["string", "number", "boolean", "object"]).optional(),
  })
);

// System prompt categories
export const systemPromptCategorySchema = z.enum(["Structured Output", "Topic Specific", "Custom"]);

// Create system prompt request validation
export const createSystemPromptRequestSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .default(""),
  category: systemPromptCategorySchema,
  content: z.string()
    .min(1, "Content is required")
    .max(10000, "Content must be less than 10,000 characters"),
  jsonSchema: z.array(jsonFieldSchema).optional(),
  jsonDescription: z.string()
    .max(1000, "JSON description must be less than 1,000 characters")
    .optional(),
}).refine(
  (data) => {
    // If category is "Structured Output", require jsonSchema and jsonDescription
    if (data.category === "Structured Output") {
      return data.jsonSchema && data.jsonSchema.length > 0 && data.jsonDescription;
    }
    return true;
  },
  {
    message: "Structured Output category requires JSON schema and description",
    path: ["jsonSchema"],
  }
);

// Update system prompt request validation
export const updateSystemPromptRequestSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .optional(),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  category: systemPromptCategorySchema.optional(),
  content: z.string()
    .min(1, "Content is required")
    .max(10000, "Content must be less than 10,000 characters")
    .optional(),
  jsonSchema: z.array(jsonFieldSchema).optional(),
  jsonDescription: z.string()
    .max(1000, "JSON description must be less than 1,000 characters")
    .optional(),
});

// System prompt ID validation
export const systemPromptIdSchema = z.string().min(1, "System prompt ID is required");

// Type exports
export type CreateSystemPromptRequest = z.infer<typeof createSystemPromptRequestSchema>;
export type UpdateSystemPromptRequest = z.infer<typeof updateSystemPromptRequestSchema>;
export type JsonField = z.infer<typeof jsonFieldSchema>;
export type SystemPromptCategory = z.infer<typeof systemPromptCategorySchema>;