module.exports = {
  apps: [
    {
      name: 'athena-backend',
      script: 'bun',
      args: 'run apps/backend-api/src/index.ts',
      cwd: '/Users/nevindra/Developer/Athena',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        DB_HOST: 'localhost',
        DB_PORT: 5432,
        DB_USER: 'postgres',
        DB_PASSWORD: 'postgres',
        DB_NAME: 'athena',
        API_PREFIX: '/api',
        CORS_ORIGIN: 'http://localhost:5173,https://your-frontend-domain.com',
        STORAGE_PROVIDER: 'minio',
        MINIO_ENDPOINT: 'localhost:9000',
        MINIO_ACCESS_KEY: 'minioadmin',
        MINIO_SECRET_KEY: 'minioadmin',
        MINIO_BUCKET: 'athena-files',
        MINIO_USE_SSL: 'false',
        ENCRYPTION_KEY: 'your-production-encryption-key-here'
      },
      error_file: './logs/pm2-backend-error.log',
      out_file: './logs/pm2-backend-out.log',
      log_file: './logs/pm2-backend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      max_memory_restart: '500M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'athena-frontend',
      script: 'bun',
      args: 'run dev',
      cwd: '/Users/nevindra/Developer/Athena/apps/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        PORT: 5173,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5173,
      },
      error_file: './logs/pm2-frontend-error.log',
      out_file: './logs/pm2-frontend-out.log',
      log_file: './logs/pm2-frontend-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm Z',
      merge_logs: true,
      max_memory_restart: '300M',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git', 'dist'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};