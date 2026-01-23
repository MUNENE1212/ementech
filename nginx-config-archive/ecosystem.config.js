// /var/www/ecosystem.config.js
// PM2 Ecosystem Configuration for Node.js Applications

module.exports = {
  apps: [
    // Dumu Waks Backend Application
    {
      name: 'dumuwaks-backend',
      script: './server/index.js', // Adjust path to your entry point
      cwd: '/var/www/dumuwaks-backend/current',
      instances: 1, // Use 'max' for cluster mode (multiple instances)
      exec_mode: 'fork', // Use 'cluster' for multiple instances
      env: {
        NODE_ENV: 'production',
        PORT: 5000
        // Add other environment variables here
        // DATABASE_URL: 'your-database-url'
        // JWT_SECRET: 'your-jwt-secret'
        // Add any API keys or configuration
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/pm2/dumuwaks-backend-error.log',
      out_file: '/var/log/pm2/dumuwaks-backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false, // Set to true only for development
      max_memory_restart: '1G',
      min_uptime: '10s',
      max_restarts: 10,
      // Kill timeout for graceful shutdown
      kill_timeout: 5000,
      // Wait timeout for ready check
      wait_ready: true,
      // Listen timeout
      listen_timeout: 10000
    }
  ],

  deploy: {
    production: {
      user: 'node-user', // SSH user for deployment
      host: 'ementech.co.ke', // Server hostname/IP
      ref: 'origin/main', // Git branch to deploy
      repo: 'git@github.com:your-username/your-repo.git', // Git repository
      path: '/var/www/dumuwaks-backend', // Deployment path
      'post-deploy': 'npm install --production && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /var/log/pm2'
    }
  }
};
