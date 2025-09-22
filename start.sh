#!/bin/sh
set -e

# Set default frontend port if not provided
FRONTEND_PORT=${FRONTEND_PORT:-4003}

echo "=== Starting Athena Application with nginx Reverse Proxy ==="
echo "Environment: $NODE_ENV"
echo "Backend directory: /app/apps/backend-api"
echo "Frontend directory: /app/apps/frontend"
echo "Frontend port: $FRONTEND_PORT"
echo "Backend port: 3000 (internal)"
echo ""

# Function to handle cleanup
cleanup() {
    # Prevent multiple cleanup calls
    if [ "$CLEANUP_RUNNING" = "1" ]; then
        return
    fi
    export CLEANUP_RUNNING=1

    echo "Shutting down..."
    # Stop nginx gracefully
    nginx -s quit 2>/dev/null || true
    # Kill all background processes
    kill 0 2>/dev/null || true
    wait 2>/dev/null || true
    echo "All processes stopped."
    exit 0
}

# Set trap to handle SIGTERM and SIGINT
trap cleanup TERM INT

# Start backend in background
echo "=== Starting Backend (Port 3000) ==="
cd /app/apps/backend-api

# Use production environment file if it exists
if [ -f .env.production ]; then
    echo "✅ Using production environment configuration"
    cp .env.production .env
else
    echo "⚠️  Warning: No .env.production found, using defaults"
fi

echo "🚀 Starting backend..."
bun run src/index.ts &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Check if backend is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "❌ ERROR: Backend process died immediately!"
    wait $BACKEND_PID
    exit 1
fi

echo "✅ Backend started successfully (PID: $BACKEND_PID)"

echo ""
echo "=== Checking Frontend Build ==="
cd /app/apps/frontend
if [ ! -f "build/client/index.html" ]; then
    echo "❌ ERROR: Frontend build not found!"
    exit 1
fi
echo "✅ Frontend SPA build ready"

echo ""
echo "=== Configuring nginx ==="
echo "🔧 Generating nginx config for port $FRONTEND_PORT..."
sed "s/__FRONTEND_PORT__/$FRONTEND_PORT/g" /app/nginx.conf.template > /etc/nginx/nginx.conf

echo "🧪 Testing nginx configuration..."
nginx -t
if [ $? -ne 0 ]; then
    echo "❌ ERROR: nginx configuration is invalid!"
    cleanup
    exit 1
fi

echo "🚀 Starting nginx..."
nginx
echo "✅ nginx started successfully"

echo ""
echo "🎉 === Athena Started Successfully ==="
echo "📱 Frontend: http://localhost:$FRONTEND_PORT"
echo "🔌 API: http://localhost:$FRONTEND_PORT/api"
echo "🛑 Press Ctrl+C to stop all services"
echo ""
echo "⏳ All process is running..."

# Wait for backend process to exit
wait $BACKEND_PID

# If we reach here, backend process exited
EXIT_CODE=$?
echo "Backend process exited with code: $EXIT_CODE"

# Kill remaining processes and exit
cleanup
