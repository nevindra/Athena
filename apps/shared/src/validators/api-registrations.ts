import { z } from "zod";

export const createApiRegistrationRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  configurationId: z.string().min(1, "Configuration is required"),
  systemPromptId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateApiRegistrationRequestSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters").optional(),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  configurationId: z.string().optional(),
  systemPromptId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateApiRegistrationRequest = z.infer<typeof createApiRegistrationRequestSchema>;
export type UpdateApiRegistrationRequest = z.infer<typeof updateApiRegistrationRequestSchema>;