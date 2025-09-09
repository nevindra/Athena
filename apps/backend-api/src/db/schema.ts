import type {
  AIProvider,
  JsonField,
  SystemPromptCategory,
} from "@athena/shared";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  json,
  pgTable,
  text,
  timestamp,
  vector,
} from "drizzle-orm/pg-core";
import { ulid } from "ulid";

// Message attachment type
export type MessageAttachment = {
  id: string; // ULID
  filename: string; // Original filename for display
  mimeType: string;
  size: number;
  path?: string; // Storage path (for new storage abstraction)
};

// Custom ID generators
const generateUlid = () => ulid();
const generateCuid = () => createId();

// Users table - using ULID
export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(generateUlid),
  email: text("email").unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// AI Configurations table - using ULID
export const aiConfigurations = pgTable(
  "ai_configurations",
  {
    id: text("id").primaryKey().$defaultFn(generateUlid),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    provider: text("provider").$type<AIProvider>().notNull(),
    settings: json("settings").notNull(), // Encrypted JSON
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("ai_configurations_user_id_idx").on(table.userId),
    providerIdx: index("ai_configurations_provider_idx").on(table.provider),
    activeIdx: index("ai_configurations_active_idx").on(table.isActive),
  })
);

// Chat Sessions table (for future use) - using CUID
export const chatSessions = pgTable(
  "chat_sessions",
  {
    id: text("id").primaryKey().$defaultFn(generateCuid),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    configurationId: text("configuration_id")
      .references(() => aiConfigurations.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("chat_sessions_user_id_idx").on(table.userId),
    configIdIdx: index("chat_sessions_config_id_idx").on(table.configurationId),
  })
);

// Chat Messages table (for future use with pgvector) - using CUID
export const chatMessages = pgTable(
  "chat_messages",
  {
    id: text("id").primaryKey().$defaultFn(generateCuid),
    sessionId: text("session_id")
      .references(() => chatSessions.id, { onDelete: "cascade" })
      .notNull(),
    role: text("role").notNull(), // "user" | "assistant" | "system"
    content: text("content").notNull(),
    attachments: json("attachments").$type<MessageAttachment[]>(), // File attachments
    embedding: vector("embedding", { dimensions: 1536 }), // For future semantic search
    metadata: json("metadata"), // Additional message metadata
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    sessionIdIdx: index("chat_messages_session_id_idx").on(table.sessionId),
    roleIdx: index("chat_messages_role_idx").on(table.role),
    embeddingIdx: index("chat_messages_embedding_idx").using(
      "hnsw",
      table.embedding.op("vector_cosine_ops")
    ),
  })
);

// System Prompts table - using ULID
export const systemPrompts = pgTable(
  "system_prompts",
  {
    id: text("id").primaryKey().$defaultFn(generateUlid),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    category: text("category").$type<SystemPromptCategory>().notNull(),
    content: text("content").notNull(),
    jsonSchema: json("json_schema").$type<JsonField[]>(),
    jsonDescription: text("json_description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("system_prompts_user_id_idx").on(table.userId),
    categoryIdx: index("system_prompts_category_idx").on(table.category),
    titleIdx: index("system_prompts_title_idx").on(table.title),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  aiConfigurations: many(aiConfigurations),
  chatSessions: many(chatSessions),
  systemPrompts: many(systemPrompts),
  knowledgeBases: many(knowledgeBases),
  files: many(files),
}));

export const aiConfigurationsRelations = relations(
  aiConfigurations,
  ({ one, many }) => ({
    user: one(users, {
      fields: [aiConfigurations.userId],
      references: [users.id],
    }),
    chatSessions: many(chatSessions),
  })
);

export const chatSessionsRelations = relations(
  chatSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [chatSessions.userId],
      references: [users.id],
    }),
    configuration: one(aiConfigurations, {
      fields: [chatSessions.configurationId],
      references: [aiConfigurations.id],
    }),
    messages: many(chatMessages),
  })
);

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

export const systemPromptsRelations = relations(systemPrompts, ({ one }) => ({
  user: one(users, {
    fields: [systemPrompts.userId],
    references: [users.id],
  }),
}));

// Knowledge Base table - using ULID
export const knowledgeBases = pgTable(
  "knowledge_bases",
  {
    id: text("id").primaryKey().$defaultFn(generateUlid),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    parentId: text("parent_id").references((): any => knowledgeBases.id, { onDelete: "cascade" }),
    path: text("path").notNull(), // Hierarchical path like /parent/child
    settings: json("settings").$type<{
      isPublic: boolean;
      allowedFileTypes: string[];
      maxFileSize: number;
    }>().default({
      isPublic: false,
      allowedFileTypes: ["*"],
      maxFileSize: 52428800 // 50MB
    }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("knowledge_bases_user_id_idx").on(table.userId),
    parentIdIdx: index("knowledge_bases_parent_id_idx").on(table.parentId),
    pathIdx: index("knowledge_bases_path_idx").on(table.path),
  })
);

// Files table - using ULID
export const files = pgTable(
  "files",
  {
    id: text("id").primaryKey().$defaultFn(generateUlid),
    userId: text("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    knowledgeBaseId: text("knowledge_base_id")
      .references(() => knowledgeBases.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references((): any => files.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    originalName: text("original_name").notNull(),
    mimeType: text("mime_type").notNull(),
    size: text("size").notNull(), // Store as string to handle large files
    path: text("path").notNull(), // MinIO object path
    thumbnailPath: text("thumbnail_path"), // Path to generated thumbnail
    category: text("category").notNull(), // "documents", "images", "audio", "videos", "knowledge-base"
    tags: json("tags").$type<string[]>().default([]),
    metadata: json("metadata").$type<{
      description?: string;
      extractedText?: string;
      dimensions?: { width: number; height: number };
      duration?: number;
      pageCount?: number;
    }>().default({}),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("files_user_id_idx").on(table.userId),
    knowledgeBaseIdIdx: index("files_knowledge_base_id_idx").on(table.knowledgeBaseId),
    folderIdIdx: index("files_folder_id_idx").on(table.folderId),
    categoryIdx: index("files_category_idx").on(table.category),
    isDeletedIdx: index("files_is_deleted_idx").on(table.isDeleted),
    pathIdx: index("files_path_idx").on(table.path),
  })
);

// Knowledge Base Relations
export const knowledgeBasesRelations = relations(knowledgeBases, ({ one, many }) => ({
  user: one(users, {
    fields: [knowledgeBases.userId],
    references: [users.id],
  }),
  parent: one(knowledgeBases, {
    fields: [knowledgeBases.parentId],
    references: [knowledgeBases.id],
    relationName: "knowledgeBaseHierarchy"
  }),
  children: many(knowledgeBases, {
    relationName: "knowledgeBaseHierarchy"
  }),
  files: many(files),
}));

// Files Relations
export const filesRelations = relations(files, ({ one, many }) => ({
  user: one(users, {
    fields: [files.userId],
    references: [users.id],
  }),
  knowledgeBase: one(knowledgeBases, {
    fields: [files.knowledgeBaseId],
    references: [knowledgeBases.id],
  }),
  parentFolder: one(files, {
    fields: [files.folderId],
    references: [files.id],
    relationName: "folderHierarchy"
  }),
  childFiles: many(files, {
    relationName: "folderHierarchy"
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AIConfigurationDB = typeof aiConfigurations.$inferSelect;
export type NewAIConfiguration = typeof aiConfigurations.$inferInsert;
export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;
export type SystemPromptDB = typeof systemPrompts.$inferSelect;
export type NewSystemPrompt = typeof systemPrompts.$inferInsert;
export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type NewKnowledgeBase = typeof knowledgeBases.$inferInsert;
export type FileDB = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
