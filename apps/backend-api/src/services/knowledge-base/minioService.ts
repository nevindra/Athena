import * as Minio from "minio";
import { ulid } from "ulid";
import { env } from "../../config/env";

export interface MinIOUploadResult {
  objectName: string;
  etag: string;
  size: number;
  contentType: string;
  url: string;
}

export interface FileInfo {
  name: string;
  size: number;
  lastModified: Date;
  etag: string;
}

export class MinIOFileService {
  private client: Minio.Client;
  private bucketName: string;

  constructor() {
    this.bucketName = env.MINIO_BUCKET;
    
    this.client = new Minio.Client({
      endPoint: env.MINIO_ENDPOINT.split(':')[0],
      port: Number.parseInt(env.MINIO_ENDPOINT.split(':')[1]) || 9000,
      useSSL: env.MINIO_USE_SSL,
      accessKey: env.MINIO_ACCESS_KEY,
      secretKey: env.MINIO_SECRET_KEY,
    });

    this.initializeBucket();
  }

  private async initializeBucket(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        await this.client.makeBucket(this.bucketName);
        console.log(`✅ Created MinIO bucket: ${this.bucketName}`);
      }
    } catch (error) {
      console.error("❌ Failed to initialize MinIO bucket:", error);
      throw error;
    }
  }

  async uploadFile(
    bucket: string,
    path: string,
    buffer: Buffer,
    metadata: Record<string, string>
  ): Promise<MinIOUploadResult> {
    try {
      const etag = await this.client.putObject(
        bucket,
        path,
        buffer,
        buffer.length,
        metadata
      );

      const url = await this.getFileUrl(bucket, path);

      return {
        objectName: path,
        etag,
        size: buffer.length,
        contentType: metadata["Content-Type"] || "application/octet-stream",
        url,
      };
    } catch (error) {
      console.error("MinIO upload error:", error);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  async downloadFile(bucket: string, path: string): Promise<Buffer> {
    try {
      const stream = await this.client.getObject(bucket, path);
      
      const chunks: Buffer[] = [];
      return new Promise((resolve, reject) => {
        stream.on("data", (chunk) => chunks.push(chunk));
        stream.on("end", () => resolve(Buffer.concat(chunks)));
        stream.on("error", reject);
      });
    } catch (error) {
      console.error("MinIO download error:", error);
      throw new Error(`File not found: ${path}`);
    }
  }

  async deleteFile(bucket: string, path: string): Promise<void> {
    try {
      await this.client.removeObject(bucket, path);
    } catch (error) {
      console.error("MinIO delete error:", error);
      throw new Error(`Failed to delete file: ${path}`);
    }
  }

  async generateThumbnail(
    sourceBucket: string,
    sourcePath: string,
    targetBucket: string,
    targetPath: string
  ): Promise<string> {
    try {
      // For now, we'll implement a simple copy operation
      // In a real implementation, you'd add thumbnail generation logic here
      await this.copyFile(sourceBucket, sourcePath, targetBucket, targetPath);
      return targetPath;
    } catch (error) {
      console.error("Thumbnail generation error:", error);
      throw new Error(`Failed to generate thumbnail: ${error}`);
    }
  }

  async getFileUrl(
    bucket: string,
    path: string,
    expiry: number = 24 * 60 * 60 // 24 hours
  ): Promise<string> {
    try {
      return await this.client.presignedGetObject(bucket, path, expiry);
    } catch (error) {
      console.error("MinIO getUrl error:", error);
      throw new Error(`Failed to generate URL for: ${path}`);
    }
  }

  async copyFile(
    sourceBucket: string,
    sourcePath: string,
    targetBucket: string,
    targetPath: string
  ): Promise<void> {
    try {
      const copyConditions = new Minio.CopyConditions();
      await this.client.copyObject(
        targetBucket,
        targetPath,
        `/${sourceBucket}/${sourcePath}`,
        copyConditions
      );
    } catch (error) {
      console.error("MinIO copy error:", error);
      throw new Error(`Failed to copy file: ${error}`);
    }
  }

  async listFiles(
    bucket: string,
    prefix: string,
    recursive: boolean = false
  ): Promise<FileInfo[]> {
    try {
      const stream = this.client.listObjects(bucket, prefix, recursive);
      const files: FileInfo[] = [];

      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          files.push({
            name: obj.name || "",
            size: obj.size || 0,
            lastModified: obj.lastModified || new Date(),
            etag: obj.etag || "",
          });
        });
        stream.on('end', () => resolve(files));
        stream.on('error', reject);
      });
    } catch (error) {
      console.error("MinIO list files error:", error);
      throw new Error(`Failed to list files: ${error}`);
    }
  }

  async fileExists(bucket: string, path: string): Promise<boolean> {
    try {
      await this.client.statObject(bucket, path);
      return true;
    } catch {
      return false;
    }
  }

  async getPresignedUploadUrl(
    bucket: string,
    objectName: string,
    expiry: number = 60 * 15 // 15 minutes
  ): Promise<{
    uploadUrl: string;
    uploadId: string;
    expiresAt: Date;
    fields: Record<string, string>;
  }> {
    try {
      const uploadId = ulid();
      const expiresAt = new Date(Date.now() + expiry * 1000);
      
      const uploadUrl = await this.client.presignedPutObject(
        bucket,
        objectName,
        expiry
      );

      return {
        uploadUrl,
        uploadId,
        expiresAt,
        fields: {
          "Content-Type": "application/octet-stream",
          "x-amz-meta-upload-id": uploadId,
        },
      };
    } catch (error) {
      console.error("MinIO presigned URL error:", error);
      throw new Error(`Failed to generate presigned upload URL: ${error}`);
    }
  }

  // Utility methods for different bucket paths
  getFilePath(category: string, fileName: string): string {
    return `files/${category}/${fileName}`;
  }

  getKnowledgeBasePath(knowledgeBaseId: string, fileName: string): string {
    return `knowledge-bases/${knowledgeBaseId}/${fileName}`;
  }

  getThumbnailPath(originalPath: string): string {
    const pathParts = originalPath.split('/');
    const fileName = pathParts.pop();
    const directory = pathParts.join('/');
    return `thumbnails/${directory}/${fileName}`;
  }

  getTempPath(fileName: string): string {
    return `temp/${fileName}`;
  }

  getTrashPath(originalPath: string): string {
    return `trash/${originalPath}`;
  }
}