#!/bin/bash

# Start Athena with PM2
echo "🚀 Starting Athena backend with PM2..."

# Create logs directory if it doesn't exist
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Show status
pm2 status