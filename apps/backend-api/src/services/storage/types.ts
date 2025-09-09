export interface StorageFile {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface StorageUploadResult {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  path: string;
}

export interface IStorageProvider {
  upload(
    file: File,
    path: string,
    metadata?: Record<string, string>
  ): Promise<StorageUploadResult>;

  download(path: string): Promise<Buffer>;

  delete(path: string): Promise<void>;

  getUrl(path: string): Promise<string>;

  exists(path: string): Promise<boolean>;
}

export type StorageProviderType = "minio";