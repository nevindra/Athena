import { betterAuth } from "better-auth";
import { username } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { env } from "./config/env";
import * as schema from "./db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),

  // Basic configuration
  baseURL: env.NODE_ENV === "production"
    ? env.BASE_URL
    : `http://localhost:${env.PORT}`,

  // Email and password provider is enabled by default
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  // Add username plugin
  plugins: [
    username({
      minUsernameLength: 3,
      maxUsernameLength: 30,
      usernameValidator: (username) => {
        // Allow alphanumeric, underscores, and dots
        const isValid = /^[a-zA-Z0-9_.]+$/.test(username);
        // Disallow reserved usernames
        const reservedUsernames = ["admin", "root", "system", "api", "null", "undefined"];
        return isValid && !reservedUsernames.includes(username.toLowerCase());
      },
      displayUsernameValidator: (displayUsername) => {
        // Allow more characters for display username
        return /^[a-zA-Z0-9_.\-\s]+$/.test(displayUsername);
      },
      usernameNormalization: (username) => {
        return username.toLowerCase().trim();
      },
      validationOrder: {
        username: "pre-normalization",
        displayUsername: "pre-normalization",
      }
    }),
  ],

  // Session configuration
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },

  // Security settings
  trustedOrigins: env.NODE_ENV === "production"
    ? env.CORS_ORIGIN.split(",").map(origin => origin.trim())
    : ["http://localhost:5173", "http://localhost:3001", "http://localhost:3000"],
});