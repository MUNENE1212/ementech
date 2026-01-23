#!/bin/bash

################################################################################
# Monitoring Setup Script
# Purpose: Configure monitoring, logging, and alerting for VPS
# Usage: ./setup-monitoring.sh [--skip-pm2-plus] [--skip-email]
################################################################################

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

################################################################################
# CONFIGURATION
################################################################################

# Email configuration
ALERT_EMAIL="admin@ementech.co.ke"
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="alerts@ementech.co.ke"
SMTP_PASS="" # Set via environment variable

# Monitoring settings
PM2_PLUS_LINK="" # Optional: PM2 Plus link
DISK_ALERT_THRESHOLD=80
MEMORY_ALERT_THRESHOLD=80
CPU_ALERT_THRESHOLD=80

# Flags
SKIP_PM2_PLUS=false
SKIP_EMAIL=false
DRY_RUN=false

################################################################################
# COLORS
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

################################################################################
# LOGGING
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

################################################################################
# USAGE
################################################################################

usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Setup monitoring and alerting for VPS.

OPTIONS:
    --skip-pm2-plus    Skip PM2 Plus setup
    --skip-email       Skip email alert setup
    --dry-run          Show what would be done
    -h, --help         Show this help message

ENVIRONMENT VARIABLES:
    ALERT_EMAIL        Email for alerts (default: admin@ementech.co.ke)
    SMTP_PASS          SMTP password for sending alerts

EXAMPLES:
    # Full monitoring setup
    sudo bash $0

    # Setup without email alerts
    sudo bash $0 --skip-email
EOF
    exit 0
}

################################################################################
# PARSE ARGUMENTS
################################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-pm2-plus)
            SKIP_PM2_PLUS=true
            shift
            ;;
        --skip-email)
            SKIP_EMAIL=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

################################################################################
# CHECK ROOT
################################################################################

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

################################################################################
# INSTALL MONITORING TOOLS
################################################################################

install_tools() {
    log_info "Installing monitoring tools..."

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would install monitoring tools"
        return
    fi

    apt-get update -y
    apt-get install -y \
        sysstat \
        htop \
        iotop \
        nethogs \
        mailutils \
        sendemail \
        libio-socket-ssl-perl \
        libnet-ssleay-perl

    # Enable sysstat
    sed -i 's/ENABLED="false"/ENABLED="true"/' /etc/default/sysstat
    systemctl restart sysstat
    systemctl enable sysstat

    log_success "Monitoring tools installed"
}

################################################################################
# SETUP PM2 MONITORING
################################################################################

setup_pm2_monitoring() {
    log_info "Setting up PM2 monitoring..."

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would setup PM2 monitoring"
        return
    fi

    # Switch to deployment user
    su - node-user <<'EOF'
        # Install PM2 Plus (optional)
        if [[ "$SKIP_PM2_PLUS" = false && -n "$PM2_PLUS_LINK" ]]; then
            pm2 link $PM2_PLUS_LINK
        fi

        # Configure PM2 to save logs
        pm2 install pm2-logrotate

        # Configure log rotation
        pm2 set pm2-logrotate:max_size 100M
        pm2 set pm2-logrotate:retain 7
        pm2 set pm2-logrotate:compress true
        pm2 set pm2-logrotate:rotateInterval '0 0 * * *'

        # Enable PM2 monitoring
        pm2 monitor
EOF

    log_success "PM2 monitoring configured"
}

################################################################################
# CREATE MONITORING SCRIPTS
################################################################################

create_monitoring_scripts() {
    log_info "Creating monitoring scripts..."

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would create monitoring scripts"
        return
    fi

    mkdir -p /usr/local/bin/monitoring

    # Disk space monitoring script
    cat > /usr/local/bin/monitoring/check-disk.sh <<'SCRIPT'
#!/bin/bash
THRESHOLD=${DISK_ALERT_THRESHOLD:-80}
ALERT_EMAIL=${ALERT_EMAIL:-admin@ementech.co.ke}

df -H | grep -vE '^Filesystem|tmpfs|cdrom' | awk '{ print $5 " " $1 }' | while read output;
do
  usage=$(echo $output | awk '{ print $1}' | cut -d'%' -f1)
  partition=$(echo $output | awk '{ print $2 }')

  if [ $usage -ge $THRESHOLD ]; then
    message="WARNING: Disk space usage on $partition is at ${usage}% on $(hostname)"
    echo "$message" | mail -s "Disk Space Alert: ${usage}% used on $(hostname)" $ALERT_EMAIL
    logger "$message"
  fi
done
SCRIPT

    # Memory monitoring script
    cat > /usr/local/bin/monitoring/check-memory.sh <<'SCRIPT'
#!/bin/bash
THRESHOLD=${MEMORY_ALERT_THRESHOLD:-80}
ALERT_EMAIL=${ALERT_EMAIL:-admin@ementech.co.ke}

MEMORY_USAGE=$(free | grep Mem | awk '{print ($3/$2) * 100.0}')

if (( $(echo "$MEMORY_USAGE > $THRESHOLD" | bc -l) )); then
    message="WARNING: Memory usage is at ${MEMORY_USAGE}% on $(hostname)"
    echo "$message" | mail -s "Memory Alert: ${MEMORY_USAGE}% used on $(hostname)" $ALERT_EMAIL
    logger "$message"
fi
SCRIPT

    # CPU monitoring script
    cat > /usr/local/bin/monitoring/check-cpu.sh <<'SCRIPT'
#!/bash
THRESHOLD=${CPU_ALERT_THRESHOLD:-80}
ALERT_EMAIL=${ALERT_EMAIL:-admin@ementech.co.ke}

CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)

if (( $(echo "$CPU_USAGE > $THRESHOLD" | bc -l) )); then
    message="WARNING: CPU usage is at ${CPU_USAGE}% on $(hostname)"
    echo "$message" | mail -s "CPU Alert: ${CPU_USAGE}% used on $(hostname)" $ALERT_EMAIL
    logger "$message"
fi
SCRIPT

    # PM2 process monitoring
    cat > /usr/local/bin/monitoring/check-pm2.sh <<'SCRIPT'
#!/bin/bash
ALERT_EMAIL=${ALERT_EMAIL:-admin@ementech.co.ke}

# Check if PM2 processes are running
if ! pm2 status | grep -q "online"; then
    message="CRITICAL: No PM2 processes are online on $(hostname)"
    echo "$message" | mail -s "PM2 Alert: No processes running on $(hostname)" $ALERT_EMAIL
    logger "$message"
fi

# Restart any stopped processes
pm2 restart all
SCRIPT

    # Application health check
    cat > /usr/local/bin/monitoring/check-apps.sh <<'SCRIPT'
#!/bin/bash
ALERT_EMAIL=${ALERT_EMAIL:-admin@ementech.co.ke}

# Check if applications are responding
APPS=(
    "https://ementech.co.ke/health"
    "https://app.ementech.co.ke/health"
    "https://api.ementech.co.ke/health"
)

for app in "${APPS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$app" || echo "000")

    if [ "$STATUS" != "200" ]; then
        message="WARNING: Application health check failed for $app (HTTP $STATUS) on $(hostname)"
        echo "$message" | mail -s "App Health Alert: $app on $(hostname)" $ALERT_EMAIL
        logger "$message"
    fi
done
SCRIPT

    # Make scripts executable
    chmod +x /usr/local/bin/monitoring/*.sh

    log_success "Monitoring scripts created"
}

################################################################################
# SETUP CRON JOBS
################################################################################

setup_cron_jobs() {
    log_info "Setting up cron jobs..."

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would setup cron jobs"
        return
    fi

    # Create monitoring crontab
    cat > /etc/cron.d/monitoring <<'CRON'
# Monitoring cron jobs
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

# Check disk space every hour
0 * * * * root /usr/local/bin/monitoring/check-disk.sh

# Check memory every 30 minutes
*/30 * * * * root /usr/local/bin/monitoring/check-memory.sh

# Check CPU every 5 minutes
*/5 * * * * root /usr/local/bin/monitoring/check-cpu.sh

# Check PM2 processes every 5 minutes
*/5 * * * * node-user /usr/local/bin/monitoring/check-pm2.sh

# Check application health every 5 minutes
*/5 * * * * root /usr/local/bin/monitoring/check-apps.sh
CRON

    chmod 644 /etc/cron.d/monitoring

    log_success "Cron jobs configured"
}

################################################################################
# SETUP UPTIME MONITORING
################################################################################

setup_uptime_monitoring() {
    log_info "Setting up uptime monitoring dashboard..."

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would setup uptime monitoring"
        return
    fi

    # Create simple uptime monitoring page
    cat > /var/www/html/status/index.html <<'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>Ementech Server Status</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        h1 { color: #333; }
        .status { padding: 15px; margin: 10px 0; border-radius: 5px; }
        .online { background: #d4edda; color: #155724; }
        .offline { background: #f8d7da; color: #721c24; }
        .info { background: #d1ecf1; color: #0c5460; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Ementech Server Status</h1>
        <div id="status"></div>
    </div>

    <script>
        async function checkStatus() {
            const services = [
                { name: 'Corporate Website', url: '/health' },
                { name: 'App Frontend', url: 'https://app.ementech.co.ke/health' },
                { name: 'Backend API', url: 'https://api.ementech.co.ke/health' }
            ];

            let html = '';

            for (const service of services) {
                try {
                    const response = await fetch(service.url);
                    const status = response.ok ? 'online' : 'offline';
                    const statusText = response.ok ? 'ONLINE' : 'OFFLINE';
                    html += `<div class="status ${status}"><strong>${service.name}:</strong> ${statusText}</div>`;
                } catch (error) {
                    html += `<div class="status offline"><strong>${service.name}:</strong> OFFLINE (Connection Error)</div>`;
                }
            }

            document.getElementById('status').innerHTML = html;
        }

        checkStatus();
        setInterval(checkStatus, 60000); // Check every minute
    </script>
</body>
</html>
HTML

    log_success "Uptime monitoring page created at /status"
}

################################################################################
# SETUP LOG AGGREGATION
################################################################################

setup_log_aggregation() {
    log_info "Setting up log aggregation..."

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would setup log aggregation"
        return
    fi

    # Create log viewer script
    cat > /usr/local/bin/view-logs.sh <<'SCRIPT'
#!/bin/bash

echo "=== Recent Application Logs ==="
echo ""

echo "=== PM2 Logs ==="
pm2 logs --lines 50 --nostream

echo ""
echo "=== nginx Error Logs ==="
tail -n 50 /var/log/nginx/error.log

echo ""
echo "=== MongoDB Logs ==="
tail -n 50 /var/log/mongodb/mongod.log

echo ""
echo "=== System Logs ==="
journalctl -n 50 --no-pager
SCRIPT

    chmod +x /usr/local/bin/view-logs.sh

    log_success "Log aggregation configured"
}

################################################################################
# SETUP ALERT NOTIFICATIONS
################################################################################

setup_alerts() {
    if [[ "$SKIP_EMAIL" = true ]]; then
        log_warning "Skipping email alert setup"
        return
    fi

    log_info "Setting up email alerts..."

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would setup email alerts"
        return
    fi

    # Configure Postfix for sending emails (basic configuration)
    if ! command -v postfix &> /dev/null; then
        DEBIAN_FRONTEND=noninteractive apt-get install -y postfix

        # Basic Postfix configuration
        postconf -e 'inet_interfaces=loopback-only'
        postconf -e 'myhostname=ementech.co.ke'
        postconf -e 'mydestination=localhost'
        systemctl restart postfix
    fi

    log_success "Email alerts configured"
}

################################################################################
# CREATE DASHBOARD
################################################################################

create_monitoring_dashboard() {
    log_info "Creating monitoring dashboard..."

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would create monitoring dashboard"
        return
    fi

    # Create admin monitoring script
    cat > /usr/local/bin/monitor-status <<'SCRIPT'
#!/bin/bash

clear
echo "╔════════════════════════════════════════╗"
echo "║     Ementech Monitoring Dashboard      ║"
echo "╚════════════════════════════════════════╝"
echo ""

echo "=== System Information ==="
echo "Hostname: $(hostname)"
echo "Uptime: $(uptime -p)"
echo "Time: $(date)"
echo ""

echo "=== CPU Usage ==="
top -bn1 | grep "Cpu(s)" | awk '{print "CPU Usage: " $2}'
echo ""

echo "=== Memory Usage ==="
free -h
echo ""

echo "=== Disk Usage ==="
df -h | grep -v tmpfs
echo ""

echo "=== PM2 Processes ==="
pm2 status
echo ""

echo "=== Recent Logs ==="
journalctl -n 10 --no-pager
echo ""

echo "=== Network Connections ==="
netstat -tuln | grep LISTEN | head -10
echo ""

echo "Run 'view-logs' for detailed logs"
SCRIPT

    chmod +x /usr/local/bin/monitor-status

    log_success "Monitoring dashboard created"
}

################################################################################
# PRINT SUMMARY
################################################################################

print_summary() {
    log_info "Monitoring setup complete!"
    echo ""
    echo "Monitoring components installed:"
    echo "  - System monitoring tools (htop, sysstat, etc.)"
    echo "  - PM2 monitoring and log rotation"
    echo "  - Automated health checks"
    echo "  - Email alerts"
    echo "  - Uptime monitoring dashboard"
    echo ""
    echo "Monitoring commands:"
    echo "  - monitor-status    View system status dashboard"
    echo "  - view-logs         View aggregated logs"
    echo "  - pm2 monit         PM2 monitoring dashboard"
    echo "  - pm2 logs          PM2 application logs"
    echo ""
    echo "Monitoring scripts location: /usr/local/bin/monitoring/"
    echo "Cron jobs: /etc/cron.d/monitoring"
    echo ""
    echo "Uptime monitoring page: https://ementech.co.ke/status"
    echo ""
    echo "Alerts will be sent to: $ALERT_EMAIL"
    echo ""
    echo "Monitoring intervals:"
    echo "  - CPU: Every 5 minutes"
    echo "  - Memory: Every 30 minutes"
    echo "  - Disk: Every hour"
    echo "  - Applications: Every 5 minutes"
}

################################################################################
# MAIN FLOW
################################################################################

main() {
    echo "╔════════════════════════════════════════╗"
    echo "║   Monitoring Setup Script             ║"
    echo "╚════════════════════════════════════════╝"
    echo ""

    check_root
    install_tools
    setup_pm2_monitoring
    create_monitoring_scripts
    setup_cron_jobs
    setup_uptime_monitoring
    setup_log_aggregation
    setup_alerts
    create_monitoring_dashboard
    print_summary
}

# Run main
main
