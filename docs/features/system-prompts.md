# System Prompts Management

## Overview
The System Prompts feature provides a comprehensive management system for creating, organizing, and utilizing reusable prompt templates that ensure consistent AI behavior across conversations and applications.

## Features

### Prompt Management
- **Template Creation**: Rich text editor for creating and editing system prompts
- **Categorization**: Organize prompts by purpose (Chat, Analysis, Creative, Technical, etc.)
- **Variable Support**: Dynamic placeholder system for customizable prompts
- **Version Control**: Track prompt changes and maintain version history
- **Import/Export**: Share prompts between users and environments

### Advanced Features
- **Prompt Chaining**: Sequential prompt application for complex workflows
- **Conditional Logic**: Dynamic prompt selection based on context
- **A/B Testing**: Compare prompt effectiveness with built-in testing
- **Usage Analytics**: Track prompt performance and adoption
- **Collaboration**: Share and collaborate on prompt development

### Integration Points
- **Chat Integration**: Seamless application to chat conversations
- **API Integration**: Use prompts with custom API endpoints
- **Automation**: Integration with workflow automation system
- **Model Binding**: Associate prompts with specific AI models

## Backend Architecture

### API Endpoints
```
GET /api/system-prompts                    # List user prompts
POST /api/system-prompts                   # Create new prompt
GET /api/system-prompts/:id                # Get specific prompt
PUT /api/system-prompts/:id                # Update prompt
DELETE /api/system-prompts/:id             # Delete prompt

GET /api/system-prompts/categories         # List available categories
POST /api/system-prompts/:id/duplicate     # Duplicate prompt
GET /api/system-prompts/:id/usage          # Get usage statistics
POST /api/system-prompts/:id/test          # Test prompt with sample input

GET /api/system-prompts/templates          # Get prompt templates
POST /api/system-prompts/import            # Import prompts from file
GET /api/system-prompts/export             # Export prompts
```

### Database Schema
```sql
-- System Prompts table
CREATE TABLE system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  variables JSONB DEFAULT '[]',
  tags TEXT[],
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

-- Prompt Categories table
CREATE TABLE prompt_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INTEGER DEFAULT 0
);

-- Prompt Variables table
CREATE TABLE prompt_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES system_prompts(id),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL DEFAULT 'text',
  default_value TEXT,
  required BOOLEAN DEFAULT false,
  validation_rules JSONB
);

-- Prompt Usage Analytics table
CREATE TABLE prompt_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES system_prompts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  context_type VARCHAR(100), -- 'chat', 'api', 'automation'
  used_at TIMESTAMP DEFAULT NOW(),
  variables_used JSONB,
  satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5)
);
```

### System Prompt Service
```typescript
interface SystemPrompt {
  id: string;
  userId: string;
  title: string;
  description?: string;
  content: string;
  category: string;
  variables: PromptVariable[];
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

interface PromptVariable {
  name: string;
  description?: string;
  type: 'text' | 'number' | 'boolean' | 'select' | 'multiline';
  defaultValue?: string;
  required: boolean;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    options?: string[];
  };
}

class SystemPromptService {
  async createPrompt(data: CreatePromptRequest): Promise<SystemPrompt>
  async updatePrompt(id: string, data: UpdatePromptRequest): Promise<SystemPrompt>
  async deletePrompt(id: string, userId: string): Promise<void>
  async duplicatePrompt(id: string, userId: string): Promise<SystemPrompt>
  async processPrompt(promptId: string, variables: Record<string, any>): Promise<string>
  async getUsageStats(promptId: string): Promise<PromptUsageStats>
  async recordUsage(promptId: string, userId: string, context: UsageContext): Promise<void>
}
```

### Variable Processing
```typescript
class PromptProcessor {
  processVariables(content: string, variables: Record<string, any>): string {
    let processed = content;

    // Replace {{variable}} placeholders
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      processed = processed.replace(placeholder, String(value));
    }

    // Handle conditional blocks {{#if variable}}...{{/if}}
    processed = this.processConditionals(processed, variables);

    // Handle loops {{#each array}}...{{/each}}
    processed = this.processLoops(processed, variables);

    return processed;
  }

  validateVariables(prompt: SystemPrompt, variables: Record<string, any>): ValidationResult {
    const errors: string[] = [];

    for (const variable of prompt.variables) {
      const value = variables[variable.name];

      if (variable.required && (value === undefined || value === '')) {
        errors.push(`Required variable '${variable.name}' is missing`);
        continue;
      }

      if (value !== undefined) {
        const validationError = this.validateVariable(variable, value);
        if (validationError) {
          errors.push(validationError);
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }
}
```

## Frontend Architecture

### Core Components

#### Prompt Management (`/features/system-prompts/`)
- **SystemPromptList**: Display and manage all user prompts
- **AddNewSystemPrompt**: Create new prompt wizard
- **SystemPromptForm**: Rich editor for prompt creation/editing
- **PromptPreview**: Real-time preview with variable substitution

#### Prompt Editor
- **RichTextEditor**: Advanced text editor with syntax highlighting
- **VariableManager**: Define and manage prompt variables
- **CategorySelector**: Select and manage prompt categories
- **TagEditor**: Add and manage prompt tags

#### Integration Components
- **PromptSelector**: Select prompts for use in chat/API
- **VariableInput**: Dynamic form for prompt variables
- **PromptTester**: Test prompts with sample data
- **UsageAnalytics**: Display prompt usage statistics

### State Management
```typescript
interface SystemPromptStore {
  prompts: SystemPrompt[];
  categories: PromptCategory[];
  selectedPrompt: SystemPrompt | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  selectedCategory: string | null;
}

interface PromptEditorStore {
  currentPrompt: Partial<SystemPrompt>;
  variables: PromptVariable[];
  previewData: Record<string, any>;
  isDirty: boolean;
  validationErrors: string[];
}
```

### Hooks
```typescript
// Prompt management
useSystemPrompts(userId: string)
useSystemPrompt(promptId: string)
useCreateSystemPrompt()
useUpdateSystemPrompt()
useDeleteSystemPrompt()

// Categories and organization
usePromptCategories()
usePromptsByCategory(category: string)
usePromptSearch(query: string)

// Usage and analytics
usePromptUsage(promptId: string)
usePopularPrompts(userId: string)
usePromptStats(promptId: string)

// Variable processing
usePromptProcessor()
useVariableValidation(prompt: SystemPrompt)
```

## Prompt Templates & Categories

### Built-in Categories
```typescript
const defaultCategories: PromptCategory[] = [
  {
    name: 'Chat',
    description: 'General conversation and chat assistance',
    icon: 'MessageCircle',
    color: 'blue'
  },
  {
    name: 'Analysis',
    description: 'Data analysis and interpretation',
    icon: 'BarChart',
    color: 'green'
  },
  {
    name: 'Creative',
    description: 'Creative writing and content generation',
    icon: 'Palette',
    color: 'purple'
  },
  {
    name: 'Technical',
    description: 'Programming and technical assistance',
    icon: 'Code',
    color: 'orange'
  },
  {
    name: 'Education',
    description: 'Learning and educational content',
    icon: 'Book',
    color: 'indigo'
  }
];
```

### Template Examples
```typescript
const promptTemplates = {
  codeReviewer: {
    title: 'Code Reviewer',
    category: 'Technical',
    content: `You are an expert code reviewer. Review the following {{language}} code and provide:

1. Code quality assessment
2. Potential bugs or issues
3. Performance improvements
4. Best practice recommendations

Code to review:
{{code}}

{{#if includeTests}}
Also suggest appropriate unit tests for this code.
{{/if}}`,
    variables: [
      { name: 'language', type: 'select', options: ['JavaScript', 'Python', 'TypeScript'], required: true },
      { name: 'code', type: 'multiline', required: true },
      { name: 'includeTests', type: 'boolean', defaultValue: 'false' }
    ]
  },

  dataAnalyst: {
    title: 'Data Analyst',
    category: 'Analysis',
    content: `You are a data analyst. Analyze the following dataset and provide insights:

Dataset: {{dataset}}
Analysis focus: {{focus}}

Please provide:
1. Key findings and patterns
2. Statistical summary
3. Recommendations based on the data
4. Visualization suggestions

{{#if includeCode}}
Include Python/R code for the analysis.
{{/if}}`,
    variables: [
      { name: 'dataset', type: 'multiline', required: true },
      { name: 'focus', type: 'text', required: true },
      { name: 'includeCode', type: 'boolean', defaultValue: 'false' }
    ]
  }
};
```

## Variable System

### Variable Types
```typescript
type VariableType = 'text' | 'number' | 'boolean' | 'select' | 'multiline' | 'date' | 'url';

interface VariableDefinition {
  name: string;
  type: VariableType;
  description?: string;
  required: boolean;
  defaultValue?: any;
  validationRules?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
}
```

### Advanced Variable Features
```typescript
// Conditional variables
{{#if userRole === 'admin'}}
Administrative instructions: {{adminInstructions}}
{{else}}
Standard user instructions: {{userInstructions}}
{{/if}}

// Loop variables
{{#each items}}
- Process item: {{this.name}} ({{this.type}})
{{/each}}

// Computed variables
Current date: {{now}}
User name: {{user.name}}
Character count: {{text.length}}
```

## Integration Examples

### Chat Integration
```typescript
// Apply system prompt to chat session
async function applyChatPrompt(sessionId: string, promptId: string, variables: Record<string, any>) {
  const prompt = await systemPromptService.getPrompt(promptId);
  const processedContent = await promptProcessor.process(prompt.content, variables);

  await chatService.addSystemMessage(sessionId, processedContent);
  await systemPromptService.recordUsage(promptId, userId, { type: 'chat', sessionId });
}
```

### API Integration
```typescript
// Use prompt with custom API
async function executeWithPrompt(apiConfigId: string, promptId: string, variables: Record<string, any>) {
  const prompt = await systemPromptService.getPrompt(promptId);
  const systemMessage = await promptProcessor.process(prompt.content, variables);

  const apiConfig = await configurationService.getConfiguration(apiConfigId);
  const response = await apiService.createCompletion(apiConfig, {
    messages: [
      { role: 'system', content: systemMessage },
      { role: 'user', content: variables.userInput }
    ]
  });

  return response;
}
```

## Performance & Optimization

### Caching Strategy
- **Prompt Cache**: Cache frequently used prompts in Redis
- **Processed Prompt Cache**: Cache processed prompts with variable substitutions
- **Category Cache**: Cache category lists and counts
- **Search Index**: Elasticsearch index for fast prompt search

### Variable Processing Optimization
- **Template Compilation**: Pre-compile prompt templates for faster processing
- **Variable Validation**: Cache validation results for repeated variables
- **Lazy Processing**: Only process variables when actually needed

## Security & Privacy

### Access Control
- **User Isolation**: Users can only access their own private prompts
- **Public Prompts**: Controlled sharing of prompts between users
- **Permission Levels**: Read, write, and admin permissions for shared prompts
- **Audit Logging**: Track all prompt access and modifications

### Content Security
- **Input Sanitization**: Sanitize all prompt content and variables
- **XSS Prevention**: Escape variables when rendering in UI
- **Content Filtering**: Optional content filtering for inappropriate content
- **Version Control**: Track changes for security auditing

## Analytics & Insights

### Usage Metrics
```typescript
interface PromptAnalytics {
  totalUsage: number;
  uniqueUsers: number;
  averageRating: number;
  usageByContext: Record<string, number>;
  usageOverTime: TimeSeriesData[];
  topVariables: VariableUsage[];
  performanceMetrics: {
    averageProcessingTime: number;
    errorRate: number;
    successRate: number;
  };
}
```

### Popular Prompts
- **Trending Prompts**: Most used prompts in recent period
- **Top Rated**: Highest rated prompts by users
- **Recent Activity**: Recently created or updated prompts
- **Community Favorites**: Most shared and liked public prompts

## Development Guidelines

### Creating New Prompt Types
1. Define variable schema and validation rules
2. Create template with proper variable placeholders
3. Implement any custom processing logic
4. Add category and tags for organization
5. Write comprehensive tests
6. Document usage examples

### Best Practices
- Use descriptive variable names and descriptions
- Provide sensible default values for optional variables
- Implement proper validation for all variable types
- Keep prompts focused and modular
- Use clear, consistent language in prompt content

### Testing Strategy
- Unit test variable processing and validation
- Integration test prompt application in chat/API contexts
- Test template compilation and caching
- Performance test with large numbers of prompts
- E2E test complete prompt creation and usage workflows