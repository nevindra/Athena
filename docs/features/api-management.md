# API Management System

## Overview
The API Management system allows users to register, monitor, and manage custom AI API endpoints. It provides comprehensive monitoring, analytics, and health tracking capabilities.

## Features

### API Registration
- **Custom Endpoint Registration**: Users can register any HTTP API that follows the chat completion format
- **Configuration Binding**: APIs are bound to specific AI configurations and optional system prompts
- **API Key Management**: Secure storage and management of API keys with encryption
- **Base URL Configuration**: Flexible endpoint configuration with automatic `/chat` path appending

### Monitoring Dashboard (`/api-management/monitor`)
- **Real-time Health Status**: Online/offline/warning status indicators
- **Performance Metrics**: Response times, success rates, error rates
- **Summary Cards**: Total APIs, online count, average response time, request volume
- **Visual Analytics**: Trend indicators and performance comparisons
- **Interactive Management**: Edit, delete, view documentation for each API

### History & Analytics (`/api-management/history`)
- **Detailed Call Logs**: Complete history of API calls with timestamps
- **Usage Patterns**: Track frequency and usage trends over time
- **Performance Analysis**: Response time analysis and error tracking
- **Export Capabilities**: Data export for external analysis

## Backend Architecture

### Database Schema
- **API Registrations Table**: Stores endpoint configurations, keys, and metadata
- **API Metrics Table**: Tracks call logs, response times, and status codes
- **User Association**: APIs are user-scoped for multi-tenant support

### Encryption Service
- **API Key Encryption**: All API keys are encrypted at rest using AES encryption
- **Key Rotation**: Support for rotating encryption keys
- **Secure Retrieval**: Automatic decryption during API calls

### Metrics Collection
- **Real-time Tracking**: Automatic collection of call metrics during API usage
- **Aggregation Engine**: Summarizes data for dashboard display
- **Time-series Data**: Supports various time ranges (24h, 7d, 30d)

## API Endpoints

### Registration Management
- `GET /api/registrations` - List user's API registrations
- `POST /api/registrations` - Create new API registration
- `PUT /api/registrations/:id` - Update existing registration
- `DELETE /api/registrations/:id` - Delete registration

### Metrics & Analytics
- `GET /api/metrics/summary` - Get aggregated metrics for dashboard
- `GET /api/metrics/history` - Get detailed call history
- `GET /api/metrics/:id` - Get metrics for specific API

### Health Monitoring
- `POST /api/health/check` - Manual health check for registered APIs
- `GET /api/health/status` - Current health status of all APIs

## Frontend Components

### Core Components
- **ApiMonitoringDashboard**: Main monitoring interface with cards and metrics
- **ApiSummaryCards**: Summary statistics with trend indicators
- **ApiList**: Registration management with CRUD operations
- **ApiHistoryTable**: Detailed history view with filtering and search

### Shared Components
- **CopyButton**: Reusable component for copying API keys and endpoints
- **ApiDocumentationDialog**: Modal for viewing API documentation
- **Badge System**: Consistent status indicators and labels

## Development Guidelines

### Adding New Metrics
1. Define new metric columns in database schema
2. Update metrics collection service in backend
3. Add metric display to frontend components
4. Update TypeScript types in shared package

### Security Considerations
- All API keys must be encrypted before storage
- Validate user permissions for all API operations
- Sanitize and validate all API endpoint URLs
- Implement rate limiting for API registration endpoints

### Performance Optimization
- Use database indexes for time-series queries
- Implement proper caching for dashboard metrics
- Consider pagination for large history datasets
- Optimize metric aggregation queries
