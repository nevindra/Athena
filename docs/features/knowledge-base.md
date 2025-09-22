# Knowledge Base System

## Overview
The Knowledge Base provides intelligent document storage, processing, and retrieval capabilities with AI-powered search and integration with chat conversations.

## Features

### Document Management
- **Multi-format Support**: PDF, DOCX, TXT, MD, and other text-based formats
- **Automatic Processing**: Text extraction, parsing, and indexing
- **Metadata Extraction**: Author, creation date, file size, and content analysis
- **Version Control**: Track document versions and changes
- **Organization**: Folders, tags, and categories for document organization

### AI-Powered Search
- **Semantic Search**: Vector-based similarity search using embeddings
- **Full-text Search**: Traditional keyword-based search with advanced filters
- **Hybrid Search**: Combination of semantic and keyword search
- **Context Awareness**: Search results ranked by relevance to current context
- **Query Expansion**: Automatic query enhancement for better results

### Chat Integration
- **Context Injection**: Automatically include relevant documents in chat context
- **Source Citations**: Link chat responses to source documents
- **Real-time Search**: Search knowledge base during conversations
- **Document Q&A**: Ask questions directly about specific documents

## Backend Architecture

### API Endpoints
```
GET /api/knowledge-base/documents          # List documents
POST /api/knowledge-base/documents         # Upload document
GET /api/knowledge-base/documents/:id      # Get document
PUT /api/knowledge-base/documents/:id      # Update document
DELETE /api/knowledge-base/documents/:id   # Delete document

POST /api/knowledge-base/search            # Search documents
GET /api/knowledge-base/search/suggestions # Get search suggestions
POST /api/knowledge-base/extract-text      # Extract text from file

GET /api/knowledge-base/folders            # List folders
POST /api/knowledge-base/folders           # Create folder
PUT /api/knowledge-base/folders/:id        # Update folder
DELETE /api/knowledge-base/folders/:id     # Delete folder

GET /api/knowledge-base/tags               # List tags
POST /api/knowledge-base/tags              # Create tag
GET /api/knowledge-base/analytics          # Usage analytics
```

### Database Schema
```sql
-- Documents table
CREATE TABLE kb_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  folder_id UUID REFERENCES kb_folders(id),
  title VARCHAR(255) NOT NULL,
  filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  content_type VARCHAR(100),
  file_size INTEGER,
  content_text TEXT,
  content_embedding VECTOR(1536), -- OpenAI embeddings
  metadata JSONB DEFAULT '{}',
  extracted_at TIMESTAMP,
  indexed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Folders table
CREATE TABLE kb_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  parent_id UUID REFERENCES kb_folders(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tags table
CREATE TABLE kb_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Document Tags junction table
CREATE TABLE kb_document_tags (
  document_id UUID REFERENCES kb_documents(id),
  tag_id UUID REFERENCES kb_tags(id),
  PRIMARY KEY (document_id, tag_id)
);

-- Search Analytics table
CREATE TABLE kb_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  query VARCHAR(500),
  results_count INTEGER,
  clicked_document_id UUID REFERENCES kb_documents(id),
  search_type VARCHAR(50), -- 'semantic', 'fulltext', 'hybrid'
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Document Processing Service
```typescript
interface KBDocument {
  id: string;
  userId: string;
  folderId?: string;
  title: string;
  filename: string;
  filePath: string;
  contentType: string;
  fileSize: number;
  contentText?: string;
  contentEmbedding?: number[];
  metadata: Record<string, any>;
  extractedAt?: Date;
  indexedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

class DocumentProcessingService {
  async uploadDocument(file: File, userId: string, folderId?: string): Promise<KBDocument>
  async extractText(filePath: string, contentType: string): Promise<string>
  async generateEmbeddings(text: string): Promise<number[]>
  async indexDocument(documentId: string): Promise<void>
  async updateDocument(documentId: string, updates: Partial<KBDocument>): Promise<KBDocument>
  async deleteDocument(documentId: string): Promise<void>
  async getDocumentsByFolder(folderId: string): Promise<KBDocument[]>
}
```

### Text Extraction
```typescript
class TextExtractionService {
  async extractFromPDF(filePath: string): Promise<string> {
    const pdf = await pdfParse(fs.readFileSync(filePath));
    return pdf.text;
  }

  async extractFromDOCX(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  async extractFromMarkdown(filePath: string): Promise<string> {
    const content = fs.readFileSync(filePath, 'utf-8');
    return marked.parse(content, { renderer: new marked.Renderer() });
  }

  async extractMetadata(filePath: string, contentType: string): Promise<DocumentMetadata> {
    const stats = fs.statSync(filePath);
    const metadata: DocumentMetadata = {
      fileSize: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      contentType
    };

    // Extract additional metadata based on file type
    if (contentType === 'application/pdf') {
      const pdfInfo = await this.extractPDFMetadata(filePath);
      metadata.author = pdfInfo.author;
      metadata.title = pdfInfo.title;
      metadata.pageCount = pdfInfo.pageCount;
    }

    return metadata;
  }
}
```

## Search Implementation

### Vector Search Service
```typescript
class VectorSearchService {
  private embeddingModel = 'text-embedding-ada-002';

  async generateEmbedding(text: string): Promise<number[]> {
    const response = await openai.embeddings.create({
      model: this.embeddingModel,
      input: text
    });
    return response.data[0].embedding;
  }

  async semanticSearch(query: string, userId: string, limit = 10): Promise<SearchResult[]> {
    const queryEmbedding = await this.generateEmbedding(query);

    const results = await this.db.query(`
      SELECT
        d.*,
        1 - (d.content_embedding <=> $1) as similarity
      FROM kb_documents d
      WHERE d.user_id = $2
        AND d.content_embedding IS NOT NULL
      ORDER BY d.content_embedding <=> $1
      LIMIT $3
    `, [JSON.stringify(queryEmbedding), userId, limit]);

    return results.rows.map(row => ({
      document: row,
      similarity: row.similarity,
      searchType: 'semantic'
    }));
  }

  async fullTextSearch(query: string, userId: string, limit = 10): Promise<SearchResult[]> {
    const results = await this.db.query(`
      SELECT
        d.*,
        ts_rank(to_tsvector('english', d.content_text), plainto_tsquery('english', $1)) as rank
      FROM kb_documents d
      WHERE d.user_id = $2
        AND to_tsvector('english', d.content_text) @@ plainto_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT $3
    `, [query, userId, limit]);

    return results.rows.map(row => ({
      document: row,
      rank: row.rank,
      searchType: 'fulltext'
    }));
  }

  async hybridSearch(query: string, userId: string, limit = 10): Promise<SearchResult[]> {
    const [semanticResults, fulltextResults] = await Promise.all([
      this.semanticSearch(query, userId, limit),
      this.fullTextSearch(query, userId, limit)
    ]);

    // Combine and re-rank results
    return this.combineSearchResults(semanticResults, fulltextResults, limit);
  }
}
```

### Search Analytics
```typescript
class SearchAnalyticsService {
  async trackSearch(userId: string, query: string, searchType: string, resultsCount: number): Promise<void>
  async trackClick(userId: string, query: string, documentId: string): Promise<void>
  async getPopularQueries(userId: string, period: TimePeriod): Promise<QueryStats[]>
  async getSearchMetrics(userId: string): Promise<SearchMetrics>
  async getRecommendations(userId: string): Promise<KBDocument[]>
}
```

## Frontend Architecture

### Core Components

#### Document Management (`/features/knowledge-base/`)
- **DocumentList**: Display and manage documents with filtering/sorting
- **DocumentUpload**: Drag-and-drop file upload with progress
- **DocumentViewer**: Preview documents with text extraction
- **FolderTree**: Hierarchical folder navigation
- **TagManager**: Create and assign tags to documents

#### Search Interface
- **SearchBar**: Advanced search with filters and suggestions
- **SearchResults**: Display search results with relevance scoring
- **SearchFilters**: Filter by type, date, folder, tags
- **SearchHistory**: Recent searches and popular queries

#### Chat Integration
- **KnowledgeBasePanel**: Search and browse during chat
- **ContextSelector**: Select documents to include in chat context
- **SourceCitations**: Display source documents in chat responses

### State Management
```typescript
interface KnowledgeBaseStore {
  documents: KBDocument[];
  folders: KBFolder[];
  tags: KBTag[];
  searchResults: SearchResult[];
  selectedDocuments: string[];
  currentFolder: string | null;
  searchQuery: string;
  searchFilters: SearchFilters;
  isLoading: boolean;
}

interface SearchFilters {
  contentType?: string[];
  tags?: string[];
  dateRange?: DateRange;
  folderId?: string;
  minFileSize?: number;
  maxFileSize?: number;
}
```

### Hooks
```typescript
// Document management
useKBDocuments(userId: string, folderId?: string)
useKBDocument(documentId: string)
useUploadDocument()
useDeleteDocument()
useUpdateDocument()

// Search functionality
useKBSearch(query: string, filters?: SearchFilters)
useSearchSuggestions(query: string)
useSearchHistory(userId: string)

// Organization
useKBFolders(userId: string)
useKBTags(userId: string)
useCreateFolder()
useCreateTag()

// Analytics
useSearchAnalytics(userId: string)
useRecommendations(userId: string)
```

## Chat Integration

### Context Injection
```typescript
class ChatContextService {
  async injectKnowledgeContext(sessionId: string, query: string): Promise<void> {
    const relevantDocs = await this.searchService.semanticSearch(query, userId, 3);

    if (relevantDocs.length > 0) {
      const contextMessage = this.buildContextMessage(relevantDocs);
      await this.chatService.addSystemMessage(sessionId, contextMessage);
    }
  }

  private buildContextMessage(documents: SearchResult[]): string {
    const context = documents.map(result => ({
      title: result.document.title,
      content: this.truncateContent(result.document.contentText, 500),
      source: result.document.filename
    }));

    return `Context from knowledge base:
${context.map((doc, i) => `
${i + 1}. ${doc.title}
${doc.content}
Source: ${doc.source}
`).join('\n')}

Please use this context to inform your response when relevant.`;
  }
}
```

### Document Q&A
```typescript
class DocumentQAService {
  async askDocument(documentId: string, question: string, userId: string): Promise<QAResponse> {
    const document = await this.documentService.getDocument(documentId);

    if (!document || document.userId !== userId) {
      throw new Error('Document not found or access denied');
    }

    const context = this.prepareDocumentContext(document);
    const aiConfig = await this.configService.getDefaultConfig(userId);

    const response = await this.aiService.createCompletion(aiConfig, {
      messages: [
        {
          role: 'system',
          content: `You are answering questions about the following document:
Title: ${document.title}
Content: ${context}

Please answer based only on the information in this document.`
        },
        {
          role: 'user',
          content: question
        }
      ]
    });

    return {
      answer: response.content,
      sourceDocument: document,
      confidence: this.calculateConfidence(question, context)
    };
  }
}
```

## File Storage & Management

### Storage Service
```typescript
class KBStorageService {
  private readonly uploadDir = process.env.KB_UPLOAD_DIR || './uploads/kb';
  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  private readonly allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ];

  async storeFile(file: File, userId: string): Promise<string> {
    this.validateFile(file);

    const fileId = uuid();
    const extension = path.extname(file.name);
    const fileName = `${fileId}${extension}`;
    const filePath = path.join(this.uploadDir, userId, fileName);

    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, file.buffer);

    return filePath;
  }

  async deleteFile(filePath: string): Promise<void> {
    if (await fs.pathExists(filePath)) {
      await fs.remove(filePath);
    }
  }

  private validateFile(file: File): void {
    if (file.size > this.maxFileSize) {
      throw new Error(`File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB`);
    }

    if (!this.allowedTypes.includes(file.type)) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }
  }
}
```

## Performance Optimization

### Indexing Strategy
```sql
-- Full-text search index
CREATE INDEX kb_documents_content_fts_idx ON kb_documents
USING GIN (to_tsvector('english', content_text));

-- Vector similarity index (using pgvector)
CREATE INDEX kb_documents_embedding_idx ON kb_documents
USING ivfflat (content_embedding vector_cosine_ops) WITH (lists = 100);

-- Metadata search indexes
CREATE INDEX kb_documents_user_folder_idx ON kb_documents (user_id, folder_id);
CREATE INDEX kb_documents_created_at_idx ON kb_documents (created_at);
CREATE INDEX kb_documents_content_type_idx ON kb_documents (content_type);
```

### Caching Strategy
- **Search Results Cache**: Cache frequent search queries
- **Document Content Cache**: Cache processed document content
- **Embedding Cache**: Cache generated embeddings
- **Metadata Cache**: Cache document metadata and folder structure

## Security & Privacy

### Access Control
- **User Isolation**: Users can only access their own documents
- **Folder Permissions**: Hierarchical access control for folders
- **Secure Upload**: Validate and sanitize all uploaded files
- **Content Scanning**: Optional virus and malware scanning

### Data Protection
- **Encryption**: Encrypt sensitive document content at rest
- **Backup**: Regular backups of documents and metadata
- **Retention**: Configurable data retention policies
- **Export**: Allow users to export their data

## Development Guidelines

### Adding New File Types
1. Add content type to allowed types list
2. Implement text extraction method
3. Add metadata extraction logic
4. Update file validation rules
5. Test extraction and indexing
6. Update documentation

### Search Improvements
- Implement query expansion and synonyms
- Add search result ranking algorithms
- Optimize vector similarity search
- Add search result clustering
- Implement search personalization

### Testing Strategy
- Unit test text extraction for all supported formats
- Integration test search functionality
- Test file upload and processing pipeline
- Performance test with large document collections
- E2E test chat integration workflows