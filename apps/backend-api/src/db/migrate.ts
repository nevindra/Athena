import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sql } from "../config/database";

async function main() {
  console.log("🚀 Starting database migrations...");

  try {
    // Enable pgvector extension
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log("✅ pgvector extension enabled");

    // Run migrations
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("✅ Database migrations completed successfully");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
