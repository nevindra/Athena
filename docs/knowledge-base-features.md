# Knowledge Base Features Documentation

## Overview

The Knowledge Base feature in Athena provides a comprehensive file management system designed to organize, store, and manage team files and collaborative knowledge bases. It supports various file types including documents, images, audio, video, and special knowledge base containers.

## Feature Architecture

### Core Components

The knowledge base functionality is implemented through several interconnected components located in `/apps/frontend/app/features/knowledge-base/`:

#### 1. FileManager (`file-manager.tsx`)
**Primary Interface Component**
- Main orchestrating component that provides the complete file management interface
- Manages global state for files, categories, search, and selection
- Coordinates interactions between all other components
- Handles file categorization and filtering logic

**Key Features:**
- Multi-category file filtering (all, documents, images, audio, videos, knowledge-base)
- Search functionality across file names
- File selection and batch operations
- Storage metrics and team information display
- Knowledge base creation workflow

**Data Structure:**
```typescript
interface FileItem {
  id: string;
  name: string;
  type: "file" | "folder";
  size?: number;
  uploadDate: Date;
  path: string;
  mimeType?: string;
  thumbnail?: string;
  uploadedBy?: {
    name: string;
    avatar?: string;
    email?: string;
  };
}

type FileCategory = "all" | "documents" | "images" | "audio" | "videos" | "knowledge-base";
```

#### 2. FileUpload (`file-upload.tsx`)
**File Upload Interface**
- Drag-and-drop upload functionality
- File validation and type checking
- Progress tracking for uploads
- Support for multiple file formats

**Supported File Types:**
- Images: PNG, JPG, JPEG, GIF, WebP
- Documents: PDF, DOC, DOCX
- Spreadsheets: XLS, XLSX, CSV
- Maximum file size: 50MB

**Upload Process:**
1. File validation (type and size checking)
2. Progress simulation with visual feedback
3. File processing and metadata extraction
4. Integration with parent component state

#### 3. FileTable (`file-table.tsx`)
**Tabular File Display**
- Comprehensive table view of files with sortable columns
- File selection with checkboxes
- Context menu actions (rename, download, move, delete)
- User information display
- Relative date formatting

**Table Columns:**
- Selection checkbox
- File name with icon and type
- Uploaded by (user info with avatar)
- Last modified (relative time)
- File size
- Actions dropdown

#### 4. FileGrid (`file-grid.tsx`)
**Grid and List View Handler**
- Supports both grid and list view modes
- File selection and batch operations
- Context menus for individual file actions
- Empty state handling

**View Modes:**
- **Grid View**: Card-based layout with file icons and metadata
- **List View**: Compact table-style layout with full details

#### 5. CategorySidebar (`category-sidebar.tsx`)
**Navigation and Filtering**
- Category-based file filtering
- Dynamic file counts per category
- Knowledge base creation shortcut
- Hierarchical knowledge base listing

**Categories:**
- All Files
- Documents (PDF, Word, text files)
- Images (all image formats)
- Audio files
- Videos
- Knowledge Bases (special folders)

#### 6. DirectoryTree (`directory-tree.tsx`)
**Hierarchical Navigation**
- Tree-view navigation of folder structure
- Expandable/collapsible folders
- Path-based navigation
- Visual hierarchy with indentation

#### 7. FileActions (`file-actions.tsx`)
**File Operations Modal**
- Rename functionality with extension preservation
- Keyboard shortcuts (Enter to confirm, Escape to cancel)
- Smart extension handling for different file types

#### 8. CreateFolderDialog (`create-folder-dialog.tsx`)
**Knowledge Base Creation**
- Modal interface for creating new knowledge bases
- Input validation and naming
- Integration with parent state management

## User Experience Features

### File Management Operations
1. **Upload**: Drag-and-drop or click-to-browse file upload
2. **Selection**: Individual or bulk selection with checkboxes
3. **Categorization**: Automatic categorization based on MIME types
4. **Search**: Real-time search across file names
5. **Navigation**: Tree-view and breadcrumb navigation
6. **Actions**: Rename, delete, download, and move operations

### Knowledge Base Specific Features
1. **Knowledge Base Creation**: Dedicated workflow for creating knowledge containers
2. **Hierarchical Organization**: Folder-based organization system
3. **Content Filtering**: Toggle to show/hide knowledge base contents
4. **Team Collaboration**: User attribution and team member tracking


## Technical Implementation Details

### State Management
- Local React state for UI interactions
- Centralized state in FileManager component
- Efficient filtering and categorization algorithms
- Real-time search implementation

### File Type Detection
- MIME type-based categorization
- Extension validation for additional security
- Icon mapping for visual representation
- Color coding system for different file types

### Upload System
- Client-side file validation
- Simulated upload progress (currently mockup)
- File size and type restrictions
- Error handling and user feedback

### Storage Integration Points
The current implementation uses mock data but is architected to integrate with:
- Object storage systems (MinIO compatibility)
- Database storage for metadata
- User authentication and authorization
- Team management systems

---

*This documentation reflects the current implementation state. For API requirements and database schema details, see the accompanying technical specification documents.*
