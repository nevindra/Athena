import { mkdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ulid } from "ulid";
import type { IStorageProvider, StorageUploadResult } from "./types";

export class LocalStorageProvider implements IStorageProvider {
  private baseDirectory: string;

  constructor(baseDirectory: string = "uploads") {
    this.baseDirectory = baseDirectory;
  }

  async upload(
    file: File,
    path: string,
    metadata?: Record<string, string>
  ): Promise<StorageUploadResult> {
    const id = ulid();
    const filename = `${id}_${file.name}`;
    const fullPath = join(process.cwd(), this.baseDirectory, path);
    const filePath = join(fullPath, filename);

    await mkdir(fullPath, { recursive: true });

    const arrayBuffer = await file.arrayBuffer();
    await writeFile(filePath, new Uint8Array(arrayBuffer));

    return {
      id,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      path: join(path, filename),
    };
  }

  async download(path: string): Promise<Buffer> {
    const filePath = join(process.cwd(), this.baseDirectory, path);
    
    try {
      const buffer = await readFile(filePath);
      return buffer;
    } catch (error) {
      throw new Error(`File not found: ${path}`);
    }
  }

  async delete(path: string): Promise<void> {
    const filePath = join(process.cwd(), this.baseDirectory, path);
    
    try {
      await unlink(filePath);
    } catch (error) {
      throw new Error(`Failed to delete file: ${path}`);
    }
  }

  async getUrl(path: string): Promise<string> {
    return `/api/files/${path}`;
  }

  async exists(path: string): Promise<boolean> {
    const filePath = join(process.cwd(), this.baseDirectory, path);
    
    try {
      const fileStats = await stat(filePath);
      return fileStats.isFile();
    } catch {
      return false;
    }
  }
}