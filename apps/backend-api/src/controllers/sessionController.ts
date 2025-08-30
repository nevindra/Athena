import { db } from "../db";
import { chatSessions, chatMessages, type MessageAttachment } from "../db/schema";
import { eq, desc } from "drizzle-orm";
import { ulid } from "ulid";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export interface CreateSessionRequest {
  userId: string;
  configurationId: string;
  initialMessage?: string;
  title?: string;
}

export interface AddMessageRequest {
  role: "user" | "assistant" | "system";
  content: string;
  files?: File[];
}

export async function handleCreateSession(request: CreateSessionRequest) {
  const { userId, configurationId, initialMessage, title } = request;

  // Create the session
  const [session] = await db.insert(chatSessions).values({
    userId,
    configurationId,
    title: title || generateSessionTitle(initialMessage),
  }).returning();

  // Add initial message if provided
  if (initialMessage) {
    await db.insert(chatMessages).values({
      sessionId: session.id,
      role: "user",
      content: initialMessage,
    });
  }

  return session;
}

export async function handleGetSession(sessionId: string) {
  // Get session details
  const [session] = await db.select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Session not found");
  }

  // Get all messages for this session
  const messages = await db.select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt);

  return {
    ...session,
    messages,
  };
}

export async function handleGetUserSessions(userId: string) {
  const sessions = await db.select()
    .from(chatSessions)
    .where(eq(chatSessions.userId, userId))
    .orderBy(desc(chatSessions.updatedAt));

  return sessions;
}

export async function handleAddMessage(sessionId: string, request: AddMessageRequest) {
  const { role, content, files } = request;

  console.log("=== HANDLE ADD MESSAGE DEBUG ===");
  console.log("sessionId:", sessionId);
  console.log("role:", role);
  console.log("content:", content);
  console.log("files:", files ? `${files.length} files` : "no files");
  console.log("file details:", files?.map(f => ({ name: f.name, type: f.type, size: f.size })));

  // Verify session exists
  const [session] = await db.select()
    .from(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .limit(1);

  if (!session) {
    throw new Error("Session not found");
  }

  let attachments: MessageAttachment[] | undefined;

  // Handle file uploads if files are provided
  if (files && files.length > 0) {
    attachments = [];
    const messageUploadDir = join(process.cwd(), "uploads", "messages", sessionId);
    
    // Create upload directory
    await mkdir(messageUploadDir, { recursive: true });

    for (const file of files) {
      const attachmentId = ulid();
      const fileExtension = file.name.split('.').pop() || '';
      const filename = `${attachmentId}_${file.name}`;
      const filePath = join(messageUploadDir, filename);

      // Save file to filesystem
      const arrayBuffer = await file.arrayBuffer();
      await writeFile(filePath, new Uint8Array(arrayBuffer));

      // Add attachment metadata
      attachments.push({
        id: attachmentId,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
      });
    }
  }

  // Add the message with attachments
  console.log("Final attachments to save:", attachments);
  
  const [message] = await db.insert(chatMessages).values({
    sessionId,
    role,
    content,
    attachments,
  }).returning();

  console.log("Saved message:", message);

  // Update session timestamp
  await db.update(chatSessions)
    .set({ updatedAt: new Date() })
    .where(eq(chatSessions.id, sessionId));

  return message;
}

export async function updateSessionTitle(sessionId: string, title: string) {
  const [session] = await db.update(chatSessions)
    .set({ 
      title,
      updatedAt: new Date() 
    })
    .where(eq(chatSessions.id, sessionId))
    .returning();

  if (!session) {
    throw new Error("Session not found");
  }

  return session;
}

export async function handleUpdateSession(sessionId: string, updates: { title?: string }) {
  const { title } = updates;

  const [session] = await db.update(chatSessions)
    .set({ 
      title,
      updatedAt: new Date() 
    })
    .where(eq(chatSessions.id, sessionId))
    .returning();

  if (!session) {
    throw new Error("Session not found");
  }

  return session;
}

export async function handleDeleteSession(sessionId: string) {
  // Delete all messages in the session first
  await db.delete(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId));

  // Delete the session
  const [session] = await db.delete(chatSessions)
    .where(eq(chatSessions.id, sessionId))
    .returning();

  if (!session) {
    throw new Error("Session not found");
  }

  return session;
}

function generateSessionTitle(initialMessage?: string): string {
  if (!initialMessage) {
    return "New Chat";
  }

  // Generate a title from the first message
  const words = initialMessage.split(" ").slice(0, 6);
  let title = words.join(" ");
  
  if (initialMessage.split(" ").length > 6) {
    title += "...";
  }

  return title || "New Chat";
}