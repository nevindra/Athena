# Knowledge Base Database Schema

## Overview

This document defines the database schema requirements for implementing the Knowledge Base features in Athena. The schema is designed to support file management, knowledge base organization, user collaboration, and integration with MinIO object storage.

## Database Tables

### 1. users
**Purpose**: Store user information for file ownership and collaboration

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(512),
  avatar_initials VARCHAR(5),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active);
```

### 2. teams
**Purpose**: Organize users into collaborative groups

```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  slug VARCHAR(100) UNIQUE NOT NULL,
  settings JSONB DEFAULT '{}',
  storage_limit BIGINT DEFAULT 10737418240, -- 10GB in bytes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_teams_slug ON teams(slug);
```

### 3. team_members
**Purpose**: Link users to teams with role-based access

```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL DEFAULT 'member', -- owner, admin, member, viewer
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(team_id, user_id)
);

-- Indexes
CREATE INDEX idx_team_members_team ON team_members(team_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);
CREATE INDEX idx_team_members_role ON team_members(role);
```

### 4. knowledge_bases
**Purpose**: Organize files into knowledge base containers

```sql
CREATE TABLE knowledge_bases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  path TEXT NOT NULL, -- Full hierarchical path
  slug VARCHAR(100) NOT NULL,
  settings JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(team_id, slug)
);

-- Indexes
CREATE INDEX idx_kb_team ON knowledge_bases(team_id);
CREATE INDEX idx_kb_parent ON knowledge_bases(parent_id);
CREATE INDEX idx_kb_path ON knowledge_bases(path);
CREATE INDEX idx_kb_created_by ON knowledge_bases(created_by);
CREATE INDEX idx_kb_public ON knowledge_bases(is_public);
```

### 5. folders
**Purpose**: File system hierarchy within knowledge bases

```sql
CREATE TABLE folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  path TEXT NOT NULL, -- Full path from root
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_folders_team ON folders(team_id);
CREATE INDEX idx_folders_kb ON folders(knowledge_base_id);
CREATE INDEX idx_folders_parent ON folders(parent_id);
CREATE INDEX idx_folders_path ON folders(path);
CREATE INDEX idx_folders_created_by ON folders(created_by);
```

### 6. files
**Purpose**: Core file metadata and storage information

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE SET NULL,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_extension VARCHAR(20),
  mime_type VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  checksum VARCHAR(128) NOT NULL, -- SHA-256 hash
  
  -- MinIO storage information
  storage_bucket VARCHAR(100) NOT NULL,
  storage_path VARCHAR(512) NOT NULL,
  storage_url VARCHAR(1024),
  
  -- Metadata
  description TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  
  -- Thumbnail information
  has_thumbnail BOOLEAN DEFAULT false,
  thumbnail_bucket VARCHAR(100),
  thumbnail_path VARCHAR(512),
  thumbnail_url VARCHAR(1024),
  
  -- Status and tracking
  status VARCHAR(50) DEFAULT 'active', -- active, deleted, archived
  upload_status VARCHAR(50) DEFAULT 'completed', -- uploading, processing, completed, failed
  
  -- User tracking
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  
  -- Full path for navigation
  full_path TEXT NOT NULL,
  
  UNIQUE(team_id, checksum) -- Prevent duplicate files
);

-- Indexes
CREATE INDEX idx_files_team ON files(team_id);
CREATE INDEX idx_files_kb ON files(knowledge_base_id);
CREATE INDEX idx_files_folder ON files(folder_id);
CREATE INDEX idx_files_mime_type ON files(mime_type);
CREATE INDEX idx_files_size ON files(size);
CREATE INDEX idx_files_checksum ON files(checksum);
CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_status ON files(status);
CREATE INDEX idx_files_upload_status ON files(upload_status);
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_files_tags ON files USING GIN(tags);
CREATE INDEX idx_files_metadata ON files USING GIN(metadata);
CREATE INDEX idx_files_full_path ON files(full_path);

-- Full-text search index
CREATE INDEX idx_files_search ON files USING GIN(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);
```

### 7. file_versions
**Purpose**: Track file version history

```sql
CREATE TABLE file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  size BIGINT NOT NULL,
  checksum VARCHAR(128) NOT NULL,
  storage_bucket VARCHAR(100) NOT NULL,
  storage_path VARCHAR(512) NOT NULL,
  storage_url VARCHAR(1024),
  metadata JSONB DEFAULT '{}',
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(file_id, version_number)
);

-- Indexes
CREATE INDEX idx_file_versions_file ON file_versions(file_id);
CREATE INDEX idx_file_versions_version ON file_versions(version_number);
CREATE INDEX idx_file_versions_uploaded_by ON file_versions(uploaded_by);
```

### 8. file_shares
**Purpose**: Manage file sharing and access permissions

```sql
CREATE TABLE file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES users(id),
  shared_with_user UUID REFERENCES users(id),
  shared_with_team UUID REFERENCES teams(id),
  permission VARCHAR(50) NOT NULL DEFAULT 'view', -- view, download, edit
  share_token UUID UNIQUE DEFAULT gen_random_uuid(),
  is_public BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (shared_with_user IS NOT NULL OR shared_with_team IS NOT NULL OR is_public = true)
);

-- Indexes
CREATE INDEX idx_file_shares_file ON file_shares(file_id);
CREATE INDEX idx_file_shares_shared_by ON file_shares(shared_by);
CREATE INDEX idx_file_shares_shared_with_user ON file_shares(shared_with_user);
CREATE INDEX idx_file_shares_shared_with_team ON file_shares(shared_with_team);
CREATE INDEX idx_file_shares_token ON file_shares(share_token);
CREATE INDEX idx_file_shares_public ON file_shares(is_public);
CREATE INDEX idx_file_shares_expires_at ON file_shares(expires_at);
```

### 9. file_activities
**Purpose**: Audit trail for file operations

```sql
CREATE TABLE file_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  knowledge_base_id UUID REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL, -- uploaded, downloaded, renamed, moved, deleted, shared, etc.
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_file_activities_file ON file_activities(file_id);
CREATE INDEX idx_file_activities_kb ON file_activities(knowledge_base_id);
CREATE INDEX idx_file_activities_user ON file_activities(user_id);
CREATE INDEX idx_file_activities_action ON file_activities(action);
CREATE INDEX idx_file_activities_created_at ON file_activities(created_at);
```

### 10. storage_quotas
**Purpose**: Track storage usage per team/user

```sql
CREATE TABLE storage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  quota_type VARCHAR(50) NOT NULL, -- team, user
  bytes_used BIGINT DEFAULT 0,
  bytes_limit BIGINT NOT NULL,
  file_count INTEGER DEFAULT 0,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(team_id, user_id)
);

-- Indexes
CREATE INDEX idx_storage_quotas_team ON storage_quotas(team_id);
CREATE INDEX idx_storage_quotas_user ON storage_quotas(user_id);
CREATE INDEX idx_storage_quotas_type ON storage_quotas(quota_type);
```

## Views and Functions

### 1. File Statistics View
```sql
CREATE VIEW file_stats AS
SELECT 
  f.team_id,
  f.knowledge_base_id,
  COUNT(*) as file_count,
  SUM(f.size) as total_size,
  COUNT(*) FILTER (WHERE f.mime_type LIKE 'image/%') as image_count,
  COUNT(*) FILTER (WHERE f.mime_type LIKE 'application/pdf' OR f.mime_type LIKE '%document%') as document_count,
  COUNT(*) FILTER (WHERE f.mime_type LIKE 'audio/%') as audio_count,
  COUNT(*) FILTER (WHERE f.mime_type LIKE 'video/%') as video_count,
  MAX(f.created_at) as last_upload
FROM files f
WHERE f.status = 'active'
GROUP BY f.team_id, f.knowledge_base_id;
```

### 2. User File Activity View
```sql
CREATE VIEW user_file_activity AS
SELECT 
  u.id as user_id,
  u.name as user_name,
  u.email,
  COUNT(f.id) as files_uploaded,
  SUM(f.size) as total_size_uploaded,
  MAX(f.created_at) as last_upload,
  COUNT(fa.id) as total_activities
FROM users u
LEFT JOIN files f ON u.id = f.uploaded_by AND f.status = 'active'
LEFT JOIN file_activities fa ON u.id = fa.user_id
GROUP BY u.id, u.name, u.email;
```

### 3. Knowledge Base Tree View
```sql
CREATE VIEW knowledge_base_tree AS
WITH RECURSIVE kb_tree AS (
  -- Base case: root knowledge bases
  SELECT 
    id,
    parent_id,
    team_id,
    name,
    path,
    0 as level,
    ARRAY[name] as path_names
  FROM knowledge_bases 
  WHERE parent_id IS NULL
  
  UNION ALL
  
  -- Recursive case: child knowledge bases
  SELECT 
    kb.id,
    kb.parent_id,
    kb.team_id,
    kb.name,
    kb.path,
    kt.level + 1,
    kt.path_names || kb.name
  FROM knowledge_bases kb
  JOIN kb_tree kt ON kb.parent_id = kt.id
)
SELECT * FROM kb_tree;
```

## Stored Procedures

### 1. Update Storage Quota
```sql
CREATE OR REPLACE FUNCTION update_storage_quota(team_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO storage_quotas (team_id, quota_type, bytes_used, file_count, bytes_limit)
  SELECT 
    team_uuid,
    'team',
    COALESCE(SUM(size), 0),
    COUNT(*),
    (SELECT storage_limit FROM teams WHERE id = team_uuid)
  FROM files 
  WHERE team_id = team_uuid AND status = 'active'
  ON CONFLICT (team_id, user_id) 
  DO UPDATE SET 
    bytes_used = EXCLUDED.bytes_used,
    file_count = EXCLUDED.file_count,
    last_calculated_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

### 2. Soft Delete File
```sql
CREATE OR REPLACE FUNCTION soft_delete_file(file_uuid UUID, user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Update file status
  UPDATE files 
  SET status = 'deleted', deleted_at = NOW(), updated_at = NOW()
  WHERE id = file_uuid;
  
  -- Log activity
  INSERT INTO file_activities (file_id, user_id, action, details)
  VALUES (file_uuid, user_uuid, 'deleted', '{"soft_delete": true}'::jsonb);
  
  -- Update storage quota
  PERFORM update_storage_quota((SELECT team_id FROM files WHERE id = file_uuid));
END;
$$ LANGUAGE plpgsql;
```

### 3. Generate File Path
```sql
CREATE OR REPLACE FUNCTION generate_file_path(
  kb_id UUID DEFAULT NULL,
  folder_id UUID DEFAULT NULL,
  file_name VARCHAR DEFAULT NULL
) RETURNS TEXT AS $$
DECLARE
  kb_path TEXT := '';
  folder_path TEXT := '';
  full_path TEXT;
BEGIN
  -- Get knowledge base path
  IF kb_id IS NOT NULL THEN
    SELECT path INTO kb_path FROM knowledge_bases WHERE id = kb_id;
  END IF;
  
  -- Get folder path
  IF folder_id IS NOT NULL THEN
    SELECT path INTO folder_path FROM folders WHERE id = folder_id;
  END IF;
  
  -- Combine paths
  full_path := CONCAT(
    COALESCE(kb_path, ''),
    CASE WHEN folder_path IS NOT NULL AND folder_path != '' THEN '/' || folder_path ELSE '' END,
    CASE WHEN file_name IS NOT NULL THEN '/' || file_name ELSE '' END
  );
  
  -- Clean up double slashes
  full_path := regexp_replace(full_path, '/+', '/', 'g');
  
  -- Ensure starts with /
  IF full_path NOT LIKE '/%' THEN
    full_path := '/' || full_path;
  END IF;
  
  RETURN full_path;
END;
$$ LANGUAGE plpgsql;
```

## Triggers

### 1. Update File Path on Changes
```sql
CREATE OR REPLACE FUNCTION update_file_path_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.full_path := generate_file_path(NEW.knowledge_base_id, NEW.folder_id, NEW.name);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER files_update_path
  BEFORE INSERT OR UPDATE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_file_path_trigger();
```

### 2. Log File Activities
```sql
CREATE OR REPLACE FUNCTION log_file_activity_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO file_activities (file_id, knowledge_base_id, user_id, action)
    VALUES (NEW.id, NEW.knowledge_base_id, NEW.uploaded_by, 'uploaded');
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.name != NEW.name THEN
      INSERT INTO file_activities (file_id, knowledge_base_id, user_id, action, details)
      VALUES (NEW.id, NEW.knowledge_base_id, NEW.uploaded_by, 'renamed', 
              jsonb_build_object('old_name', OLD.name, 'new_name', NEW.name));
    END IF;
    IF OLD.folder_id != NEW.folder_id OR OLD.knowledge_base_id != NEW.knowledge_base_id THEN
      INSERT INTO file_activities (file_id, knowledge_base_id, user_id, action, details)
      VALUES (NEW.id, NEW.knowledge_base_id, NEW.uploaded_by, 'moved',
              jsonb_build_object('old_path', OLD.full_path, 'new_path', NEW.full_path));
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO file_activities (file_id, knowledge_base_id, user_id, action)
    VALUES (OLD.id, OLD.knowledge_base_id, OLD.uploaded_by, 'permanently_deleted');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER files_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON files
  FOR EACH ROW
  EXECUTE FUNCTION log_file_activity_trigger();
```

### 3. Update Storage Quotas
```sql
CREATE OR REPLACE FUNCTION update_quota_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM update_storage_quota(NEW.team_id);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM update_storage_quota(NEW.team_id);
    IF OLD.team_id != NEW.team_id THEN
      PERFORM update_storage_quota(OLD.team_id);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM update_storage_quota(OLD.team_id);
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER files_quota_update
  AFTER INSERT OR UPDATE OR DELETE ON files
  FOR EACH ROW
  EXECUTE FUNCTION update_quota_trigger();
```

## Data Types and Enums

### File Status Enum
```sql
CREATE TYPE file_status_enum AS ENUM (
  'active',
  'deleted', 
  'archived',
  'processing'
);

CREATE TYPE upload_status_enum AS ENUM (
  'uploading',
  'processing',
  'completed',
  'failed',
  'cancelled'
);
```

### User Role Enum
```sql
CREATE TYPE user_role_enum AS ENUM (
  'superadmin',
  'admin', 
  'user',
  'viewer'
);

CREATE TYPE team_member_role_enum AS ENUM (
  'owner',
  'admin',
  'member',
  'viewer'
);
```

### Activity Action Enum
```sql
CREATE TYPE activity_action_enum AS ENUM (
  'uploaded',
  'downloaded',
  'viewed',
  'renamed',
  'moved',
  'copied',
  'deleted',
  'restored',
  'shared',
  'unshared',
  'permissions_changed'
);
```

## Indexes for Performance

### Composite Indexes
```sql
-- Fast team file listings
CREATE INDEX idx_files_team_status_created ON files(team_id, status, created_at DESC);

-- Knowledge base file navigation
CREATE INDEX idx_files_kb_folder_name ON files(knowledge_base_id, folder_id, name);

-- File search by type and team
CREATE INDEX idx_files_team_mime_type ON files(team_id, mime_type) WHERE status = 'active';

-- User activity tracking
CREATE INDEX idx_file_activities_user_created ON file_activities(user_id, created_at DESC);

-- Storage quota calculations
CREATE INDEX idx_files_team_size ON files(team_id, size) WHERE status = 'active';
```

### Partial Indexes
```sql
-- Only active files
CREATE INDEX idx_files_active_team ON files(team_id, created_at DESC) WHERE status = 'active';

-- Only files with thumbnails
CREATE INDEX idx_files_thumbnails ON files(id) WHERE has_thumbnail = true;

-- Only shared files
CREATE INDEX idx_file_shares_active ON file_shares(file_id) WHERE expires_at IS NULL OR expires_at > NOW();
```

## Migration Scripts

### Initial Schema Migration
```sql
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enums first
-- (Include all enum definitions from above)

-- Create tables in dependency order
-- (Include all table definitions from above)

-- Create views
-- (Include all view definitions from above)

-- Create functions and procedures
-- (Include all function definitions from above)

-- Create triggers
-- (Include all trigger definitions from above)

-- Insert default data
INSERT INTO teams (name, slug, description) 
VALUES ('Default Team', 'default', 'Default team for initial setup');
```

## Backup and Maintenance

### Recommended Backup Strategy
1. **Full Backup**: Daily full database backup
2. **Incremental Backup**: Hourly transaction log backup
3. **File Storage Backup**: Daily MinIO bucket backup
4. **Retention Policy**: Keep backups for 30 days

### Maintenance Tasks
1. **Vacuum and Analyze**: Weekly maintenance on large tables
2. **Index Maintenance**: Monthly index rebuilding
3. **Storage Cleanup**: Weekly cleanup of deleted files
4. **Quota Recalculation**: Daily storage quota updates

### Monitoring Queries
```sql
-- Check storage usage by team
SELECT t.name, sq.bytes_used, sq.bytes_limit, 
       (sq.bytes_used::float / sq.bytes_limit * 100) as usage_percent
FROM teams t
JOIN storage_quotas sq ON t.id = sq.team_id
WHERE sq.quota_type = 'team';

-- Find large files
SELECT name, size, mime_type, uploaded_by, created_at
FROM files
WHERE status = 'active'
ORDER BY size DESC
LIMIT 20;

-- Recent file activity
SELECT fa.action, f.name, u.name as user_name, fa.created_at
FROM file_activities fa
JOIN files f ON fa.file_id = f.id
JOIN users u ON fa.user_id = u.id
ORDER BY fa.created_at DESC
LIMIT 50;
```

---

*This database schema provides a robust foundation for the Knowledge Base features with proper indexing, constraints, and audit capabilities. Adjust table structures based on specific requirements and performance needs.*