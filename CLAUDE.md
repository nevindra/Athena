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
- Real-time chat functionality with streaming AI responses

**Backend API**
- High-performance Elysia server running on Bun runtime
- RESTful API for AI model configuration management
- Database integration with Drizzle ORM and PostgreSQL
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

## Architecture Notes

### Backend (Elysia)
- Simple REST API server on port 3000
- Built with Elysia framework running on Bun
- No transpilation needed - runs TypeScript natively

### Frontend (React Router v7)
- Uses shadcn/ui component library with Radix UI primitives
- Tailwind CSS for styling with custom configuration
- File-based routing in `app/routes/` directory
- Component-Driven Development architecture:
  - `app/components/`: Small, reusable UI components (individual LEGO bricks). Create dedicated directory to manage.
  - `app/features/`: Large, feature-specific sections and complex components (pre-assembled LEGO sections) Create dedicated directory to manage.
  - `app/routes/`: Complete pages assembled from features (final LEGO model)

### Code Standards
- Biome configuration enforces:
  - Double quotes for strings
  - Semicolons required
- TypeScript strict mode enabled
- Path aliases configured: `~` maps to `app/` directory in frontend

## UI Design Guidelines

### Design Aesthetic: Sleek Minimalism with Apple Consistency

**Visual System (Linear/Airbnb Inspired)**
- **Typography**: Clean, readable fonts with generous line spacing and subtle weight variations
- **Spacing**: Generous whitespace using 8px grid system, breathable layouts that feel uncluttered
- **Colors**: Sophisticated neutral palette with purposeful accent colors, excellent contrast ratios
- **Surfaces**: Clean backgrounds, subtle borders (1px), minimal shadows for depth when needed

**Apple-Level Consistency**
- **Predictable Patterns**: Every similar element behaves identically across the entire application
- **Systematic Design**: Consistent button styles, form patterns, and interaction states
- **Seamless Theming**: Flawless light/dark mode transitions with semantic color tokens
- **Polished Details**: Perfect alignment, consistent corner radius (6px-12px), and refined micro-interactions

**Modern Interaction Design**
- **Micro-animations**: Subtle, fast transitions (150-300ms) that feel natural and purposeful
- **Progressive Disclosure**: Clean information hierarchy that reveals complexity gradually
- **Touch Targets**: Generous interactive areas (44px minimum) with clear hover/focus states
- **Feedback Systems**: Instant visual confirmation for actions with elegant loading states

### Essential UX Principles

**Fitts's Law**: Position primary actions prominently with adequate sizing and convenient placement

**Hick's Law**: Streamline choices through clean navigation and contextual feature disclosure

**Jakob's Law**: Leverage familiar patterns while elevating them with refined execution

**Gestalt Principles**: Create visual harmony through strategic grouping and consistent styling

## Core Features

### AI Chat System
Interactive chat interface with streaming AI responses, session management, and message history. Uses configured AI models and system prompts for contextual conversations.

### Model Management
Configure and manage AI providers (OpenAI, Gemini, Ollama, custom APIs) with secure API key storage, connection testing, and provider-specific settings.

### System Prompts
Create and manage reusable system prompts for structured outputs, specific topics, and consistent AI behavior across conversations.

### API Management
- **Registration & Monitoring**: Register custom AI APIs, monitor health/performance metrics, track usage patterns
- **History & Analytics**: Detailed API call logs, usage statistics, and performance analysis

### Additional Features
- **Authentication**: Secure user login/signup with session management
- **Knowledge Base**: Document storage and retrieval system
- **Image Generation**: AI-powered image creation tools
- **OCR Reader**: Text extraction from images
- **Automation**: Workflow templates and automation tools

*For detailed technical documentation, see `/docs/features/` directory*
