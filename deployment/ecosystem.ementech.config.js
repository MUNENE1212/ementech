/**
 * PM2 Ecosystem Configuration
 * For serving Ementech corporate website (static build)
 *
 * This configuration uses PM2 to serve the static React build
 * as a simple Node.js static file server using 'serve' package
 *
 * Location: /var/www/ecosystem.ementech.config.js
 */

module.exports = {
  apps: [
    {
      name: 'ementech-website',
      script: 'serve',
      args: '-s dist -l 3001', // -s for single-page app, -l for port
      cwd: '/var/www/ementech-website/current',
      interpreter: 'none',
      exec_mode: 'fork',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/var/log/pm2/ementech-website-error.log',
      out_file: '/var/log/pm2/ementech-website-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      min_uptime: '10s',
      max_restarts: 10,
      kill_timeout: 5000,
      // Graceful shutdown
      shutdown_with_message: true
    }
  ],

  deploy: {
    production: {
      user: 'node-user',
      host: 'ementech.co.ke',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/ementech-website.git',
      path: '/var/www/ementech-website',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.ementech.config.js --env production',
      'pre-setup': 'mkdir -p /var/log/pm2 && mkdir -p /var/www/ementech-website',
      'ssh_options': 'StrictHostKeyChecking=no'
    }
  }
};
