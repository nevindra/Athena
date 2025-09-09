#!/bin/bash

# Stop Athena PM2 processes
echo "⏹️ Stopping Athena backend..."

pm2 stop athena-backend
pm2 status