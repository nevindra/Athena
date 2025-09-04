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
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*",
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
