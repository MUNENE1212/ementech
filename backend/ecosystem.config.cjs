module.exports = {
  apps: [
    {
      name: 'ementech-backend',
      script: 'src/server.js',
      cwd: '/var/www/ementech-website/backend',
      instances: 1,
      exec_mode: 'fork',
      node_args: '--max-old-space-size=256',
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      },
      // Logging
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/pm2/ementech-backend-error.log',
      out_file: '/var/log/pm2/ementech-backend-out.log',
      merge_logs: true,
      // Restart behavior
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 4000,
      autorestart: true,
      // Monitoring
      watch: false,
      ignore_watch: ['node_modules', 'logs', '*.log']
    }
  ]
};
