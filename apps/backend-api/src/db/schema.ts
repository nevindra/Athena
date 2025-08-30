import { pgTable, text, timestamp, boolean, json, index, vector } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { ulid } from "ulid";
import { createId } from "@paralleldrive/cuid2";
import type { AIProvider } from "@athena/shared";

// Message attachment type
export type MessageAttachment = {
  id: string; // ULID
  filename: string; // Original filename for display
  mimeType: string;
  size: number;
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
export const aiConfigurations = pgTable("ai_configurations", {
  id: text("id").primaryKey().$defaultFn(generateUlid),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  provider: text("provider").$type<AIProvider>().notNull(),
  settings: json("settings").notNull(), // Encrypted JSON
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("ai_configurations_user_id_idx").on(table.userId),
  providerIdx: index("ai_configurations_provider_idx").on(table.provider),
  activeIdx: index("ai_configurations_active_idx").on(table.isActive),
}));

// Chat Sessions table (for future use) - using CUID
export const chatSessions = pgTable("chat_sessions", {
  id: text("id").primaryKey().$defaultFn(generateCuid),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  configurationId: text("configuration_id").references(() => aiConfigurations.id, { onDelete: "cascade" }).notNull(),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index("chat_sessions_user_id_idx").on(table.userId),
  configIdIdx: index("chat_sessions_config_id_idx").on(table.configurationId),
}));

// Chat Messages table (for future use with pgvector) - using CUID
export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey().$defaultFn(generateCuid),
  sessionId: text("session_id").references(() => chatSessions.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull(), // "user" | "assistant" | "system"
  content: text("content").notNull(),
  attachments: json("attachments").$type<MessageAttachment[]>(), // File attachments
  embedding: vector("embedding", { dimensions: 1536 }), // For future semantic search
  metadata: json("metadata"), // Additional message metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index("chat_messages_session_id_idx").on(table.sessionId),
  roleIdx: index("chat_messages_role_idx").on(table.role),
  embeddingIdx: index("chat_messages_embedding_idx").using("hnsw", table.embedding.op("vector_cosine_ops")),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  aiConfigurations: many(aiConfigurations),
  chatSessions: many(chatSessions),
}));

export const aiConfigurationsRelations = relations(aiConfigurations, ({ one, many }) => ({
  user: one(users, {
    fields: [aiConfigurations.userId],
    references: [users.id],
  }),
  chatSessions: many(chatSessions),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  configuration: one(aiConfigurations, {
    fields: [chatSessions.configurationId],
    references: [aiConfigurations.id],
  }),
  messages: many(chatMessages),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
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