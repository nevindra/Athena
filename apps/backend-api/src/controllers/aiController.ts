import { generateChatResponse, streamChatResponse, getAvailableModels } from "../services/aiService";
import type { ChatRequest } from "../services/aiService";
import { handleAddMessage } from "./sessionController";
import { db } from "../db";
import { chatMessages } from "../db/schema";
import { eq } from "drizzle-orm";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface ChatRequestBody {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string | Array<{
      type: "text" | "image";
      text?: string;
      image?: string;
    }>;
  }>;
  userId: string;
  configurationId?: string;
  sessionId?: string;
  files?: Array<{
    name: string;
    type: string;
    data: string; // base64 encoded
  }>;
}

async function fetchMessageAttachments(sessionId: string) {
  // Get all messages for this session that have attachments
  const messagesWithAttachments = await db.select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId));

  const attachmentFiles: Array<{
    messageId: string;
    attachments: Array<{
      id: string;
      filename: string;
      mimeType: string;
      data: Buffer;
    }>;
  }> = [];

  for (const message of messagesWithAttachments) {
    if (message.attachments && Array.isArray(message.attachments)) {
      const messageAttachments = [];
      
      for (const attachment of message.attachments) {
        try {
          const filename = `${attachment.id}_${attachment.filename}`;
          const filePath = join(process.cwd(), "uploads", "messages", sessionId, filename);
          const fileData = await readFile(filePath);
          
          messageAttachments.push({
            id: attachment.id,
            filename: attachment.filename,
            mimeType: attachment.mimeType,
            data: fileData,
          });
        } catch (error) {
          console.warn(`Failed to read attachment ${attachment.id}:`, error);
        }
      }

      if (messageAttachments.length > 0) {
        attachmentFiles.push({
          messageId: message.id,
          attachments: messageAttachments,
        });
      }
    }
  }

  return attachmentFiles;
}

export async function handleChatRequest(body: ChatRequestBody) {
  const { messages, userId, configurationId, sessionId, files } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error("Messages array is required and cannot be empty");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  // Fetch attachments from database if sessionId is provided
  let attachmentFiles: Array<{
    messageId: string;
    attachments: Array<{
      id: string;
      filename: string;
      mimeType: string;
      data: Buffer;
    }>;
  }> = [];

  if (sessionId) {
    attachmentFiles = await fetchMessageAttachments(sessionId);
  }

  const request: ChatRequest = {
    messages,
    userId,
    configurationId,
    files,
    sessionId,
    attachmentFiles,
  };

  const response = await generateChatResponse(request);

  // Save the AI response to session if sessionId provided
  if (sessionId && response.message) {
    try {
      await handleAddMessage(sessionId, {
        role: "assistant",
        content: response.message,
      });
    } catch (error) {
      console.warn("Failed to save AI message to session:", error);
      // Don't fail the request if saving fails
    }
  }

  return response;
}

export async function handleStreamChatRequest(body: ChatRequestBody) {
  const { messages, userId, configurationId, sessionId, files } = body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new Error("Messages array is required and cannot be empty");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  // Fetch attachments from database if sessionId is provided
  let attachmentFiles: Array<{
    messageId: string;
    attachments: Array<{
      id: string;
      filename: string;
      mimeType: string;
      data: Buffer;
    }>;
  }> = [];

  if (sessionId) {
    attachmentFiles = await fetchMessageAttachments(sessionId);
  }

  const request: ChatRequest = {
    messages,
    userId,
    configurationId,
    files,
    sessionId,
    attachmentFiles,
  };

  const stream = await streamChatResponse(request);
  
  // Note: For streaming, we'll need to handle message saving in the frontend
  // since we can't easily extract the final message from the stream here
  
  return stream;
}

export async function handleGetModelsRequest(userId: string, configurationId?: string) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return await getAvailableModels(userId, configurationId);
}