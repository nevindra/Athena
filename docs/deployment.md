# Deployment Documentation

This document covers deployment configuration including environment variables and network access for the Athena application.

## Database Configuration

```bash
DB_HOST=192.168.103.76          # Database host (default: localhost)
DB_PORT=5432                    # Database port (default: 5432)
DB_USER=postgres                # Database username (default: postgres)
DB_PASSWORD=nfvisionaire123     # Database password (default: postgres)
DB_NAME=athena                  # Database name (default: athena)
```

## Application Configuration

```bash
PORT=3000                       # Backend server port (default: 3000)
NODE_ENV=production             # Environment mode (default: development)
```

## Security Configuration

```bash
ENCRYPTION_KEY=your-secure-key  # Encryption key (REQUIRED in production)
```

## API Configuration

```bash
API_PREFIX=/api                 # API route prefix (default: /api)
CORS_ORIGIN=*                   # CORS origin policy (default: *)
```

## Docker Example Usage

```bash
docker run \
  -e DB_HOST=mydb.example.com \
  -e DB_PASSWORD=secretpassword \
  -e ENCRYPTION_KEY=my-secure-encryption-key \
  -e PORT=8080 \
  -e NODE_ENV=production \
  your-image
```

## Docker Compose Example

```yaml
environment:
  - DB_HOST=mydb.example.com
  - DB_PASSWORD=secretpassword
  - ENCRYPTION_KEY=my-secure-encryption-key
  - PORT=8080
  - NODE_ENV=production
```

## Network Access Configuration

### Local Access Only (Current Default)

The current nginx configuration only accepts connections from localhost:

```nginx
server_name localhost;
```

This restricts access to:
- `localhost`
- `127.0.0.1`
- Local machine only

### Making the Application Public

#### Option 1: Modify Built-in Nginx (if you have access to the code)

To allow external network access, modify `nginx.conf`:

**Accept Any Hostname:**
```nginx
server_name _;
```

**Specific Domain:**
```nginx
server_name your-domain.com;
```

**Specific IP Address:**
```nginx
server_name 192.168.103.76;  # Your server's IP
```

#### Option 2: Add External Nginx Proxy (recommended for Docker-only access)

If you only have the Docker image and can't modify the built-in configuration, add an external nginx proxy on your host:

**Install nginx on your host:**
```bash
# Ubuntu/Debian
sudo apt update && sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

**Create nginx configuration:**
```bash
sudo nano /etc/nginx/sites-available/athena
```

**Configuration content:**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or _ for any domain

    location / {
        proxy_pass http://localhost:3000;  # assuming container runs on port 3000
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Enable the site:**
```bash
sudo ln -s /etc/nginx/sites-available/athena /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

**Ensure your Docker container is accessible:**
```bash
# Make sure Docker container port is mapped to localhost
docker run -p 3000:80 your-athena-image
```

### Docker Port Mapping

When running with Docker, expose port 80:

```bash
docker run -p 80:80 your-image
```

Or with Docker Compose:

```yaml
ports:
  - "80:80"
```

### Production HTTPS Configuration

For production deployments, add SSL configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Your existing location blocks...
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## Important Notes

- `ENCRYPTION_KEY` is required and will throw an error if not set in production mode
- Docker environment variables take precedence over `.env` files
- The application reads from `process.env` with fallback defaults defined in `apps/backend-api/src/config/env.ts`
- Current configuration is secure and only accessible locally
- For public access, ensure proper security measures are in place
