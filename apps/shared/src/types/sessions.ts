export interface CreateSessionRequest {
  userId: string;
  configurationId: string;
  initialMessage?: string;
  title?: string;
}

export interface Session {
  id: string;
  userId: string;
  configurationId: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;
  createdAt: string;
}

export interface ChatRequest {
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
  systemPromptId?: string;
  files?: Array<{
    name: string;
    type: string;
    data: string; // base64 encoded
  }>;
}