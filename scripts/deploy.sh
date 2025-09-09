#!/bin/bash

# Athena PM2 Deployment Script

echo "🚀 Starting Athena deployment..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Build frontend
echo "🔨 Building frontend..."
cd apps/frontend
bun run build
cd ../..

# Stop existing PM2 processes
echo "⏹️ Stopping existing PM2 processes..."
pm2 stop athena-backend 2>/dev/null || echo "No existing process to stop"
pm2 delete athena-backend 2>/dev/null || echo "No existing process to delete"

# Start backend with PM2
echo "🔄 Starting backend with PM2..."
pm2 start ecosystem.config.js --env production

# Show PM2 status
echo "📊 PM2 Status:"
pm2 status

echo "✅ Deployment completed!"
echo "🔗 Backend API: http://localhost:3000/api"
echo "🔗 Health check: http://localhost:3000/health"
echo "📝 Logs: pm2 logs athena-backend"