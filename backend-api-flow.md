# Athena Backend API Flow Documentation

## Table of Contents
- [Overview](#overview)
- [Architecture Components](#architecture-components)  
- [API Flow Options](#api-flow-options)
- [Session-based Flow (Recommended)](#session-based-flow-recommended)
- [Direct AI Chat Flow](#direct-ai-chat-flow)
- [System Prompt Integration](#system-prompt-integration)
- [File Handling](#file-handling)
- [Request/Response Formats](#requestresponse-formats)
- [Data Flow Architecture](#data-flow-architecture)
- [Implementation Details](#implementation-details)
- [Error Handling](#error-handling)

## Overview

The Athena backend API provides two main approaches for processing user prompts with images to generate structured AI outputs:

1. **Session-based Flow** - Persistent conversations with file storage and message history
2. **Direct AI Chat Flow** - Stateless single requests with inline image data

Both approaches support:
- Multiple AI providers (Gemini, Ollama, HTTP-API/OpenAI)
- Image analysis with multimodal inputs
- Structured JSON output via system prompts
- Regular conversational responses

## Architecture Components

### Core Layers
```
┌─────────────────┐
│   API Routes    │  /api/sessions, /api/ai, /api/system-prompts
├─────────────────┤
│   Controllers   │  Business logic handlers
├─────────────────┤
│   Services      │  AI provider integrations  
├─────────────────┤
│   Database      │  PostgreSQL + Drizzle ORM
└─────────────────┘
```

### Key Services
- **AI Service** (`aiService.ts`): Provider integration, message conversion, structured output
- **Session Controller** (`sessionController.ts`): Session and message management
- **AI Controller** (`aiController.ts`): Chat request processing
- **Encryption Service**: Secure API key storage

## API Flow Options

### Quick Comparison

| Aspect | Session-based | Direct Chat |
|--------|---------------|-------------|
| **Endpoint** | `/api/sessions` + `/api/ai/chat` | `/api/ai/chat` only |
| **File Upload** | `multipart/form-data` | Base64 in JSON |
| **Persistence** | Files stored on disk | No persistence |
| **History** | Full conversation history | Stateless |
| **Use Case** | Multi-turn conversations | One-off requests |
| **Image Limit** | Multiple files per message | Inline base64 only |

## Session-based Flow (Recommended)

Best for persistent conversations, multi-turn interactions, and file management.

### Step 1: Create Session

**Request:**
```http
POST http://localhost:3000/api/sessions
Content-Type: application/json

{
  "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "configurationId": "config_01HZXK8QJ7NWVX5G2YBHD3FE4M", 
  "title": "Image Analysis Session",
  "initialMessage": "Please analyze the uploaded images"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm5p0n9s70001hzxk8qj7nwvx",
    "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
    "configurationId": "config_01HZXK8QJ7NWVX5G2YBHD3FE4M",
    "title": "Image Analysis Session",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:00:00.000Z"
  }
}
```

### Step 2: Add Message with Images

**Request:**
```http
POST http://localhost:3000/api/sessions/cm5p0n9s70001hzxk8qj7nwvx/messages
Content-Type: multipart/form-data

--boundary123
Content-Disposition: form-data; name="role"

user
--boundary123
Content-Disposition: form-data; name="content"

Analyze these images and extract key objects, provide structured output
--boundary123
Content-Disposition: form-data; name="files"; filename="street_scene.jpg"
Content-Type: image/jpeg

[Binary image data...]
--boundary123
Content-Disposition: form-data; name="files"; filename="interior_shot.png"  
Content-Type: image/png

[Binary image data...]
--boundary123--
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm5p0n9s70002hzxk8qj7nwvx",
    "sessionId": "cm5p0n9s70001hzxk8qj7nwvx",
    "role": "user",
    "content": "Analyze these images and extract key objects, provide structured output",
    "attachments": [
      {
        "id": "01HZXK8QJ7NWVX5G2YBHD3FE4M",
        "filename": "street_scene.jpg",
        "mimeType": "image/jpeg",
        "size": 1024567
      },
      {
        "id": "01HZXK8QJ7NWVX5G2YBHD3FE4N", 
        "filename": "interior_shot.png",
        "mimeType": "image/png",
        "size": 512348
      }
    ],
    "createdAt": "2024-01-01T10:01:00.000Z"
  }
}
```

### Step 3: Generate AI Response

**Request:**
```http
POST http://localhost:3000/api/ai/chat
Content-Type: application/json

{
  "messages": [
    {
      "role": "user", 
      "content": "Analyze these images and extract key objects, provide structured output"
    }
  ],
  "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "configurationId": "config_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "sessionId": "cm5p0n9s70001hzxk8qj7nwvx",
  "systemPromptId": "structured_vision_prompt_id"
}
```

**Response (Structured Output):**
```json
{
  "success": true,
  "data": {
    "message": "{\n  \"image_1_analysis\": {\n    \"objects_detected\": [\"car\", \"person\", \"building\", \"street_sign\"],\n    \"confidence_scores\": [0.95, 0.88, 0.92, 0.76],\n    \"scene_type\": \"urban_street\",\n    \"dominant_colors\": [\"gray\", \"blue\", \"black\"]\n  },\n  \"image_2_analysis\": {\n    \"objects_detected\": [\"sofa\", \"table\", \"lamp\", \"window\"],\n    \"confidence_scores\": [0.94, 0.89, 0.82, 0.91],\n    \"scene_type\": \"living_room\",\n    \"dominant_colors\": [\"beige\", \"brown\", \"white\"]\n  },\n  \"summary\": {\n    \"total_objects\": 8,\n    \"scene_types\": [\"urban_street\", \"living_room\"],\n    \"analysis_confidence\": 0.88\n  }\n}",
    "model": "gemini-2.5-pro",
    "finishReason": "stop",
    "reasoning": "Successfully analyzed both images and extracted structured object detection data with confidence scores",
    "usage": {
      "promptTokens": 1205,
      "completionTokens": 187,
      "totalTokens": 1392
    }
  }
}
```

### Step 4: Retrieve Session History (Optional)

**Request:**
```http
GET http://localhost:3000/api/sessions/cm5p0n9s70001hzxk8qj7nwvx
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "cm5p0n9s70001hzxk8qj7nwvx",
    "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
    "configurationId": "config_01HZXK8QJ7NWVX5G2YBHD3FE4M",
    "title": "Image Analysis Session", 
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-01T10:02:00.000Z",
    "messages": [
      {
        "id": "cm5p0n9s70002hzxk8qj7nwvx",
        "sessionId": "cm5p0n9s70001hzxk8qj7nwvx", 
        "role": "user",
        "content": "Analyze these images and extract key objects, provide structured output",
        "attachments": [/* attachment objects */],
        "createdAt": "2024-01-01T10:01:00.000Z"
      },
      {
        "id": "cm5p0n9s70003hzxk8qj7nwvx",
        "sessionId": "cm5p0n9s70001hzxk8qj7nwvx",
        "role": "assistant", 
        "content": "{...structured JSON response...}",
        "attachments": null,
        "createdAt": "2024-01-01T10:02:00.000Z"
      }
    ]
  }
}
```

## Direct AI Chat Flow

Best for one-off requests and stateless interactions.

### Single Request with Inline Images

**Request:**
```http
POST http://localhost:3000/api/ai/chat
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text", 
          "text": "What objects can you see in this image? Provide structured analysis."
        },
        {
          "type": "image",
          "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k="
        }
      ]
    }
  ],
  "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "configurationId": "config_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "systemPromptId": "object_detection_prompt_id"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "{\n  \"objects_detected\": [\n    {\n      \"name\": \"laptop\",\n      \"confidence\": 0.94,\n      \"bounding_box\": {\"x\": 120, \"y\": 80, \"width\": 200, \"height\": 150}\n    },\n    {\n      \"name\": \"coffee_mug\", \n      \"confidence\": 0.87,\n      \"bounding_box\": {\"x\": 340, \"y\": 180, \"width\": 60, \"height\": 80}\n    }\n  ],\n  \"scene_description\": \"A workspace setup with a laptop and coffee mug on a desk\",\n  \"total_objects\": 2,\n  \"analysis_timestamp\": \"2024-01-01T10:03:00Z\"\n}",
    "model": "gemini-2.5-pro",
    "finishReason": "stop",
    "usage": {
      "promptTokens": 845,
      "completionTokens": 156,
      "totalTokens": 1001
    }
  }
}
```

### Alternative: Using Files Array in JSON

**Request:**
```http
POST http://localhost:3000/api/ai/chat
Content-Type: application/json

{
  "messages": [
    {
      "role": "user",
      "content": "Analyze the uploaded images for safety compliance issues"  
    }
  ],
  "userId": "user_01HZXK8QJ7NWVX5G2YBHD3FE4M",
  "files": [
    {
      "name": "worksite_photo.jpg",
      "type": "image/jpeg", 
      "data": "/9j/4AAQSkZJRgABAQAAAQABAAD/..." // base64 without data URL prefix
    },
    {
      "name": "equipment_check.png",
      "type": "image/png",
      "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk..."
    }
  ],
  "systemPromptId": "safety_compliance_prompt_id"
}
```

## System Prompt Integration

System prompts control AI behavior and output format. Two main categories:

### 1. Topic-Specific Prompts
Regular AI responses with domain expertise:

```json
{
  "id": "medical_analysis_prompt",
  "category": "Topic-Specific",
  "content": "You are a medical imaging specialist. Analyze images for potential abnormalities, but always recommend consulting healthcare professionals.",
  "title": "Medical Image Analysis"
}
```

### 2. Structured Output Prompts  
JSON schema-validated responses:

```json
{
  "id": "structured_vision_prompt", 
  "category": "Structured Output",
  "content": "Analyze the provided images and extract structured information about objects, scenes, and visual elements.",
  "jsonSchema": [
    {
      "name": "objects_detected",
      "type": "array",
      "arrayItemType": "string", 
      "required": true,
      "description": "List of objects found in the image"
    },
    {
      "name": "confidence_scores", 
      "type": "array",
      "arrayItemType": "number",
      "required": true,
      "description": "Confidence scores for each detected object (0-1)"
    },
    {
      "name": "scene_type",
      "type": "string",
      "required": true,
      "description": "Overall scene classification"
    },
    {
      "name": "dominant_colors",
      "type": "array", 
      "arrayItemType": "string",
      "required": false,
      "description": "Primary colors in the image"
    }
  ]
}
```

### System Prompt Processing

The AI service automatically detects structured output prompts:

```typescript
// From aiService.ts:417-470
if (systemPrompt && systemPrompt.category === "Structured Output" && systemPrompt.jsonSchema) {
  // Use generateObject for structured outputs with Zod schema validation
  const zodSchema = buildZodSchema(systemPrompt.jsonSchema);
  const { object } = await generateObject({
    model: googleProvider(geminiSettings.model),
    messages: convertedMessages,
    system: enhancedSystemPrompt,
    schema: zodSchema,
    temperature: 0.1, // Lower temperature for consistency
    // ...
  });
} else {
  // Use generateText for regular prompts
  const { text } = await generateText({
    // ...
  });
}
```

## File Handling

### Session-based File Storage

**Storage Location:**
```
/uploads/messages/{sessionId}/{attachmentId}_{originalFilename}
```

**Example:**
```
/uploads/messages/cm5p0n9s70001hzxk8qj7nwvx/01HZXK8QJ7NWVX5G2YBHD3FE4M_street_scene.jpg
```

**Database Schema:**
```typescript
// attachments field in chat_messages table
attachments: json("attachments").$type<MessageAttachment[]>()

type MessageAttachment = {
  id: string;        // ULID
  filename: string;  // Original filename
  mimeType: string;  // MIME type
  size: number;      // File size in bytes
}
```

### File Processing Flow

1. **Upload**: Files saved to disk with ULID + original filename
2. **Storage**: Metadata stored in database `attachments` JSON field
3. **Retrieval**: When processing AI requests, files loaded from disk using metadata
4. **Conversion**: Images converted to AI SDK format for provider compatibility

### AI Provider Image Handling

**Gemini (Google):**
```typescript
// Converted to AI SDK file format
{
  type: "file",
  data: Buffer.from(base64Data, "base64"), 
  mediaType: "image/jpeg"
}
```

**Ollama & HTTP-API:**
```typescript
// Text-only processing (images filtered out)
const textMessages = messages.map(msg => ({
  role: msg.role,
  content: extractTextContent(msg.content)
}));
```

## Request/Response Formats

### Content Types

**Session Messages (with files):**
- `Content-Type: multipart/form-data`
- Form fields: `role`, `content`, `files[]`

**AI Chat (JSON):**
- `Content-Type: application/json` 
- Images as base64 or file references

### Message Content Formats

**Text Only:**
```json
{
  "role": "user",
  "content": "Simple text message"
}
```

**Multimodal (Text + Images):**
```json
{
  "role": "user", 
  "content": [
    {
      "type": "text",
      "text": "Describe this image"
    },
    {
      "type": "image", 
      "image": "data:image/jpeg;base64,..."
    }
  ]
}
```

### Error Response Format

```json
{
  "success": false,
  "error": "Detailed error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200`: Success
- `400`: Bad Request (validation errors, missing fields)
- `404`: Not Found (session, configuration, or system prompt not found)
- `500`: Internal Server Error (AI provider errors, database issues)

## Data Flow Architecture

### Complete Processing Pipeline

```
1. Client Request
   ├─ Session-based: POST /api/sessions/{id}/messages (multipart)
   └─ Direct: POST /api/ai/chat (JSON)
          ↓
2. API Route Layer
   ├─ sessionRoutes.ts: File upload handling
   └─ aiRoutes.ts: Request validation
          ↓  
3. Controller Layer
   ├─ sessionController.ts: File storage, database operations
   └─ aiController.ts: Message processing, attachment retrieval
          ↓
4. AI Service Layer (aiService.ts)
   ├─ Configuration retrieval & decryption
   ├─ System prompt processing  
   ├─ Message format conversion
   └─ Provider-specific handling
          ↓
5. AI Provider Integration
   ├─ Gemini: Multimodal support, structured output
   ├─ Ollama: Local models, text-only
   └─ HTTP-API: OpenAI-compatible endpoints
          ↓
6. Response Processing
   ├─ Structured output validation (if applicable)
   ├─ Usage statistics collection
   └─ Message persistence (if session-based)
          ↓
7. Client Response
```

### Key Data Transformations

**Image Processing:**
```
Upload (multipart) → Disk Storage → Buffer → AI SDK Format → Provider API
   ↓                    ↓              ↓           ↓              ↓
Files[]          Filesystem      Database    {type:"file"}   Native Format
```

**Message Conversion:**
```
Client Format → Internal Format → Provider Format → Response Format
      ↓              ↓                  ↓              ↓
   JSON/Form    ChatMessage[]     Provider-Specific   JSON
```

## Implementation Details

### Database Schema Overview

**Tables Used:**
- `chat_sessions`: Session metadata
- `chat_messages`: Message content + attachment metadata  
- `ai_configurations`: Provider settings (encrypted)
- `system_prompts`: Prompt templates + JSON schemas
- `users`: User management

**Key Relationships:**
- `sessions` → `messages` (1:many)
- `users` → `sessions` (1:many)
- `ai_configurations` → `sessions` (1:many)
- `system_prompts` → `ai_requests` (1:many usage)

### Encryption & Security

**Sensitive Data Encryption:**
```typescript
// API keys encrypted before database storage
const decryptedSettings = await encryptionService.decryptSensitiveFields(
  provider, 
  parsedSettings
);
```

**File Security:**
- Files stored outside web root
- Access controlled via session ownership
- ULID-based filenames prevent enumeration

### Provider-Specific Implementation

**Gemini Integration:**
- Full multimodal support (text + images)
- Structured output with `generateObject()`
- Thinking tokens for reasoning
- Built-in safety filters

**Ollama Integration:**  
- Local model support
- Text-only processing
- Custom server URL configuration
- No API key required

**HTTP-API Integration:**
- OpenAI-compatible endpoints
- Flexible base URL configuration
- Standard chat completion API
- Custom model support

### Performance Considerations

**File Handling:**
- Streaming multipart uploads
- Disk-based storage (not memory)
- Lazy loading of attachments

**Database Optimization:**
- Indexed queries on user/session
- JSON field for flexible attachment metadata
- Vector embeddings ready (for future semantic search)

**Memory Management:**
- Files processed as streams when possible
- Base64 conversion only when necessary
- Attachment cleanup on session deletion

## Error Handling

### Common Error Scenarios

**1. Session Not Found:**
```json
{
  "success": false,
  "error": "Session not found"
}
```

**2. Invalid AI Configuration:**
```json  
{
  "success": false,
  "error": "No active AI configuration found for user"
}
```

**3. File Upload Errors:**
```json
{
  "success": false, 
  "error": "Failed to add message"
}
```

**4. AI Provider Errors:**
```json
{
  "success": false,
  "error": "Failed to generate AI response" 
}
```

**5. Structured Output Validation:**
```json
{
  "success": false,
  "error": "Generated response doesn't match required JSON schema"
}
```

### Error Recovery Strategies

**Provider Failures:**
- Fallback to different model configurations
- Graceful degradation for unsupported features
- Detailed logging for troubleshooting

**File System Issues:**
- Retry logic for temporary failures  
- Alternative storage paths
- Cleanup on partial uploads

**Database Errors:**
- Transaction rollbacks
- Connection pooling and retries
- Data consistency checks

### Debugging & Monitoring

**Logging Points:**
```typescript
// Key logging in aiService.ts and controllers
console.log("Gemini result:", result);
console.log("Final attachments to save:", attachments); 
console.log("JSON body received:", messageData);
```

**Monitoring Recommendations:**
- AI provider response times
- File upload success rates  
- Structured output validation failures
- Database query performance
- Error frequency by endpoint

---

## Quick Reference

### Essential Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/sessions` | POST | Create new session |
| `/api/sessions/{id}/messages` | POST | Add message with files |  
| `/api/sessions/{id}` | GET | Get session + messages |
| `/api/ai/chat` | POST | Generate AI response |
| `/api/ai/chat/stream` | POST | Stream AI response |
| `/api/ai/models` | GET | List available models |

### File Upload Limits

- **Session-based**: Multiple files per message
- **Direct**: Base64 size limits (typically ~10MB per image)
- **Storage**: Disk space dependent
- **Processing**: Memory dependent on provider

### Supported Image Formats

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`) 
- WebP (`.webp`)
- GIF (`.gif`)
- BMP (`.bmp`)

Provider support may vary - Gemini has the broadest format support.

---

*This documentation covers the current implementation as of the codebase analysis. For the most up-to-date API changes, refer to the source code in `/apps/backend-api/src/`.*