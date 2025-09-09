# Athena Deployment Guide

## Prerequisites

1. **Install PM2 globally**:
   ```bash
   bun add -g pm2
   # or
   npm install -g pm2
   ```

2. **Setup environment**:
   - Copy `.env.production` and update with your production values
   - Ensure PostgreSQL is running and accessible
   - Ensure MinIO is running (if using MinIO storage)

## Deployment Steps

### Quick Deploy
```bash
bun run deploy
```

### Manual Steps

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Build frontend**:
   ```bash
   cd apps/frontend && bun run build
   ```

3. **Start with PM2**:
   ```bash
   bun run pm2:start
   ```

## PM2 Management

### Start
```bash
bun run pm2:start
# or
pm2 start ecosystem.config.js --env production
```

### Stop
```bash
bun run pm2:stop
# or
pm2 stop athena-backend
```

### Restart
```bash
bun run pm2:restart
# or
pm2 restart athena-backend
```

### Monitor
```bash
pm2 status
pm2 logs athena-backend
pm2 monit
```

### Auto-start on boot
```bash
pm2 startup
pm2 save
```

## Configuration Files

- `ecosystem.config.js` - PM2 configuration
- `.env.production` - Production environment variables
- `apps/backend-api/src/index.ts` - Backend entry point with CORS config

## CORS Configuration

The backend supports multiple CORS origins. Update `CORS_ORIGIN` in your environment:

```bash
# Single origin
CORS_ORIGIN=https://your-domain.com

# Multiple origins (comma-separated)
CORS_ORIGIN=http://localhost:5173,https://your-domain.com,https://staging.your-domain.com

# Allow all (not recommended for production)
CORS_ORIGIN=*
```

## Vite Configuration

The Vite config includes:
- Development proxy to backend API
- Production build optimizations
- Chunk splitting for better caching
- CORS support

## Troubleshooting

### Backend won't start
1. Check environment variables in `.env.production`
2. Verify database connectivity
3. Check PM2 logs: `pm2 logs athena-backend`

### CORS errors
1. Verify `CORS_ORIGIN` includes your frontend domain
2. Check protocol (http vs https)
3. Ensure no trailing slashes in origins

### Build errors
1. Run `bun install` to update dependencies
2. Check TypeScript errors: `cd apps/frontend && bun run typecheck`
3. Clear build cache: `rm -rf apps/frontend/dist`

## Production Checklist

- [ ] Update `ENCRYPTION_KEY` with secure 32-character key
- [ ] Set proper database credentials
- [ ] Configure `CORS_ORIGIN` with your domain(s)
- [ ] Setup HTTPS/SSL certificates
- [ ] Configure firewall rules
- [ ] Setup backup for database
- [ ] Monitor logs and performance

## Scaling

For multiple instances:
```javascript
// In ecosystem.config.js
instances: 'max', // Use all CPU cores
exec_mode: 'cluster'
```

For load balancing, consider using nginx as a reverse proxy.