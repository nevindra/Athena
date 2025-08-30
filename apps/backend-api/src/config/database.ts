import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "./env";
import * as schema from "../db/schema";

const connectionString = `postgres://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;

export const sql = postgres(connectionString, {
  max: 10, // Connection pool size
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(sql, { schema });

export async function testConnection() {
  try {
    await sql`SELECT 1`;
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

export async function closeConnection() {
  await sql.end();
}