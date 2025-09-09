# MinIO Object Storage Integration

## Overview

Athena uses MinIO as its object storage solution for handling file uploads, chat attachments, and other media files. The integration provides a clean abstraction layer that supports multiple storage providers while maintaining consistent API behavior.

## Architecture

### Storage Abstraction Layer

The storage system is built around a provider pattern with the following components:

- **IStorageProvider Interface**: Defines common storage operations
- **MinioStorageProvider**: MinIO implementation with S3-compatible API
- **StorageFactory**: Singleton factory for provider instantiation

### Key Features

- **Provider Agnostic**: Easy switching between storage backends
- **Type Safety**: Full TypeScript support with proper typing
- **Error Handling**: Comprehensive error handling and logging
- **Automatic Bucket Management**: Creates buckets if they don't exist
- **Presigned URLs**: Secure file access with expiring URLs

## Configuration

### Environment Variables

Configure MinIO in your `.env` file:

```bash
# Storage Configuration
STORAGE_PROVIDER=minio

# MinIO Configuration
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=athena-files
MINIO_USE_SSL=false
```

### Docker Setup

Start MinIO using Docker:

```bash
docker run -d \
  --name minio \
  -p 9000:9000 \
  -p 9001:9001 \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin" \
  -v ~/minio/data:/data \
  quay.io/minio/minio server /data --console-address ":9001"
```

### Access URLs

- **API Endpoint**: `http://localhost:9000`
- **Console**: `http://localhost:9001`
- **Default Credentials**: `minioadmin` / `minioadmin`

## Usage

### File Upload

When files are uploaded through the chat interface, they are automatically stored in MinIO:

```typescript
// Example: File upload in session controller
const storageProvider = StorageFactory.getStorageProvider();
const uploadResult = await storageProvider.upload(file, `messages/${sessionId}`);
```

### File Retrieval

Files are served through the API with proper content headers:

```typescript
// Example: File download
const fileBuffer = await storageProvider.download(filePath);
const exists = await storageProvider.exists(filePath);
```

### URL Generation

Generate presigned URLs for secure file access:

```typescript
const url = await storageProvider.getUrl(filePath); // 24-hour expiry
```

## Storage Structure

Files are organized in MinIO with the following structure:

```
athena-files/
├── messages/
│   ├── {sessionId}/
│   │   ├── {ulid}_{filename}
│   │   └── {ulid}_{filename}
│   └── {sessionId}/
└── uploads/
    └── {category}/
```

### File Naming Convention

- **ID**: ULID (Universally Unique Lexicographically Sortable Identifier)
- **Format**: `{ulid}_{original_filename}`
- **Example**: `01HW2K3M4N5P6Q7R8S9T0V1W2X_document.pdf`

## API Integration

### File Serving Endpoint

Files are served through the backend API:

```
GET /api/files/{sessionId}/{attachmentId}?userId={userId}
```

### Response Headers

- `Content-Type`: Original file MIME type
- `Content-Length`: File size in bytes
- `Content-Disposition`: Inline display with original filename

### Security

- **User Ownership**: Files are only accessible by the owning user
- **Session Validation**: Attachment access requires valid session ownership
- **Presigned URLs**: Temporary access URLs with configurable expiration

## Error Handling

The storage provider includes comprehensive error handling:

### Connection Errors
```bash
❌ Failed to initialize MinIO bucket: connection refused
```

### Upload Errors
```bash
Failed to upload file document.pdf: bucket not found
```

### Download Errors
```bash
File not found or download failed: messages/session123/file456
```

## Logging

The system provides detailed logging for monitoring and debugging:

```bash
📁 Using storage provider: MINIO
🗄️ Initializing MinIO client with endpoint: localhost:9000
🔍 Checking MinIO bucket: athena-files
✅ MinIO bucket already exists: athena-files
🚀 MinIO storage provider ready!
```

## Performance Considerations

### Bucket Configuration

- **Versioning**: Disabled by default for storage efficiency
- **Lifecycle**: Configure automatic cleanup for temporary files
- **Access Policy**: Bucket-level policies for security

### Connection Pooling

MinIO client uses connection pooling for optimal performance:

- **Keep-Alive**: Persistent connections
- **Retry Logic**: Automatic retry on transient failures
- **Timeout Configuration**: Configurable request timeouts

## Monitoring

### Health Checks

Monitor MinIO connectivity:

```typescript
const exists = await storageProvider.exists('health-check');
```

### Metrics

Track storage metrics:

- **Upload Success Rate**: Monitor upload failures
- **Download Performance**: Track response times
- **Storage Usage**: Monitor bucket size and file count

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Ensure MinIO container is running
   - Check endpoint configuration
   - Verify network connectivity

2. **Access Denied**
   - Verify access credentials
   - Check bucket permissions
   - Ensure bucket exists

3. **File Not Found**
   - Verify file path format
   - Check bucket and object existence
   - Validate user permissions

### Debug Mode

Enable debug logging by setting log level in development:

```bash
NODE_ENV=development
```

## Security Best Practices

### Access Control

- **IAM Policies**: Use MinIO's built-in IAM for granular access control
- **Bucket Policies**: Configure bucket-level access restrictions
- **Network Security**: Use VPC or firewall rules to restrict access

### Data Protection

- **Encryption at Rest**: Configure MinIO server-side encryption
- **Encryption in Transit**: Use TLS/SSL for all communications
- **Access Logs**: Enable audit logging for compliance

### Credentials Management

- **Environment Variables**: Store credentials in environment variables
- **Secrets Management**: Use external secret management systems
- **Rotation**: Implement regular credential rotation

## Production Deployment

### High Availability

- **Distributed Mode**: Deploy MinIO in distributed mode for HA
- **Load Balancing**: Use load balancers for multiple MinIO instances
- **Backup Strategy**: Implement regular backup procedures

### Scaling

- **Horizontal Scaling**: Add more MinIO nodes as needed
- **Storage Expansion**: Add drives to existing deployments
- **Performance Tuning**: Optimize based on workload patterns