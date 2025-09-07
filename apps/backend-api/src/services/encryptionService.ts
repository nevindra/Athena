import { env } from "../config/env";


export class EncryptionService {
  private key: Uint8Array;

  constructor() {
    // Convert the encryption key to a proper format
    this.key = new TextEncoder().encode(
      env.ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)
    );
  }

  async encrypt(data: string): Promise<string> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
      const encodedData = new TextEncoder().encode(data);

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        this.key,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
      );

      const encrypted = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        cryptoKey,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encrypted.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encrypted), iv.length);

      // Convert to base64
      return Buffer.from(combined).toString("base64");
    } catch (error) {
      console.error("Encryption failed:", error);
      throw new Error("Failed to encrypt data");
    }
  }

  async decrypt(encryptedData: string): Promise<string> {
    try {
      const combined = new Uint8Array(Buffer.from(encryptedData, "base64"));

      // Extract IV (first 12 bytes) and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        this.key,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
      );

      const decrypted = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv,
        },
        cryptoKey,
        encrypted
      );

      return new TextDecoder().decode(decrypted);
    } catch (error) {
      console.error("Decryption failed:", error);
      throw new Error("Failed to decrypt data");
    }
  }

  async encryptObject<T extends Record<string, any>>(obj: T): Promise<string> {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  async decryptObject<T extends Record<string, any>>(
    encryptedData: string
  ): Promise<T> {
    const jsonString = await this.decrypt(encryptedData);
    return JSON.parse(jsonString) as T;
  }

  // Encrypt only sensitive fields in configuration settings
  async encryptSensitiveFields(provider: string, settings: any): Promise<any> {
    const settingsCopy = { ...settings };

    switch (provider) {
      case "gemini":
        if (settingsCopy.apiKey) {
          settingsCopy.apiKey = await this.encrypt(settingsCopy.apiKey);
        }
        break;

      case "ollama":
        // Ollama typically doesn't have sensitive fields
        break;

      case "http-api":
        if (settingsCopy.apiKey) {
          settingsCopy.apiKey = await this.encrypt(settingsCopy.apiKey);
        }
        if (
          settingsCopy.headers &&
          Object.keys(settingsCopy.headers).length > 0
        ) {
          const encryptedHeaders: Record<string, string> = {};
          for (const [key, value] of Object.entries(settingsCopy.headers)) {
            encryptedHeaders[key] = await this.encrypt(value as string);
          }
          settingsCopy.headers = encryptedHeaders;
        }
        break;
    }

    return settingsCopy;
  }

  // Decrypt sensitive fields in configuration settings
  async decryptSensitiveFields(provider: string, settings: any): Promise<any> {
    const settingsCopy = { ...settings };

    try {
      switch (provider) {
        case "gemini":
          if (settingsCopy.apiKey) {
            settingsCopy.apiKey = await this.decrypt(settingsCopy.apiKey);
          }
          break;

        case "ollama":
          // Ollama typically doesn't have sensitive fields
          break;

        case "http-api":
          if (settingsCopy.apiKey) {
            settingsCopy.apiKey = await this.decrypt(settingsCopy.apiKey);
          }
          if (
            settingsCopy.headers &&
            Object.keys(settingsCopy.headers).length > 0
          ) {
            const decryptedHeaders: Record<string, string> = {};
            for (const [key, value] of Object.entries(settingsCopy.headers)) {
              decryptedHeaders[key] = await this.decrypt(value as string);
            }
            settingsCopy.headers = decryptedHeaders;
          }
          break;
      }
    } catch (error) {
      console.error("Failed to decrypt sensitive fields:", error);
      // Return original settings if decryption fails (might be unencrypted legacy data)
      return settings;
    }

    return settingsCopy;
  }
}

export const encryptionService = new EncryptionService();
