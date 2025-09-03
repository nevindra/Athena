import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { env, validateEnv } from "./config/env";
import { testConnection } from "./config/database";
import { configurationsRoutes } from "./routes/configurations";
import { aiRoutes } from "./routes/ai";
import { sessionRoutes } from "./routes/sessions";
import { filesRoutes } from "./routes/files";
import { systemPromptsRoutes } from "./routes/system-prompts";
import swagger from "@elysiajs/swagger";
import { logger, logApiRequest, logApiSuccess, logApiError, logApiWarning } from "./utils/logger";

// Validate environment variables
validateEnv();

const app = new Elysia()
  .use(cors())
  .use(swagger())
  .derive(({ request, path }) => {
    const startTime = Date.now();
    const method = request.method;
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || undefined;
    
    // Log incoming request
    logApiRequest(method, path, userId);
    
    return {
      startTime,
      derivedUserId: userId,
      derivedMethod: method,
      derivedPath: path,
    };
  })
  .onAfterHandle(({ derivedMethod, derivedPath, startTime, response, derivedUserId }) => {
    const duration = Date.now() - startTime;
    
    // Check if response indicates success or error
    if (typeof response === "object" && response !== null) {
      const apiResponse = response as any;
      
      if (apiResponse.success === false) {
        logApiWarning(derivedMethod, derivedPath, apiResponse.error || "API returned error", derivedUserId);
      } else {
        logApiSuccess(derivedMethod, derivedPath, duration, derivedUserId);
      }
    } else {
      logApiSuccess(derivedMethod, derivedPath, duration, derivedUserId);
    }
  })
  // Global error handling
  .onError(({ error, code, derivedMethod, derivedPath, derivedUserId }) => {
    logApiError(derivedMethod || "UNKNOWN", derivedPath || "/", error, derivedUserId);
    
    if (code === "VALIDATION") {
      return {
        success: false,
        error: "Validation failed",
        details: error.message,
      };
    }

    return {
      success: false,
      error: "Internal server error",
    };
  })

  // Health check endpoint
  .get("/health", () => ({
    success: true,
    message: "API is running",
    timestamp: new Date().toISOString(),
  }))

  // API routes
  .group(env.API_PREFIX, (app) =>
    app.use(configurationsRoutes)
       .use(aiRoutes)
       .use(sessionRoutes)
       .use(filesRoutes)
       .use(systemPromptsRoutes)
  )

  // Start server
  .listen(env.PORT);

// Test database connection on startup
testConnection().then((connected) => {
  if (!connected) {
    logger.error("Failed to connect to database. Exiting...");
    process.exit(1);
  }
  logger.success("Database connection established");
});

logger.info(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`
);
logger.info(`📊 API endpoints available at http://localhost:${env.PORT}${env.API_PREFIX}`);
logger.info(`🏥 Health check: http://localhost:${env.PORT}/health`);

export type App = typeof app 
