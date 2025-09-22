import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";
import { auth } from "../auth";

export async function seedSuperAdmin() {
  console.log("🌱 Seeding superadmin user...");

  try {
    // Check if superadmin already exists
    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, "superadmin"))
      .limit(1);

    if (existingSuperAdmin.length > 0) {
      console.log("✅ Superadmin user already exists");
      return;
    }

    // Create superadmin user using Better Auth
    console.log("🔨 Creating superadmin user...");
    const result = await auth.api.signUpEmail({
      body: {
        email: "superadmin@athena.ai",
        name: "Super Administrator",
        password: "adminadmin",
        username: "superadmin",
        displayUsername: "Super Admin",
      },
    });

    if (result) {
      console.log("✅ Superadmin user created successfully!");
      console.log("   - Username: superadmin");
      console.log("   - Password: adminadmin");
      console.log("   - Email: superadmin@athena.ai");
      console.log("   - Display Name: Super Admin");
    } else {
      throw new Error("Failed to create superadmin user");
    }

  } catch (error) {
    console.error("❌ Error seeding superadmin:", error);
    throw error;
  }
}


export async function seedDatabase() {
  console.log("🚀 Starting database seeding...");

  try {
    await seedSuperAdmin();
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