#!/bin/bash

################################################################################
# VPS Initialization Script
# Purpose: Complete VPS setup for Ementech projects deployment
# Usage: ./setup-vps.sh [--skip-firewall] [--skip-ssl] [--skip-mongodb]
#
# This script should be run on a fresh Ubuntu 22.04 LTS VPS
# Run with: sudo bash setup-vps.sh
################################################################################

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

################################################################################
# CONFIGURATION
################################################################################

# Domain configuration
DOMAIN="ementech.co.ke"
SUBDOMAINS=("app" "api")
ADMIN_EMAIL="admin@ementech.co.ke"

# Database configuration
MONGODB_VERSION="7.0"
REDIS_VERSION="latest"

# Node.js configuration
NODE_VERSION="20.x"

# User configuration
DEPLOY_USER="node-user"
DEPLOY_PASSWORD="" # Will be generated if not set

# Flags
SKIP_FIREWALL=false
SKIP_SSL=false
SKIP_MONGODB=false
SKIP_REDIS=false
DRY_RUN=false

################################################################################
# COLORS FOR OUTPUT
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

################################################################################
# LOGGING FUNCTIONS
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

log_step() {
    echo -e "\n${BOLD}${BLUE}==> $1${NC}\n"
}

################################################################################
# USAGE
################################################################################

usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Initialize a fresh Ubuntu VPS for Ementech projects deployment.

OPTIONS:
    --skip-firewall     Skip firewall configuration
    --skip-ssl          Skip SSL certificate installation
    --skip-mongodb      Skip MongoDB installation
    --skip-redis        Skip Redis installation
    --dry-run           Show what would be done without making changes
    -h, --help          Show this help message

ENVIRONMENT VARIABLES:
    DOMAIN              Main domain (default: ementech.co.ke)
    ADMIN_EMAIL         Admin email for SSL (default: admin@ementech.co.ke)

EXAMPLES:
    # Full setup
    sudo bash $0

    # Skip SSL (configure later)
    sudo bash $0 --skip-ssl

    # Dry run to see what will be installed
    sudo bash $0 --dry-run
EOF
    exit 0
}

################################################################################
# PARSE ARGUMENTS
################################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-firewall)
            SKIP_FIREWALL=true
            shift
            ;;
        --skip-ssl)
            SKIP_SSL=true
            shift
            ;;
        --skip-mongodb)
            SKIP_MONGODB=true
            shift
            ;;
        --skip-redis)
            SKIP_REDIS=true
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
# SYSTEM CHECKS
################################################################################

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

check_os() {
    if [[ ! -f /etc/os-release ]]; then
        log_error "Cannot detect OS version"
        exit 1
    fi

    . /etc/os-release

    if [[ "$ID" != "ubuntu" ]]; then
        log_error "This script is designed for Ubuntu. Detected: $ID"
        exit 1
    fi

    log_info "Detected Ubuntu $VERSION_ID"
}

################################################################################
# SYSTEM UPDATE
################################################################################

update_system() {
    log_step "Updating system packages"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would update system packages"
        return
    fi

    export DEBIAN_FRONTEND=noninteractive

    apt-get update -y
    apt-get upgrade -y
    apt-get autoremove -y
    apt-get autoclean -y

    log_success "System updated"
}

################################################################################
# INSTALL BASIC UTILITIES
################################################################################

install_utilities() {
    log_step "Installing basic utilities"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would install utilities"
        return
    fi

    apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        ufw \
        fail2ban \
        htop \
        nano \
        vim \
        tree \
        net-tools \
        rsync

    log_success "Utilities installed"
}

################################################################################
# INSTALL NODE.JS
################################################################################

install_nodejs() {
    log_step "Installing Node.js $NODE_VERSION"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would install Node.js"
        return
    fi

    # Install Node.js using NodeSource repository
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}" | bash -
    apt-get install -y nodejs

    # Verify installation
    NODE_VERSION_CHECK=$(node --version)
    NPM_VERSION_CHECK=$(npm --version)

    log_success "Node.js $NODE_VERSION_CHECK installed"
    log_success "npm $NPM_VERSION_CHECK installed"

    # Install global packages
    npm install -g pm2
    npm install -g serve

    log_success "PM2 and serve installed globally"
}

################################################################################
# INSTALL MONGODB
################################################################################

install_mongodb() {
    if [[ "$SKIP_MONGODB" = true ]]; then
        log_warning "Skipping MongoDB installation"
        return
    fi

    log_step "Installing MongoDB $MONGODB_VERSION"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would install MongoDB"
        return
    fi

    # Import MongoDB public key
    curl -fsSL https://www.mongodb.org/static/pgp/server-${MONGODB_VERSION}.asc | \
        gpg -o /usr/share/keyrings/mongodb-server-${MONGODB_VERSION}.gpg --dearmor

    # Add MongoDB repository
    echo "deb [ arch=amd64,arm64 signed-by=/usr/share/keyrings/mongodb-server-${MONGODB_VERSION}.gpg ] \
        https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/${MONGODB_VERSION} multiverse" | \
        tee /etc/apt/sources.list.d/mongodb-org-${MONGODB_VERSION}.list

    # Update and install
    apt-get update -y
    apt-get install -y mongodb-org

    # Start and enable MongoDB
    systemctl start mongod
    systemctl enable mongod

    # Verify installation
    if systemctl is-active --quiet mongod; then
        log_success "MongoDB installed and running"
    else
        log_error "MongoDB failed to start"
        exit 1
    fi
}

################################################################################
# INSTALL REDIS
################################################################################

install_redis() {
    if [[ "$SKIP_REDIS" = true ]]; then
        log_warning "Skipping Redis installation"
        return
    fi

    log_step "Installing Redis"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would install Redis"
        return
    fi

    apt-get install -y redis-server

    # Configure Redis
    sed -i 's/supervised no/supervised systemd/' /etc/redis/redis.conf

    # Start and enable Redis
    systemctl start redis-server
    systemctl enable redis-server

    log_success "Redis installed and running"
}

################################################################################
# INSTALL NGINX
################################################################################

install_nginx() {
    log_step "Installing nginx"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would install nginx"
        return
    fi

    apt-get install -y nginx

    # Create SSL directory
    mkdir -p /etc/nginx/ssl

    # Generate Diffie-Hellman parameters for SSL
    if [[ ! -f /etc/nginx/ssl/dhparam.pem ]]; then
        log_info "Generating DH parameters (this may take a while)..."
        openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
    fi

    # Start and enable nginx
    systemctl start nginx
    systemctl enable nginx

    log_success "nginx installed and running"
}

################################################################################
# CONFIGURE FIREWALL
################################################################################

configure_firewall() {
    if [[ "$SKIP_FIREWALL" = true ]]; then
        log_warning "Skipping firewall configuration"
        return
    fi

    log_step "Configuring firewall (UFW)"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would configure firewall"
        return
    fi

    # Allow SSH
    ufw allow 22/tcp

    # Allow HTTP/HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Allow Node.js apps (optional, can be removed if using nginx only)
    ufw allow 3001/tcp
    ufw allow 5000/tcp

    # Allow MongoDB (only if needed locally)
    # ufw allow 27017/tcp

    # Allow Redis (only if needed locally)
    # ufw allow 6379/tcp

    # Enable firewall
    ufw --force enable

    log_success "Firewall configured and enabled"
}

################################################################################
# CREATE DEPLOYMENT USER
################################################################################

create_deploy_user() {
    log_step "Creating deployment user"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would create deployment user"
        return
    fi

    # Check if user exists
    if id "$DEPLOY_USER" &>/dev/null; then
        log_info "User $DEPLOY_USER already exists"
        return
    fi

    # Create user
    useradd -m -s /bin/bash "$DEPLOY_USER"

    # Add to sudo group
    usermod -aG sudo "$DEPLOY_USER"

    # Set password (generate if not provided)
    if [[ -z "$DEPLOY_PASSWORD" ]]; then
        DEPLOY_PASSWORD=$(openssl rand -base64 16)
        log_info "Generated password for $DEPLOY_USER: $DEPLOY_PASSWORD"
        log_warning "Save this password securely!"
    else
        echo "$DEPLOY_USER:$DEPLOY_PASSWORD" | chpasswd
    fi

    # Configure sudo for passwordless npm/PM2
    cat > /etc/sudoers.d/node-user <<EOF
$DEPLOY_USER ALL=(ALL) NOPASSWD: /usr/bin/npm, /usr/bin/pm2, /usr/bin/systemctl reload nginx, /usr/bin/nginx
EOF

    chmod 0440 /etc/sudoers.d/node-user

    log_success "Deployment user $DEPLOY_USER created"
}

################################################################################
# CREATE DIRECTORIES
################################################################################

create_directories() {
    log_step "Creating deployment directories"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would create directories"
        return
    fi

    # Main deployment directories
    mkdir -p /var/www/ementech-website/current
    mkdir -p /var/www/ementech-website/releases

    mkdir -p /var/www/dumuwaks-frontend/current
    mkdir -p /var/www/dumuwaks-frontend/releases

    mkdir -p /var/www/dumuwaks-backend/current
    mkdir -p /var/www/dumuwaks-backend/releases

    # Log directories
    mkdir -p /var/log/pm2
    mkdir -p /var/log/apps

    # Upload directories
    mkdir -p /var/www/uploads
    mkdir -p /var/www/dumuwaks-backend/uploads

    # Set ownership
    chown -R $DEPLOY_USER:$DEPLOY_USER /var/www
    chown -R www-data:www-data /var/www

    log_success "Directories created"
}

################################################################################
# CONFIGURE PM2
################################################################################

configure_pm2() {
    log_step "Configuring PM2"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would configure PM2"
        return
    fi

    # Switch to deploy user
    su - "$DEPLOY_USER" <<'EOF'
        # Enable PM2 startup script
        pm2 startup systemd -hp /home/node-user --service-name pm2-root
EOF

    log_success "PM2 configured"
}

################################################################################
# INSTALL SSL CERTIFICATES
################################################################################

install_ssl_certificates() {
    if [[ "$SKIP_SSL" = true ]]; then
        log_warning "Skipping SSL certificate installation"
        return
    fi

    log_step "Installing SSL certificates with Let's Encrypt"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would install SSL certificates"
        return
    fi

    # Install Certbot
    apt-get install -y certbot python3-certbot-nginx

    # Install certificates for main domain and subdomains
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL" --redirect

    # Install certificates for subdomains (if DNS is configured)
    certbot --nginx -d "app.$DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL" --redirect || \
        log_warning "Could not install certificate for app.$DOMAIN (DNS may not be configured yet)"

    certbot --nginx -d "api.$DOMAIN" --non-interactive --agree-tos --email "$ADMIN_EMAIL" --redirect || \
        log_warning "Could not install certificate for api.$DOMAIN (DNS may not be configured yet)"

    # Setup auto-renewal
    systemctl enable certbot.timer
    systemctl start certbot.timer

    log_success "SSL certificates installed"
}

################################################################################
# CONFIGURE LOGROTATE
################################################################################

configure_logrotate() {
    log_step "Configuring log rotation"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would configure logrotate"
        return
    fi

    # PM2 logs
    cat > /etc/logrotate.d/pm2 <<EOF
/var/log/pm2/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 $DEPLOY_USER $DEPLOY_USER
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

    # Application logs
    cat > /etc/logrotate.d/apps <<EOF
/var/log/apps/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
}
EOF

    # nginx logs
    cat > /etc/logrotate.d/nginx-custom <<EOF
/var/log/nginx/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx >/dev/null 2>&1
    endscript
}
EOF

    log_success "Log rotation configured"
}

################################################################################
# FINALIZE SETUP
################################################################################

finalize_setup() {
    log_step "Finalizing setup"

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Would finalize setup"
        return
    fi

    # Set system timezone
    timedatectl set-timezone Africa/Nairobi

    # Disable root login (optional, uncomment if desired)
    # sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    # systemctl restart sshd

    # Configure system limits
    cat > /etc/security/limits.d/node-app.conf <<EOF
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF

    # Optimize sysctl
    cat >> /etc/sysctl.conf <<EOF

# Optimization for Node.js applications
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
net.ipv4.tcp_tw_reuse = 1
net.ipv4.ip_local_port_range = 10240 65535
EOF

    sysctl -p

    log_success "Setup finalized"
}

################################################################################
# PRINT SUMMARY
################################################################################

print_summary() {
    log_step "VPS Setup Complete!"

    echo -e "${GREEN}✓${NC} System configured successfully"
    echo ""
    echo "Installed components:"
    echo "  - Node.js $(node --version)"
    echo "  - npm $(npm --version)"
    echo "  - PM2 $(pm2 --version 2>/dev/null || echo 'installed')"
    echo "  - nginx $(nginx -v 2>&1 | cut -d'/' -f2)"
    [[ "$SKIP_MONGODB" = false ]] && echo "  - MongoDB $MONGODB_VERSION"
    [[ "$SKIP_REDIS" = false ]] && echo "  - Redis"
    echo ""

    if [[ "$SKIP_SSL" = false ]]; then
        echo "SSL certificates installed for:"
        echo "  - https://$DOMAIN"
        echo "  - https://www.$DOMAIN"
        echo "  - https://app.$DOMAIN"
        echo "  - https://api.$DOMAIN"
    fi

    echo ""
    echo "Next steps:"
    echo "  1. Configure DNS records to point to this VPS"
    echo "  2. If SSL was skipped, run: sudo certbot --nginx"
    echo "  3. Deploy applications using deployment scripts"
    echo "  4. Monitor with: pm2 monit"
    echo ""
    echo "Important files:"
    echo "  - nginx configs: /etc/nginx/sites-available/"
    echo "  - PM2 logs: /var/log/pm2/"
    echo "  - App logs: /var/log/apps/"
    echo ""

    if [[ -n "$DEPLOY_PASSWORD" ]]; then
        echo -e "${YELLOW}${BOLD}IMPORTANT: Save the deployment user password:${NC}"
        echo "  Username: $DEPLOY_USER"
        echo "  Password: $DEPLOY_PASSWORD"
        echo ""
    fi
}

################################################################################
# MAIN SETUP FLOW
################################################################################

main() {
    echo -e "${BOLD}${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║     Ementech VPS Initialization        ║${NC}"
    echo -e "${BOLD}${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "Started at: $(date)"
    echo ""

    check_root
    check_os

    update_system
    install_utilities
    install_nodejs
    install_mongodb
    install_redis
    install_nginx
    configure_firewall
    create_deploy_user
    create_directories
    configure_pm2
    install_ssl_certificates
    configure_logrotate
    finalize_setup

    print_summary

    echo "Completed at: $(date)"
}

# Run main function
main
