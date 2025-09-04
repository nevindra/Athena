=== Starting Athena Application with nginx Reverse Proxy ===
Environment:
Backend directory: /app/apps/backend-api
Frontend directory: /app/apps/frontend
Nginx will serve on port 80

=== Starting Backend (Port 3000) ===
Current directory: /app/apps/backend-api
Files in directory:
total 20
drwxr-xr-x    1 root     root          4096 Sep  4 02:52 .
drwxr-xr-x    1 root     root          4096 Sep  4 02:52 ..
-rw-rw-r--    1 root     root          1014 Sep  4 01:08 package.json
drwxr-xr-x    8 root     root          4096 Sep  4 01:08 src
Package.json exists:
-rw-rw-r--    1 root     root          1014 Sep  4 01:08 package.json
Source directory:
total 36
drwxr-xr-x    8 root     root          4096 Sep  4 01:08 .
drwxr-xr-x    1 root     root          4096 Sep  4 02:52 ..
drwxrwxr-x    2 root     root          4096 Sep  4 01:55 config
drwxrwxr-x    2 root     root          4096 Sep  4 01:08 controllers
drwxrwxr-x    3 root     root          4096 Sep  4 01:08 db
-rw-rw-r--    1 root     root          3112 Sep  4 01:08 index.ts
drwxrwxr-x    2 root     root          4096 Sep  4 01:08 routes
drwxrwxr-x    2 root     root          4096 Sep  4 01:08 services
drwxrwxr-x    2 root     root          4096 Sep  4 01:08 utils

Starting backend with: bun run src/index.ts
Backend started with PID: 12
ℹ 🦊 Elysia is running at http://localhost:3000
ℹ 📊 API endpoints available at http://localhost:3000/api
ℹ 🏥 Health check: http://localhost:3000/health
✅ Database connection successful
✔ Database connection established

=== Starting Frontend (Port 5173) ===
Current directory: /app/apps/frontend
Files in directory:
total 24
drwxr-xr-x    1 root     root          4096 Sep  4 02:52 .
drwxr-xr-x    1 root     root          4096 Sep  4 02:52 ..
drwxr-xr-x    4 root     root          4096 Sep  4 02:41 build
drwxr-xr-x    3 root     root          4096 Sep  4 02:52 node_modules
-rw-rw-r--    1 root     root          2763 Sep  4 01:08 package.json
Build directory:
total 16
drwxr-xr-x    4 root     root          4096 Sep  4 02:41 .
drwxr-xr-x    1 root     root          4096 Sep  4 02:52 ..
drwxr-xr-x    3 root     root          4096 Sep  4 02:41 client
drwxr-xr-x    2 root     root          4096 Sep  4 02:41 server
Package.json:
  "private": true,
  "type": "module",
  "scripts": {
    "build": "react-router build",
    "dev": "react-router dev",
    "start": "react-router-serve ./build/server/index.js",
    "typecheck": "react-router typegen && tsc"
  },
  "dependencies": {
    "@athena/shared": "workspace:*",
    "@hookform/resolvers": "^5.2.1",

Starting frontend with: bun run start
Frontend started with PID: 47
$ react-router-serve ./build/server/index.js
[react-router-serve] http://localhost:39585 (http://172.17.0.3:39585)

=== Starting nginx Reverse Proxy ===
Testing nginx configuration...
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
Starting nginx...
nginx started successfully

=== All services started ===
Backend PID: 12
Frontend PID: 47
nginx: Running (check with 'nginx -t')
Access the application at http://localhost (port 80)
Waiting for processes... (Ctrl+C to stop)
