# Athena Backend API

A clean, well-structured API built with Elysia, Drizzle ORM, PostgreSQL, and pgvector for managing AI provider configurations.

## Features

- **Clean Architecture**: Separation of concerns with controllers, services, and routes
- **Type Safety**: Shared types between frontend and backend using `@athena/shared`
- **Security**: Encryption of sensitive data (API keys, headers)
- **Database**: PostgreSQL with pgvector for future chat embeddings
- **Validation**: Comprehensive input validation with Zod schemas
- **CORS**: Configured for frontend integration

## Prerequisites

- [Bun](https://bun.sh/) runtime
- PostgreSQL database with pgvector extension
- Node.js (for development tools)

## Setup

1. **Install dependencies:**
   ```bash
   cd apps/backend-api
   bun install
   ```

2. **Environment configuration:**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your database credentials and encryption key:
   ```env
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_NAME=athena
   ENCRYPTION_KEY=your-32-character-encryption-key-here
   ```

3. **Database setup:**
   
   Create the database:
   ```sql
   CREATE DATABASE athena;
   ```
   
   Generate and run migrations:
   ```bash
   bun run db:generate
   bun run db:migrate
   ```

4. **Start the development server:**
   ```bash
   bun run dev
   ```

## API Endpoints

All endpoints are prefixed with `/api` and return JSON responses in the format:
```typescript
{
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}
```

### Configurations

- `GET /api/configurations?userId=<ulid>` - List all configurations
- `GET /api/configurations/:id?userId=<ulid>` - Get specific configuration
- `POST /api/configurations?userId=<ulid>` - Create new configuration
- `PUT /api/configurations/:id?userId=<ulid>` - Update configuration
- `DELETE /api/configurations/:id?userId=<ulid>` - Delete configuration
- `POST /api/configurations/test` - Test connection (no userId required)

### Health Check

- `GET /health` - API health status

## Database Schema

### Users
- Basic user management for demo purposes
- Uses ULID for IDs (sortable, URL-safe, 26 characters)

### AI Configurations
- Stores encrypted AI provider configurations
- Supports Gemini, Ollama, and HTTP API providers
- Sensitive fields (API keys, headers) are encrypted at rest
- Uses ULID for IDs

### Chat Sessions & Messages (Future)
- Ready for chat functionality with pgvector embeddings
- Semantic search capabilities for chat history
- Uses CUID2 for IDs (shorter, optimized for horizontal scaling)

## ID Scheme

The database uses different ID formats for different purposes:

- **ULID** (Users & AI Configurations): Lexicographically sortable UUIDs, great for time-ordered data
  - Format: `01ARZ3NDEKTSV4RRFFQ69G5FAV` (26 characters)
  - Benefits: Sortable by creation time, URL-safe, case-insensitive

- **CUID2** (Chat Sessions & Messages): Collision-resistant unique IDs optimized for horizontal scaling
  - Format: `clhz9k2mn0001l0hq8v6p5k8j` (24 characters)
  - Benefits: Shorter, optimized for distributed systems, URL-safe

## Security

- **Encryption**: Sensitive configuration data encrypted using AES-256-GCM
- **Validation**: All inputs validated using Zod schemas
- **CORS**: Configured for specified origins only
- **Type Safety**: Shared types prevent API contract mismatches

## Development

### Database Commands

```bash
# Generate new migration
bun run db:generate

# Run migrations
bun run db:migrate

# Open Drizzle Studio (database GUI)
bun run db:studio
```

### Project Structure

```
src/
├── config/          # Configuration (database, environment)
├── controllers/     # Business logic
├── db/             # Database schema and migrations
├── routes/         # API routes
├── services/       # Utility services (encryption, etc.)
└── index.ts        # Main application entry point
```

## Supported AI Providers

### Google Gemini
- API key authentication
- Model selection (1.5 Pro, Flash, 1.0 Pro)
- Temperature, max tokens, top-p, top-k parameters

### Ollama
- Local server URL configuration
- Model management and selection
- Context length, temperature, and sampling parameters

### Direct HTTP API
- Custom endpoint configuration
- Flexible authentication (Bearer, API key, custom headers)
- OpenAI-compatible API support
- Custom system prompts and streaming options

## Example Usage

### Create Configuration
```bash
curl -X POST "http://localhost:3000/api/configurations?userId=01ARZ3NDEKTSV4RRFFQ69G5FAV" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Gemini Config",
    "provider": "gemini",
    "settings": {
      "apiKey": "your-api-key",
      "model": "gemini-1.5-pro",
      "temperature": 0.7,
      "maxTokens": 2048,
      "topP": 0.9,
      "topK": 40
    },
    "isActive": true
  }'
```

### Test Connection
```bash
curl -X POST "http://localhost:3000/api/configurations/test" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "ollama",
    "settings": {
      "serverUrl": "http://localhost:11434",
      "model": "llama3.2:3b",
      "temperature": 0.7,
      "maxTokens": 2048,
      "topP": 0.9,
      "topK": 40,
      "numCtx": 4096
    }
  }'
```