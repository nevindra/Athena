import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sql } from "../config/database";
import { seedSuperAdmin } from "./seed";

export async function runMigrations(): Promise<void> {
  console.log("🚀 Starting automatic database migrations...");

  try {
    // Enable pgvector extension
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log("✅ pgvector extension enabled");

    // Run migrations
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("✅ Database migrations completed successfully");

    // Run seeder
    await seedSuperAdmin();
    console.log("✅ Database seeding completed successfully");
  } catch (error) {
    console.error("❌ Migration/seeding failed:", error);
    throw error; // Re-throw to stop server startup if migrations fail
  }
}