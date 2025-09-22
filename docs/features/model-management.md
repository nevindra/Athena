# Model Management System

## Overview
The Model Management system provides a centralized configuration interface for AI providers, enabling users to securely manage API credentials, test connections, and configure model-specific settings across multiple AI platforms.

## Features

### Provider Support
- **OpenAI**: Complete GPT model family support with all API features
- **Google Gemini**: Gemini Pro and other Google AI models
- **Ollama**: Local AI model hosting and management
- **Custom HTTP APIs**: Any OpenAI-compatible endpoint integration
- **Extensible Architecture**: Easy addition of new providers

### Configuration Management
- **Secure Credential Storage**: Encrypted API key storage with rotation support
- **Connection Testing**: Real-time validation of provider credentials and connectivity
- **Model Templates**: Pre-configured settings for popular models
- **Custom Parameters**: Provider-specific configuration options
- **Usage Tracking**: Monitor API calls, costs, and rate limits

### Advanced Features
- **Multi-provider Switching**: Seamless switching between providers within conversations
- **Fallback Configuration**: Automatic failover to backup providers
- **Load Balancing**: Distribute requests across multiple instances
- **Cost Optimization**: Intelligent routing based on cost and performance

## Backend Architecture

### API Endpoints
```
GET /api/configurations                     # List user configurations
POST /api/configurations                    # Create new configuration
GET /api/configurations/:id                 # Get specific configuration
PUT /api/configurations/:id                 # Update configuration
DELETE /api/configurations/:id              # Delete configuration

POST /api/configurations/:id/test           # Test provider connection
GET /api/configurations/:id/usage           # Get usage statistics
POST /api/configurations/:id/rotate-key     # Rotate API key

GET /api/providers                          # List supported providers
GET /api/providers/:name/models             # Get available models for provider
GET /api/providers/:name/schema             # Get configuration schema
```

### Database Schema
```sql
-- AI Configurations table
CREATE TABLE ai_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  model VARCHAR(255),
  api_key_encrypted TEXT,
  base_url VARCHAR(500),
  configuration JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_tested_at TIMESTAMP,
  test_status VARCHAR(50)
);

-- Provider Usage table
CREATE TABLE provider_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  configuration_id UUID NOT NULL REFERENCES ai_configurations(id),
  request_count INTEGER DEFAULT 0,
  token_count INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  last_used_at TIMESTAMP DEFAULT NOW(),
  period_start DATE DEFAULT CURRENT_DATE,
  period_end DATE DEFAULT CURRENT_DATE
);

-- Provider Templates table
CREATE TABLE provider_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  configuration JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Configuration Service
```typescript
interface AIConfiguration {
  id: string;
  userId: string;
  name: string;
  provider: AIProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
  configuration: Record<string, any>;
  isActive: boolean;
  lastTested?: Date;
  testStatus?: 'success' | 'failed' | 'pending';
}

class ConfigurationService {
  async createConfiguration(data: CreateConfigurationRequest): Promise<AIConfiguration>
  async updateConfiguration(id: string, data: UpdateConfigurationRequest): Promise<AIConfiguration>
  async testConfiguration(id: string): Promise<TestResult>
  async getUsageStats(id: string, period: TimePeriod): Promise<UsageStats>
  async rotateApiKey(id: string): Promise<void>
  async validateProvider(provider: AIProvider, config: any): Promise<ValidationResult>
}
```

### Encryption Service
```typescript
class EncryptionService {
  async encryptApiKey(apiKey: string, userId: string): Promise<string>
  async decryptApiKey(encryptedKey: string, userId: string): Promise<string>
  async rotateUserKey(userId: string): Promise<void>
  async migrateEncryption(oldKey: string, newKey: string): Promise<void>
}
```

## Frontend Architecture

### Core Components

#### Configuration Management (`/features/models/`)
- **ConfigurationList**: Display and manage all user configurations
- **AddNewConfiguration**: Wizard for creating new configurations
- **ProviderSelection**: Provider type selection interface
- **ProviderConfig**: Provider-specific configuration forms

#### Provider Forms
- **OpenAIConfig**: OpenAI-specific settings and model selection
- **GeminiConfig**: Google Gemini configuration interface
- **OllamaConfig**: Local Ollama setup and model management
- **CustomAPIConfig**: Generic HTTP API configuration

#### Testing & Validation
- **ConnectionTester**: Real-time connection testing component
- **ConfigurationValidator**: Form validation and error handling
- **UsageDisplay**: Usage statistics and cost tracking

### State Management
```typescript
interface ModelStore {
  configurations: AIConfiguration[];
  selectedConfig: AIConfiguration | null;
  isLoading: boolean;
  testResults: Record<string, TestResult>;
  usageStats: Record<string, UsageStats>;
}

interface ProviderStore {
  supportedProviders: Provider[];
  availableModels: Record<string, Model[]>;
  templates: Record<string, Template[]>;
}
```

### Hooks
```typescript
// Configuration management
useConfigurations(userId: string)
useConfiguration(configId: string)
useCreateConfiguration()
useUpdateConfiguration()
useDeleteConfiguration()

// Testing and validation
useTestConnection(configId: string)
useValidateConfiguration(provider: AIProvider)
useUsageStats(configId: string, period: TimePeriod)

// Provider information
useProviders()
useProviderModels(provider: AIProvider)
useProviderTemplates(provider: AIProvider)
```

## Provider Integration

### OpenAI Integration
```typescript
class OpenAIProvider implements AIProvider {
  name = 'openai';

  async testConnection(config: OpenAIConfig): Promise<boolean> {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${config.apiKey}` }
    });
    return response.ok;
  }

  async getAvailableModels(config: OpenAIConfig): Promise<Model[]> {
    // Fetch and return available models
  }

  async createCompletion(config: OpenAIConfig, request: ChatRequest): Promise<ChatResponse> {
    // Handle chat completion
  }
}
```

### Google Gemini Integration
```typescript
class GeminiProvider implements AIProvider {
  name = 'gemini';

  async testConnection(config: GeminiConfig): Promise<boolean> {
    // Gemini-specific connection testing
  }

  async createCompletion(config: GeminiConfig, request: ChatRequest): Promise<ChatResponse> {
    // Convert to Gemini format and handle response
  }
}
```

### Ollama Integration
```typescript
class OllamaProvider implements AIProvider {
  name = 'ollama';

  async testConnection(config: OllamaConfig): Promise<boolean> {
    const response = await fetch(`${config.baseUrl}/api/tags`);
    return response.ok;
  }

  async getLocalModels(config: OllamaConfig): Promise<Model[]> {
    // Get locally installed models
  }

  async pullModel(config: OllamaConfig, modelName: string): Promise<void> {
    // Download and install model
  }
}
```

## Security Implementation

### API Key Encryption
```typescript
// AES-256-GCM encryption with user-specific keys
class ApiKeyEncryption {
  private async getUserKey(userId: string): Promise<string> {
    // Derive user-specific encryption key
  }

  async encrypt(plaintext: string, userId: string): Promise<string> {
    const key = await this.getUserKey(userId);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipher = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      await this.importKey(key),
      new TextEncoder().encode(plaintext)
    );
    return this.encodeEncryptedData(cipher, iv);
  }

  async decrypt(ciphertext: string, userId: string): Promise<string> {
    const key = await this.getUserKey(userId);
    const { data, iv } = this.decodeEncryptedData(ciphertext);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      await this.importKey(key),
      data
    );
    return new TextDecoder().decode(plaintext);
  }
}
```

### Access Control
- **User Isolation**: Configurations are strictly user-scoped
- **Permission Validation**: Server-side permission checks for all operations
- **Audit Logging**: Track all configuration changes and access attempts
- **Rate Limiting**: Prevent abuse of testing and API operations

## Configuration Schemas

### Provider Configuration Types
```typescript
interface OpenAIConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  organizationId?: string;
}

interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature?: number;
  topK?: number;
  topP?: number;
  maxOutputTokens?: number;
  safetySettings?: SafetySetting[];
}

interface OllamaConfig {
  baseUrl: string;
  model: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  repeatPenalty?: number;
  seed?: number;
}

interface CustomAPIConfig {
  baseUrl: string;
  apiKey?: string;
  headers?: Record<string, string>;
  model: string;
  parameters?: Record<string, any>;
}
```

### Validation Schemas
```typescript
// Zod schemas for runtime validation
const openAIConfigSchema = z.object({
  apiKey: z.string().min(1),
  model: z.string().min(1),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().min(1).max(4096).optional(),
  // ... other fields
});

const geminiConfigSchema = z.object({
  apiKey: z.string().min(1),
  model: z.enum(['gemini-pro', 'gemini-pro-vision']),
  temperature: z.number().min(0).max(1).optional(),
  // ... other fields
});
```

## Performance & Optimization

### Caching Strategy
- **Configuration Cache**: Cache frequently accessed configurations
- **Model List Cache**: Cache provider model lists with TTL
- **Connection Status Cache**: Cache test results to avoid repeated calls
- **Usage Stats Cache**: Cache usage statistics for dashboard display

### Request Optimization
- **Connection Pooling**: Reuse HTTP connections for provider APIs
- **Request Batching**: Batch multiple model requests when possible
- **Response Compression**: Enable gzip compression for API responses
- **Error Retry Logic**: Implement exponential backoff for failed requests

## Monitoring & Analytics

### Usage Tracking
```typescript
interface UsageMetrics {
  requestCount: number;
  tokenCount: number;
  costUSD: number;
  averageLatency: number;
  errorRate: number;
  lastUsed: Date;
}

class UsageTracker {
  async recordUsage(configId: string, metrics: RequestMetrics): Promise<void>
  async getUsageStats(configId: string, period: TimePeriod): Promise<UsageMetrics>
  async generateUsageReport(userId: string, period: TimePeriod): Promise<UsageReport>
}
```

### Health Monitoring
- **Connection Health**: Regular health checks for all configurations
- **Performance Metrics**: Track response times and success rates
- **Alert System**: Notify users of configuration issues
- **Status Dashboard**: Real-time status display for all providers

## Development Guidelines

### Adding New Providers
1. Implement the `AIProvider` interface
2. Create provider-specific configuration schema
3. Add provider to the registry
4. Create frontend configuration component
5. Write comprehensive tests
6. Update documentation

### Configuration Best Practices
- Always validate configurations before saving
- Use proper TypeScript types for all configurations
- Implement proper error handling and user feedback
- Cache expensive operations like model lists
- Log all configuration changes for audit purposes

### Testing Strategy
- Unit test all provider implementations
- Integration test configuration CRUD operations
- Test encryption/decryption functionality
- E2E test complete configuration workflows
- Load test provider API integrations

## Troubleshooting Guide

### Common Issues
- **Invalid API Keys**: Check key format and permissions
- **Connection Timeouts**: Verify network connectivity and provider status
- **Model Unavailability**: Check model availability and quotas
- **Rate Limiting**: Implement proper backoff and retry logic
- **Configuration Conflicts**: Validate configuration schemas