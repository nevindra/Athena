import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

// Demo user ID used across all frontend API calls
const DEMO_USER_ID = "01HZXM0K1QRST9VWXYZ01234AB";

export async function seedUsers() {
  console.log("🌱 Seeding users table...");

  try {
    // Check if demo user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, DEMO_USER_ID))
      .limit(1);

    if (existingUser.length > 0) {
      console.log("✅ Demo user already exists");
      return;
    }

    // Insert demo users
    const demoUsers = [
      {
        id: DEMO_USER_ID,
        email: "demo@athena.ai",
        name: "Demo User",
      },
      {
        email: "alice@athena.ai", 
        name: "Alice Johnson",
      },
      {
        email: "bob@athena.ai",
        name: "Bob Smith",
      },
      {
        email: "carol@athena.ai",
        name: "Carol Davis",
      },
    ];

    const insertedUsers = await db
      .insert(users)
      .values(demoUsers)
      .returning();

    console.log(`✅ Inserted ${insertedUsers.length} users:`);
    for (const user of insertedUsers) {
      console.log(`   - ${user.name} (${user.email}) - ID: ${user.id}`);
    }

    console.log("🎉 User seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
}

export async function seedDatabase() {
  console.log("🚀 Starting database seeding...");
  
  try {
    await seedUsers();
    console.log("✅ Database seeding completed!");
  } catch (error) {
    console.error("❌ Database seeding failed:", error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (import.meta.main) {
  await seedDatabase();
  process.exit(0);
}