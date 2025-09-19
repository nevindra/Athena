export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content:
    | string
    | Array<{
        type: "text" | "image";
        text?: string;
        image?: string; // base64 data URL
      }>;
}

export interface AttachmentFile {
  messageId: string;
  attachments: Array<{
    id: string;
    filename: string;
    mimeType: string;
    data: Buffer;
  }>;
}

export interface StatelessFile {
  name: string;
  type: string;
  data: string; // base64 encoded
}

// Helper function to convert multimodal messages for Gemini
export function convertMessagesForGemini(
  messages: ChatMessage[],
  attachmentFiles?: AttachmentFile[],
  files?: StatelessFile[]
) {
  // Create a map of message content to message IDs for attachment lookup
  // Since we don't have message IDs in the messages array, we'll need to match by content
  const messageAttachmentMap = new Map<
    string,
    Array<{
      id: string;
      filename: string;
      mimeType: string;
      data: Buffer;
    }>
  >();

  // For now, we'll add all attachments to the last user message
  // This assumes the most recent user message is the one with attachments
  if (attachmentFiles && attachmentFiles.length > 0) {
    // Find the last user message and attach all images to it
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex >= 0) {
      const lastUserMessage = messages[lastUserMessageIndex];
      const messageKey =
        typeof lastUserMessage.content === "string"
          ? lastUserMessage.content
          : JSON.stringify(lastUserMessage.content);

      // Combine all attachments from all attachment files
      const allAttachments: Array<{
        id: string;
        filename: string;
        mimeType: string;
        data: Buffer;
      }> = [];

      for (const attachmentFile of attachmentFiles) {
        allAttachments.push(...attachmentFile.attachments);
      }

      messageAttachmentMap.set(messageKey, allAttachments);
    }
  }

  // Handle stateless files from direct API calls
  if (files && files.length > 0) {
    // Find the last user message and attach all files to it
    let lastUserMessageIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        lastUserMessageIndex = i;
        break;
      }
    }

    if (lastUserMessageIndex >= 0) {
      const lastUserMessage = messages[lastUserMessageIndex];
      const messageKey =
        typeof lastUserMessage.content === "string"
          ? lastUserMessage.content
          : JSON.stringify(lastUserMessage.content);

      // Convert base64 files to Buffer format
      const convertedFiles: Array<{
        id: string;
        filename: string;
        mimeType: string;
        data: Buffer;
      }> = [];

      for (const file of files) {
        // Extract base64 data (remove data URL prefix if present)
        const base64Data = file.data.includes(",")
          ? file.data.split(",")[1]
          : file.data;

        convertedFiles.push({
          id: `stateless_${Date.now()}_${Math.random()}`,
          filename: file.name,
          mimeType: file.type,
          data: Buffer.from(base64Data, "base64"),
        });
      }

      // Add to existing attachments or create new entry
      const existingAttachments = messageAttachmentMap.get(messageKey) || [];
      messageAttachmentMap.set(messageKey, [
        ...existingAttachments,
        ...convertedFiles,
      ]);
    }
  }

  return messages.map((msg) => {
    const contentParts: any[] = [];

    if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.type === "text" && part.text) {
          contentParts.push({ type: "text", text: part.text });
        }
        if (part.type === "image" && part.image) {
          // Convert existing image format to AI SDK format
          const base64Data = part.image.includes(",")
            ? part.image.split(",")[1]
            : part.image;

          // Determine media type from data URL or default to jpeg
          let mediaType = "image/jpeg";
          if (part.image.includes("data:")) {
            const match = part.image.match(/data:([^;]+)/);
            if (match) mediaType = match[1];
          }

          contentParts.push({
            type: "file",
            data: Buffer.from(base64Data, "base64"),
            mediaType,
          });
        }
      }
    } else if (typeof msg.content === "string") {
      contentParts.push({ type: "text", text: msg.content });
    }

    // Add attachments from database for this message
    const messageKey =
      typeof msg.content === "string"
        ? msg.content
        : JSON.stringify(msg.content);

    const messageAttachments = messageAttachmentMap.get(messageKey);
    if (msg.role === "user" && messageAttachments?.length) {
      for (const attachment of messageAttachments) {
        if (attachment.mimeType.startsWith("image/")) {
          contentParts.push({
            type: "file",
            data: attachment.data,
            mediaType: attachment.mimeType,
          });
        }
      }
    }

    // Return AI SDK compatible format
    return {
      role: msg.role,
      content:
        contentParts.length === 1 && contentParts[0].type === "text"
          ? contentParts[0].text
          : contentParts,
    };
  });
}

// Helper function to convert messages to text-only format for non-Gemini providers
export function convertMessagesToTextOnly(messages: ChatMessage[]) {
  return messages.map((msg) => ({
    role: msg.role,
    content: Array.isArray(msg.content)
      ? msg.content
          .filter((part) => part.type === "text")
          .map((part) => part.text)
          .join(" ")
      : msg.content,
  }));
}