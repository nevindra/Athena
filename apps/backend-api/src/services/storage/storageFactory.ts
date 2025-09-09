import { env } from "../../config/env";
import { MinioStorageProvider } from "./minioStorageProvider";
import type { IStorageProvider, StorageProviderType } from "./types";

export class StorageFactory {
  private static instance: IStorageProvider | null = null;

  static getStorageProvider(): IStorageProvider {
    if (!this.instance) {
      const provider = env.STORAGE_PROVIDER as StorageProviderType;
      console.log(`📁 Using storage provider: ${provider.toUpperCase()}`);
      
      if (provider !== "minio") {
        console.warn(`⚠️ Storage provider '${provider}' is not supported. Using MinIO as the only supported provider.`);
      }
      
      this.instance = new MinioStorageProvider();
    }

    return this.instance;
  }

  static resetInstance(): void {
    this.instance = null;
  }
}