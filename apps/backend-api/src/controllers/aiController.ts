import { eq } from "drizzle-orm";
import { db } from "../db";
import { chatMessages } from "../db/schema";
import { StorageFactory } from "../services/storage";
import type { ChatRequest } from "../services/aiService";
import {
  generateChatResponse,
  getAvailableModels,
  streamChatResponse,
} from "../services/aiService";
import { handleAddMessage } from "./sessionController";

export interface ChatRequestBody {
  messages: Array<{
    role: "user" | "assistant" | "system";
    content:
    | string
    | Array<{
      type: "text" | "image";
      text?: string;
      image?: string;
    }>;
  }>;
  userId: string;
  configurationId?: string;
  apiRegistrationId?: string;
  sessionId?: string;
  systemPromptId?: string;
  files?: Array<{
    name: string;
    type: string;
    data: string; // base64 encoded
  }>;
}

const MAX_ATTACHMENT_SIZE = 50 * 1024 * 1024; // 50MB per attachment
const MAX_TOTAL_ATTACHMENTS_SIZE = 200 * 1024 * 1024; // 200MB total

async function fetchMessageAttachments(sessionId: string) {
  const messagesWithAttachments = await db
    .select()
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

  const storageProvider = StorageFactory.getStorageProvider();
  let totalSize = 0;

  for (const message of messagesWithAttachments) {
    if (message.attachments && Array.isArray(message.attachments)) {
      const messageAttachments = [];

      for (const attachment of message.attachments) {
        try {
          if (!attachment.path) {
            console.warn(`Attachment ${attachment.id} missing path - skipping`);
            continue;
          }

          const fileData = await storageProvider.download(attachment.path);

          // Check actual file size after download
          if (fileData.length > MAX_ATTACHMENT_SIZE) {
            console.warn(`Attachment ${attachment.id} too large (${fileData.length} bytes) - skipping`);
            continue;
          }

          if (totalSize + fileData.length > MAX_TOTAL_ATTACHMENTS_SIZE) {
            console.warn(`Total attachments size limit exceeded - skipping remaining attachments`);
            break;
          }

          totalSize += fileData.length;

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

    if (totalSize >= MAX_TOTAL_ATTACHMENTS_SIZE) {
      break;
    }
  }

  return attachmentFiles;
}

function validateChatRequest(body: ChatRequestBody): void {
  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    throw new Error("Messages array is required and cannot be empty");
  }

  if (!body.userId) {
    throw new Error("User ID is required");
  }

  // Validate file attachments size
  if (body.files && Array.isArray(body.files)) {
    let totalSize = 0;
    for (const file of body.files) {
      if (file.data) {
        const size = Buffer.byteLength(file.data, 'base64');
        if (size > MAX_ATTACHMENT_SIZE) {
          throw new Error(`File ${file.name} is too large (max ${MAX_ATTACHMENT_SIZE / 1024 / 1024}MB)`);
        }
        totalSize += size;
      }
    }

    if (totalSize > MAX_TOTAL_ATTACHMENTS_SIZE) {
      throw new Error(`Total file size too large (max ${MAX_TOTAL_ATTACHMENTS_SIZE / 1024 / 1024}MB)`);
    }
  }
}

async function prepareChatRequest(body: ChatRequestBody): Promise<ChatRequest> {
  validateChatRequest(body);

  const {
    messages,
    userId,
    configurationId,
    apiRegistrationId,
    sessionId,
    systemPromptId,
    files,
  } = body;

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

  return {
    messages,
    userId,
    configurationId,
    apiRegistrationId,
    sessionId,
    systemPromptId,
    files,
    attachmentFiles,
  };
}

export async function handleChatRequest(body: ChatRequestBody) {
  const request = await prepareChatRequest(body);
  const response = await generateChatResponse(request);

  if (request.sessionId && response.message) {
    try {
      await handleAddMessage(request.sessionId, {
        role: "assistant",
        content: response.message,
      });
    } catch (error) {
      console.warn("Failed to save AI message to session:", error);
    }
  }

  return response;
}

export async function handleStreamChatRequest(body: ChatRequestBody) {
  const request = await prepareChatRequest(body);
  return await streamChatResponse(request);
}

export async function handleGetModelsRequest(
  userId: string,
  configurationId?: string,
  apiRegistrationId?: string
) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  return await getAvailableModels(userId, configurationId, apiRegistrationId);
}
