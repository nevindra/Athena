# Multi-stage Dockerfile for Athena monorepo
FROM oven/bun:1.2.15-alpine AS base

# Build argument for configurable frontend port
ARG FRONTEND_PORT=4003

WORKDIR /app

# Copy package.json files for dependency installation
COPY package.json bun.lock ./
COPY apps/backend-api/package.json ./apps/backend-api/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/shared/package.json ./apps/shared/

# Install all dependencies including devDependencies for building
RUN bun install --frozen-lockfile

# Stage 2: Build stage
FROM base AS build

# Copy all source code
COPY . .

# Copy production environment files for build
COPY apps/frontend/.env.production ./apps/frontend/.env.production

# Build the frontend application for production using production env
RUN cd apps/frontend && cp .env.production .env && bun run build

# Stage 3: Production runtime
FROM oven/bun:1.2.15-alpine AS runtime

# Build argument for configurable frontend port
ARG FRONTEND_PORT=4003

# Install nginx for reverse proxy
RUN apk add --no-cache nginx

WORKDIR /app

# Copy package.json files for production install
COPY package.json bun.lock ./
COPY apps/backend-api/package.json ./apps/backend-api/
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/shared/package.json ./apps/shared/

# Install production dependencies only
RUN bun install --frozen-lockfile --production

# Copy backend source code
COPY apps/backend-api/src ./apps/backend-api/src/
COPY apps/shared/src ./apps/shared/src/

# Copy built frontend from build stage
COPY --from=build /app/apps/frontend/build ./apps/frontend/build/

# Copy production environment files
COPY apps/backend-api/.env.production ./apps/backend-api/.env.production

# Copy nginx configuration template
COPY nginx.conf.template /app/nginx.conf.template

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# Set frontend port as environment variable
ENV FRONTEND_PORT=${FRONTEND_PORT}

# Expose configurable frontend port
EXPOSE ${FRONTEND_PORT}

# Start both processes with detailed logging
CMD ["/app/start.sh"]
