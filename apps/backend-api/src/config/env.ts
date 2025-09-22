export const env = {
  // Database
  DB_HOST: process.env.DB_HOST || "localhost",
  DB_PORT: Number.parseInt(process.env.DB_PORT || "5432"),
  DB_USER: process.env.DB_USER || "postgres",
  DB_PASSWORD: process.env.DB_PASSWORD || "postgres",
  DB_NAME: process.env.DB_NAME || "athena",

  // Application
  PORT: Number.parseInt(process.env.PORT || "3000"),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Security
  ENCRYPTION_KEY:
    process.env.ENCRYPTION_KEY || "default-key-change-in-production",

  // API
  API_PREFIX: process.env.API_PREFIX || "/api",
  BASE_URL: process.env.BASE_URL || "http://localhost:3000",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",

  // Storage
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || "minio",
  
  // MinIO Configuration
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT || "localhost:9000",
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY || "minioadmin",
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY || "minioadmin",
  MINIO_BUCKET: process.env.MINIO_BUCKET || "athena-files",
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === "true",
} as const;

export function validateEnv() {
  const required = ["ENCRYPTION_KEY"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`);
  }

  if (
    env.NODE_ENV === "production" &&
    env.ENCRYPTION_KEY === "default-key-change-in-production"
  ) {
    throw new Error("ENCRYPTION_KEY must be set in production");
  }
}
