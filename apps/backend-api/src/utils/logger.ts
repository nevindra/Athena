import { consola } from "consola";

// Configure consola
export const logger = consola.create({
  level: process.env.NODE_ENV === "production" ? 3 : 4, // info in prod, debug in dev
  formatOptions: {
    date: true,
    colors: true,
  },
});

// Custom logging functions for API requests
export const logApiRequest = (method: string, path: string, userId?: string) => {
  const userInfo = userId ? ` [User: ${userId}]` : "";
  logger.info(`[INFO] ${method} ${path}${userInfo}`);
};

export const logApiSuccess = (method: string, path: string, duration: number, userId?: string) => {
  const userInfo = userId ? ` [User: ${userId}]` : "";
  logger.success(`[SUCCESS] ${method} ${path}${userInfo} - ${duration}ms`);
};

export const logApiWarning = (method: string, path: string, message: string, userId?: string) => {
  const userInfo = userId ? ` [User: ${userId}]` : "";
  logger.warn(`[WARNING] ${method} ${path}${userInfo} - ${message}`);
};

export const logApiError = (method: string, path: string, error: Error | string, userId?: string) => {
  const userInfo = userId ? ` [User: ${userId}]` : "";
  const errorMsg = typeof error === "string" ? error : error.message || String(error);
  logger.error(`[ERROR] ${method} ${path}${userInfo} - ${errorMsg}`);
};