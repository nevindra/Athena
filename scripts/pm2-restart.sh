#!/bin/bash

# Restart Athena PM2 processes
echo "🔄 Restarting Athena backend..."

pm2 restart athena-backend
pm2 status