import { Elysia, t } from "elysia";
import { systemPromptController } from "../controllers/systemPromptController";
import { 
  createSystemPromptRequestSchema, 
  updateSystemPromptRequestSchema,
  systemPromptCategorySchema
} from "@athena/shared";

export const systemPromptsRoutes = new Elysia({ prefix: "/system-prompts" })
  // Get all system prompts for a user
  .get("/", async ({ query }) => {
    const userId = query.userId;
    
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    await systemPromptController.ensureUser(userId);
    return systemPromptController.getSystemPrompts(userId);
  }, {
    query: t.Object({
      userId: t.String(),
    }),
  })

  // Get specific system prompt
  .get("/:id", async ({ params, query }) => {
    const userId = query.userId;
    const promptId = params.id;
    
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    return systemPromptController.getSystemPrompt(userId, promptId);
  }, {
    params: t.Object({
      id: t.String(),
    }),
    query: t.Object({
      userId: t.String(),
    }),
  })

  // Create new system prompt
  .post("/", async ({ body, query }) => {
    const userId = query.userId;
    
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    // Validate request body
    const validation = createSystemPromptRequestSchema.safeParse(body);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid request data",
        details: validation.error.issues,
      };
    }

    await systemPromptController.ensureUser(userId);
    return systemPromptController.createSystemPrompt(userId, validation.data);
  }, {
    body: t.Object({
      title: t.String(),
      description: t.Optional(t.String()),
      category: t.Union([
        t.Literal("Structured Output"), 
        t.Literal("Topic Specific"), 
        t.Literal("Custom")
      ]),
      content: t.String(),
      jsonSchema: t.Optional(t.Any()),
      jsonDescription: t.Optional(t.String()),
    }),
    query: t.Object({
      userId: t.String(),
    }),
  })

  // Update system prompt
  .put("/:id", async ({ params, body, query }) => {
    const userId = query.userId as string;
    const promptId = params.id;
    
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    // Validate request body
    const validation = updateSystemPromptRequestSchema.safeParse(body);
    if (!validation.success) {
      return {
        success: false,
        error: "Invalid request data",
        details: validation.error.issues,
      };
    }

    return systemPromptController.updateSystemPrompt(userId, promptId, validation.data);
  }, {
    params: t.Object({
      id: t.String(),
    }),
    body: t.Object({
      title: t.Optional(t.String()),
      description: t.Optional(t.String()),
      category: t.Optional(t.Union([
        t.Literal("Structured Output"), 
        t.Literal("Topic Specific"), 
        t.Literal("Custom")
      ])),
      content: t.Optional(t.String()),
      jsonSchema: t.Optional(t.Any()),
      jsonDescription: t.Optional(t.String()),
    }),
    query: t.Object({
      userId: t.String(),
    }),
  })

  // Delete system prompt
  .delete("/:id", async ({ params, query }) => {
    const userId = query.userId as string;
    const promptId = params.id;
    
    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    return systemPromptController.deleteSystemPrompt(userId, promptId);
  }, {
    params: t.Object({
      id: t.String(),
    }),
    query: t.Object({
      userId: t.String(),
    }),
  });