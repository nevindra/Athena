import * as Minio from "minio";
import { ulid } from "ulid";
import { env } from "../../config/env";
import type { IStorageProvider, StorageUploadResult } from "./types";

export class MinioStorageProvider implements IStorageProvider {
  private client: Minio.Client;
  private bucketName: string;

  constructor() {
    this.bucketName = env.MINIO_BUCKET;
    console.log(`🗄️  Initializing MinIO client with endpoint: ${env.MINIO_ENDPOINT}`);
    
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
      console.log(`🔍 Checking MinIO bucket: ${this.bucketName}`);
      const exists = await this.client.bucketExists(this.bucketName);
      if (!exists) {
        console.log(`📦 Creating MinIO bucket: ${this.bucketName}`);
        await this.client.makeBucket(this.bucketName);
        console.log(`✅ Successfully created MinIO bucket: ${this.bucketName}`);
      } else {
        console.log(`✅ MinIO bucket already exists: ${this.bucketName}`);
      }
      console.log(`🚀 MinIO storage provider ready!`);
    } catch (error) {
      console.error("❌ Failed to initialize MinIO bucket:", error);
      throw error;
    }
  }

  async upload(
    file: File,
    path: string,
    metadata?: Record<string, string>
  ): Promise<StorageUploadResult> {
    const id = ulid();
    const filename = `${id}_${file.name}`;
    const objectName = `${path}/${filename}`;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const metaData = {
        "Content-Type": file.type,
        "Original-Filename": file.name,
        ...metadata,
      };

      await this.client.putObject(
        this.bucketName,
        objectName,
        buffer,
        file.size,
        metaData
      );

      return {
        id,
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        path: objectName,
      };
    } catch (error) {
      console.error("MinIO upload error:", error);
      throw new Error(`Failed to upload file: ${error}`);
    }
  }

  async download(path: string): Promise<Buffer> {
    try {
      const stream = await this.client.getObject(this.bucketName, path);
      
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

  async delete(path: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucketName, path);
    } catch (error) {
      console.error("MinIO delete error:", error);
      throw new Error(`Failed to delete file: ${path}`);
    }
  }

  async getUrl(path: string): Promise<string> {
    try {
      const presignedUrl = await this.client.presignedGetObject(
        this.bucketName,
        path,
        24 * 60 * 60 // 24 hours expiry
      );
      return presignedUrl;
    } catch (error) {
      console.error("MinIO getUrl error:", error);
      throw new Error(`Failed to generate URL for: ${path}`);
    }
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.client.statObject(this.bucketName, path);
      return true;
    } catch {
      return false;
    }
  }
}