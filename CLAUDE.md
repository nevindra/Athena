# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Athena** is an AI chat application with configurable model providers, built as a modern full-stack TypeScript monorepo. The project enables users to interact with various AI models (OpenAI, Gemini, Ollama, custom HTTP APIs) through a polished chat interface with comprehensive model configuration management.

## Project Structure

This is a monorepo with three main packages:

- **Backend API** (`apps/backend-api/`): RESTful API server handling AI model configurations and chat operations
- **Frontend** (`apps/frontend/`): Modern chat interface with comprehensive model management
- **Shared** (`apps/shared/`): Common types, validators, and utilities shared between frontend and backend

### High-Level Architecture

**Frontend Application**
- Modern React-based chat interface built with React Router v7
- Comprehensive AI model configuration system supporting multiple providers
- Professional UI built with shadcn/ui components and Radix UI primitives
- Features include model selection, parameter tuning, and provider management
- Real-time chat functionality with streaming AI responses

**Backend API**
- High-performance Elysia server running on Bun runtime
- RESTful API for AI model configuration management
- Database integration with Drizzle ORM and PostgreSQL
- Support for multiple AI providers: OpenAI, Gemini, Ollama, and custom HTTP APIs
- Built-in encryption service for secure API key storage

**Shared Package**
- Centralized type definitions and validation schemas
- Zod validators for AI configuration and API contracts
- Ensures type safety across the entire application stack

### Key Technologies

- **Runtime**: Bun (replaces Node.js and npm)
- **Backend**: Elysia framework, Drizzle ORM, PostgreSQL
- **Frontend**: React Router v7, Tailwind CSS v4, shadcn/ui components, Radix UI
- **Shared**: TypeScript, Zod validation
- **Tooling**: Biome (linting/formatting), TanStack Query (data fetching)
- **AI Integration**: Vercel AI SDK, OpenAI SDK, Ollama provider

## Development Commands

### Starting Development
```bash
bun run dev          # Start both frontend and backend concurrently
```

### Individual Applications
```bash
cd apps/backend-api && bun run dev    # Backend only (port 3000)
cd apps/frontend && bun run dev       # Frontend only
```

### Building
```bash
bun run build        # Build both applications
```

### Code Quality
```bash
bun run lint         # Check code with Biome
bun run lint:fix     # Auto-fix Biome issues
bun run format       # Format code with Biome
```

### Frontend-Specific
```bash
cd apps/frontend
bun run typecheck    # Type checking with TypeScript
bun run start        # Production server
```

## Architecture Notes

### Backend (Elysia)
- Simple REST API server on port 3000
- Built with Elysia framework running on Bun
- No transpilation needed - runs TypeScript natively

### Frontend (React Router v7)
- Uses shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom configuration
- File-based routing in `app/routes/` directory
- Components organized in `app/components/` with UI components in `app/components/ui/`

### Code Standards
- Biome configuration enforces:
  - Double quotes for strings
  - Semicolons required
- TypeScript strict mode enabled
- Path aliases configured: `~` maps to `app/` directory in frontend

## Apple Design Principles

### Human Interface Guidelines for Chat Applications

**Clarity**
- Prioritize content over chrome - message content should dominate the interface
- Use clear typography hierarchy: message text, timestamps, sender names
- Implement sufficient contrast ratios (4.5:1 minimum for text)
- Use whitespace strategically to separate conversations and message groups

**Deference**
- UI should enhance functionality without competing with content
- Subtle animations and transitions that don't distract from reading
- Use system fonts (SF Pro) and semantic colors that adapt to user preferences
- Support both light and dark modes seamlessly

**Depth**
- Create visual hierarchy through elevation and layering
- Message bubbles should have subtle depth without heavy shadows
- Use blur effects and translucency for overlays and modals
- Implement smooth parallax scrolling for long conversations

**Aesthetic Integrity**
- Maintain visual consistency across all chat elements
- Use rounded corners consistently (8px for bubbles, 12px for containers)
- Apply consistent spacing using 8pt grid system
- Color palette should be purposeful and limited

**Consistency**
- Follow established patterns from system messaging apps
- Use familiar gestures: swipe actions, pull-to-refresh, tap interactions
- Maintain consistent button placement and sizing
- Implement predictable navigation patterns

**Direct Manipulation**
- Enable direct interaction with messages (copy, reply, react)
- Support drag-and-drop for file attachments
- Implement touch-friendly target sizes (minimum 44pt)
- Provide immediate visual feedback for all interactions

**Feedback**
- Show typing indicators and message delivery status
- Provide haptic feedback for important actions
- Use subtle animations to acknowledge user input
- Display loading states for AI responses

**Metaphors**
- Use familiar chat conventions (bubbles, threads, channels)
- Implement recognizable icons from SF Symbols
- Apply natural physics to scrolling and animations
- Use spatial relationships to show conversation flow

**User Control**
- Allow customization of text size, theme, and notification preferences
- Provide clear ways to delete, edit, or archive conversations
- Enable search and filtering capabilities
- Offer granular privacy and data controls

## Essential UX Laws for Chat Applications

### Fitts's Law
- **Principle**: Time to reach a target depends on size and distance
- **Implementation**: 
  - Make send buttons and frequently used actions larger (minimum 44px)
  - Position important controls within thumb reach on mobile
  - Use sticky input areas that don't require scrolling to access

### Hick's Law
- **Principle**: Decision time increases with number of options
- **Implementation**:
  - Limit main actions to 3-5 primary functions (send, attach, voice, etc.)
  - Progressive disclosure for advanced features (reactions, formatting)
  - Use contextual menus rather than overwhelming toolbars

### Miller's Rule (7±2)
- **Principle**: Working memory can hold 7±2 items
- **Implementation**:
  - Display 5-9 recent conversations in sidebar
  - Limit quick action buttons to 5-7 options
  - Group related settings into logical sections

### Jakob's Law
- **Principle**: Users expect your app to work like other apps they know
- **Implementation**:
  - Follow conventions from WhatsApp, iMessage, Slack patterns
  - Use standard gestures (swipe for actions, pull to refresh)
  - Implement familiar keyboard shortcuts (Cmd+Enter to send)

### Gestalt Principles
- **Proximity**: Group related messages by time and sender
- **Similarity**: Use consistent styling for message types
- **Continuity**: Create clear conversation flow with proper alignment
- **Closure**: Use incomplete loading states that suggest completion

### Von Restorff Effect (Isolation Effect)
- **Principle**: Distinctive items are more memorable
- **Implementation**:
  - Highlight unread messages with subtle accent colors
  - Use unique styling for system messages and notifications
  - Make error states visually distinct without being alarming

### Pareto Principle (80/20 Rule)
- **Principle**: 80% of effects come from 20% of causes
- **Implementation**:
  - Focus on core chat functionality first: send, receive, scroll
  - Optimize for the most common use cases: text messages, quick replies
  - Prioritize performance for basic operations over advanced features

### Zeigarnik Effect
- **Principle**: Incomplete tasks are remembered better than completed ones
- **Implementation**:
  - Show typing indicators to create anticipation
  - Use progressive loading for long AI responses
  - Display "draft" indicators for unsent messages

## Chat UI Specific Guidelines

### Message Design
- Use asymmetrical bubble layout (user right, AI left)
- Implement smooth message streaming for AI responses
- Support markdown rendering with syntax highlighting
- Show timestamps on hover/long press to reduce clutter

### Conversation Management
- Implement conversation search with context highlighting
- Use infinite scroll with intelligent loading
- Provide conversation export functionality
- Support conversation branching for different topics

### Interaction Patterns
- Copy message content with single tap
- Regenerate AI responses with clear affordances
- Support message reactions with emoji picker
- Enable voice input with visual feedback

### Performance Considerations
- Virtualize long conversation lists
- Lazy load message history
- Optimize for 60fps scrolling
- Implement efficient real-time updates

## Important Files
- `biome.json` - Code formatting and linting rules
- `apps/frontend/components.json` - shadcn/ui configuration
- `apps/frontend/react-router.config.ts` - React Router configuration
- `apps/frontend/app/routes.ts` - Route definitions