#!/bin/sh
set -e

echo "=== Starting Athena Application with nginx Reverse Proxy ==="
echo "Environment: $NODE_ENV"
echo "Backend directory: /app/apps/backend-api"
echo "Frontend directory: /app/apps/frontend"
echo "Nginx will serve on port 80"
echo ""

# Function to handle cleanup
cleanup() {
    echo "Shutting down..."
    # Stop nginx gracefully
    nginx -s quit 2>/dev/null || true
    # Kill all background processes
    kill 0
    wait
    echo "All processes stopped."
    exit 0
}

# Set trap to handle SIGTERM and SIGINT
trap cleanup TERM INT

# Start backend in background
echo "=== Starting Backend (Port 3000) ==="
cd /app/apps/backend-api
echo "Current directory: $(pwd)"
echo "Files in directory:"
ls -la
echo "Package.json exists:"
ls -la package.json 2>/dev/null || echo "No package.json found"
echo "Source directory:"
ls -la src/ 2>/dev/null || echo "No src directory found"
echo "Production environment file:"
ls -la .env.production 2>/dev/null || echo "No .env.production found"
echo ""

# Use production environment file if it exists
if [ -f .env.production ]; then
    echo "Using production environment configuration"
    cp .env.production .env
else
    echo "Warning: No .env.production found, using defaults"
fi

echo "Starting backend with: bun run src/index.ts"
bun run src/index.ts &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait a bit for backend to start
sleep 2

# Check if backend is still running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "ERROR: Backend process died immediately!"
    wait $BACKEND_PID
    exit 1
fi

echo ""
echo "=== Frontend SPA Build Check ==="
cd /app/apps/frontend
echo "Current directory: $(pwd)"
echo "Build directory contents:"
ls -la build/ 2>/dev/null || echo "ERROR: No build directory found!"
echo "Client build contents:"
ls -la build/client/ 2>/dev/null || echo "ERROR: No client build directory found!"
echo "Checking for index.html:"
ls -la build/client/index.html 2>/dev/null || echo "ERROR: No index.html found!"
echo "SPA will be served statically by nginx from build/client directory"

echo ""
echo "=== Starting nginx Reverse Proxy ==="
echo "Testing nginx configuration..."
nginx -t
if [ $? -ne 0 ]; then
    echo "ERROR: nginx configuration is invalid!"
    cleanup
    exit 1
fi

echo "Starting nginx..."
nginx
echo "nginx started successfully"

echo ""
echo "=== All services started ==="
echo "Backend PID: $BACKEND_PID"
echo "nginx: Running (check with 'nginx -t')"
echo "Frontend: Served statically by nginx from SPA build"
echo "Access the application at http://localhost (port 80)"
echo "API available at http://localhost/api"
echo "Waiting for backend process... (Ctrl+C to stop)"

# Wait for backend process to exit
wait $BACKEND_PID

# If we reach here, backend process exited
EXIT_CODE=$?
echo "Backend process exited with code: $EXIT_CODE"

# Kill remaining processes and exit
cleanup