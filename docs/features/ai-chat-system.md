# AI Chat System

## Overview
The AI Chat System is the core feature of Athena, providing a real-time conversational interface with support for multiple AI providers, streaming responses, session management, and rich message formatting.

## Features

### Real-time Chat Interface
- **Streaming Responses**: Real-time AI response streaming for immediate feedback
- **Message History**: Persistent conversation storage with session management
- **Rich Formatting**: Markdown support, code highlighting, and mathematical expressions
- **File Attachments**: Image upload and processing capabilities
- **Copy Functionality**: Easy copying of messages and code blocks

### Session Management
- **Multiple Sessions**: Create and manage multiple conversation threads
- **Session Persistence**: Automatic saving and restoration of conversations
- **Session History**: Browse and search through previous conversations
- **Session Sharing**: Export and share conversation threads

### Model Integration
- **Dynamic Provider Selection**: Switch between AI providers within conversations
- **Model-specific Features**: Leverage unique capabilities of different AI models
- **Configuration Binding**: Use pre-configured model settings and system prompts
- **Fallback Handling**: Graceful handling of model availability and errors

## Backend Architecture

### API Endpoints
```
POST /api/sessions                    # Create new chat session
GET /api/sessions                     # List user sessions
GET /api/sessions/:id                 # Get specific session
DELETE /api/sessions/:id              # Delete session

POST /api/sessions/:id/messages       # Send message to session
GET /api/sessions/:id/messages        # Get session messages
PUT /api/messages/:id                 # Update message
DELETE /api/messages/:id              # Delete message

POST /api/chat/completions            # Direct chat completion
POST /api/chat/stream                 # Streaming chat completion
```

### Database Schema
```sql
-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id),
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Attachments table
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id),
  filename VARCHAR(255) NOT NULL,
  content_type VARCHAR(100),
  file_path VARCHAR(500),
  file_size INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Chat Service
```typescript
class ChatService {
  async createSession(userId: string, title?: string): Promise<Session>
  async getSession(sessionId: string, userId: string): Promise<Session>
  async addMessage(sessionId: string, message: CreateMessageRequest): Promise<Message>
  async streamCompletion(request: ChatCompletionRequest): Promise<ReadableStream>
  async handleFileAttachment(file: File, messageId: string): Promise<Attachment>
}
```

## Frontend Architecture

### Core Components

#### Chat Interface (`/features/chat/`)
- **ChatContainer**: Main chat layout and message flow
- **Message**: Individual message rendering with markdown support
- **MessageList**: Virtualized message list for performance
- **TypingIndicator**: Real-time typing status display

#### Chat Input (`/features/chat-input/`)
- **EnhancedChatInput**: Advanced input with file upload and formatting
- **ModelSelector**: Dynamic AI model selection dropdown
- **SystemPromptSelector**: System prompt integration
- **FileUploader**: Drag-and-drop file attachment handling

#### Chat History (`/features/chat/`)
- **ChatHistorySidebar**: Session navigation and management
- **SessionList**: List of user conversations
- **SessionSearch**: Search and filter conversations

### State Management
```typescript
// Session store
interface SessionStore {
  currentSession: Session | null;
  sessions: Session[];
  messages: Record<string, Message[]>;
  isLoading: boolean;
  error: string | null;
}

// Chat store
interface ChatStore {
  streamingMessage: string;
  isStreaming: boolean;
  selectedModel: AIConfiguration | null;
  systemPrompt: SystemPrompt | null;
}
```

### Hooks
```typescript
// Session management
useSession(sessionId: string)
useSessions(userId: string)
useAddMessage(sessionId: string)
useUpdateMessage(messageId: string)
useDeleteMessage(messageId: string)

// Chat functionality
useChatCompletion(configuration: AIConfiguration)
useStreamingChat(configuration: AIConfiguration)
useMessageHistory(sessionId: string)
```

## Real-time Features

### Streaming Implementation
```typescript
// Frontend streaming handler
async function handleStreamingResponse(response: Response) {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        updateStreamingMessage(data.content);
      }
    }
  }
}
```

### WebSocket Integration (Future)
- **Real-time Updates**: Live session updates across devices
- **Collaborative Features**: Shared sessions and real-time collaboration
- **Presence Indicators**: User online status and typing indicators

## Security & Privacy

### Message Encryption
- **At Rest**: Message content encrypted in database
- **In Transit**: HTTPS/WSS for all communications
- **Key Management**: User-specific encryption keys

### Access Control
- **Session Isolation**: Users can only access their own sessions
- **Message Validation**: Server-side content validation and sanitization
- **Rate Limiting**: Prevent abuse and ensure fair usage

### Data Retention
- **Configurable Retention**: User-defined message retention periods
- **Automatic Cleanup**: Scheduled cleanup of expired sessions
- **Export Options**: Data export before deletion

## Performance Optimization

### Frontend Optimization
- **Virtual Scrolling**: Efficient rendering of large message lists
- **Message Caching**: Local storage for frequently accessed messages
- **Lazy Loading**: Progressive loading of message history
- **Image Optimization**: Automatic image compression and resizing

### Backend Optimization
- **Database Indexing**: Optimized queries for message retrieval
- **Caching Layer**: Redis caching for active sessions
- **Connection Pooling**: Efficient database connection management
- **Response Compression**: Gzip compression for API responses

## Integration Points

### AI Provider Integration
- **Unified Interface**: Consistent API across all providers
- **Provider-specific Features**: Support for unique model capabilities
- **Error Handling**: Graceful fallback and error recovery
- **Usage Tracking**: Monitor API usage and costs

### System Prompt Integration
- **Dynamic Injection**: Real-time system prompt application
- **Context Management**: Maintain conversation context with prompts
- **Prompt Chaining**: Sequential prompt application for complex tasks

### File Processing Integration
- **Image Analysis**: OCR and image understanding capabilities
- **Document Processing**: PDF and document text extraction
- **Knowledge Base**: Integration with document storage system

## Development Guidelines

### Adding New Message Types
1. Update message schema and database migrations
2. Create new message component in `/features/chat/`
3. Update message rendering logic
4. Add message type validation
5. Update TypeScript types in shared package

### Implementing New Chat Features
1. Design API endpoints and data flow
2. Create backend service methods
3. Implement frontend components and hooks
4. Add proper error handling and loading states
5. Write comprehensive tests

### Performance Considerations
- Use React.memo for message components
- Implement proper key props for list items
- Avoid unnecessary re-renders with useCallback
- Optimize database queries with proper indexing
- Consider message pagination for large conversations
