#!/bin/bash
#
# Nginx Multi-Application Setup Script
# For Interserver VPS Deployment
#
# Usage: sudo bash setup-nginx.sh
#

set -e

echo "========================================="
echo "Nginx Multi-Application Setup Script"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Error: Please run this script as root (sudo)"
    exit 1
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "[INFO] $1"
}

# Step 1: Update system
echo "========================================="
echo "Step 1: Updating System Packages"
echo "========================================="
apt update
apt upgrade -y
print_success "System updated"

# Step 2: Install dependencies
echo ""
echo "========================================="
echo "Step 2: Installing Dependencies"
echo "========================================="
apt install -y nginx certbot python3-certbot-nginx curl wget git
print_success "Dependencies installed"

# Step 3: Create directories
echo ""
echo "========================================="
echo "Step 3: Creating Required Directories"
echo "========================================="
mkdir -p /etc/nginx/ssl
mkdir -p /var/log/pm2
mkdir -p /var/www/ementech-website/current/dist
mkdir -p /var/www/dumuwaks-frontend/current/dist
mkdir -p /var/www/dumuwaks-backend/current
chmod 755 /var/www
chown -R $SUDO_USER:$SUDO_USER /var/log/pm2
print_success "Directories created"

# Step 4: Copy nginx configuration
echo ""
echo "========================================="
echo "Step 4: Installing Nginx Configuration"
echo "========================================="
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Backup existing nginx.conf
if [ -f /etc/nginx/nginx.conf ]; then
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup.$(date +%Y%m%d_%H%M%S)
    print_warning "Backed up existing nginx.conf"
fi

# Copy new configurations
cp "$SCRIPT_DIR/nginx-main.conf" /etc/nginx/nginx.conf
cp "$SCRIPT_DIR/ementech-website.conf" /etc/nginx/sites-available/
cp "$SCRIPT_DIR/dumuwaks-frontend.conf" /etc/nginx/sites-available/
cp "$SCRIPT_DIR/dumuwaks-backend.conf" /etc/nginx/sites-available/
cp "$SCRIPT_DIR/logrotate-nginx" /etc/logrotate.d/nginx

print_success "Nginx configuration files installed"

# Step 5: Enable server blocks
echo ""
echo "========================================="
echo "Step 5: Enabling Server Blocks"
echo "========================================="
ln -sf /etc/nginx/sites-available/ementech-website.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/dumuwaks-frontend.conf /etc/nginx/sites-enabled/
ln -sf /etc/nginx/sites-available/dumuwaks-backend.conf /etc/nginx/sites-enabled/

# Remove default site if it exists
if [ -L /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    print_warning "Removed default nginx site"
fi

print_success "Server blocks enabled"

# Step 6: Copy PM2 ecosystem file
echo ""
echo "========================================="
echo "Step 6: Installing PM2 Ecosystem File"
echo "========================================="
cp "$SCRIPT_DIR/ecosystem.config.js" /var/www/
chown $SUDO_USER:$SUDO_USER /var/www/ecosystem.config.js
print_success "PM2 ecosystem file installed"

# Step 7: Generate DH parameters
echo ""
echo "========================================="
echo "Step 7: Generating SSL Parameters"
echo "========================================="
if [ ! -f /etc/nginx/ssl/dhparam.pem ]; then
    print_info "This will take a few minutes..."
    openssl dhparam -out /etc/nginx/ssl/dhparam.pem 2048
    chmod 600 /etc/nginx/ssl/dhparam.pem
    print_success "DH parameters generated"
else
    print_warning "DH parameters already exist, skipping"
fi

# Step 8: Test nginx configuration
echo ""
echo "========================================="
echo "Step 8: Testing Nginx Configuration"
echo "========================================="
if nginx -t; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 9: Obtain SSL certificates
echo ""
echo "========================================="
echo "Step 9: SSL Certificate Setup"
echo "========================================="
echo ""
print_warning "Before proceeding, ensure DNS records are configured:"
echo "  - ementech.co.ke → YOUR_VPS_IP"
echo "  - www.ementech.co.ke → YOUR_VPS_IP"
echo "  - app.ementech.co.ke → YOUR_VPS_IP"
echo "  - api.ementech.co.ke → YOUR_VPS_IP (optional)"
echo ""
read -p "Have you configured DNS records? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter email for Let's Encrypt notifications: " EMAIL

    # Obtain certificates
    print_info "Obtaining SSL certificate for ementech.co.ke..."
    certbot --nginx -d ementech.co.ke -d www.ementech.co.ke --email $EMAIL --agree-tos --no-eff-email --non-interactive

    print_info "Obtaining SSL certificate for app.ementech.co.ke..."
    certbot --nginx -d app.ementech.co.ke --email $EMAIL --agree-tos --no-eff-email --non-interactive

    read -p "Do you want to obtain certificate for api.ementech.co.ke? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Obtaining SSL certificate for api.ementech.co.ke..."
        certbot --nginx -d api.ementech.co.ke --email $EMAIL --agree-tos --no-eff-email --non-interactive
    fi

    print_success "SSL certificates obtained"
else
    print_warning "Skipping SSL certificate setup"
fi

# Step 10: Configure firewall
echo ""
echo "========================================="
echo "Step 10: Configuring Firewall"
echo "========================================="
if command -v ufw &> /dev/null; then
    ufw allow OpenSSH
    ufw allow 80/tcp
    ufw allow 443/tcp

    # Check if UFW is already enabled
    if ufw status | grep -q "Status: active"; then
        print_warning "UFW is already enabled"
    else
        read -p "Do you want to enable UFW now? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "y" | ufw enable
            print_success "UFW enabled"
        fi
    fi

    print_success "Firewall configured"
else
    print_warning "UFW not found, skipping firewall configuration"
fi

# Step 11: Start and enable nginx
echo ""
echo "========================================="
echo "Step 11: Starting Nginx"
echo "========================================="
systemctl reload nginx
systemctl enable nginx
print_success "Nginx started and enabled"

# Step 12: Setup PM2 (if Node.js is installed)
echo ""
echo "========================================="
echo "Step 12: PM2 Setup"
echo "========================================="
if command -v node &> /dev/null; then
    if ! command -v pm2 &> /dev/null; then
        print_info "Installing PM2 globally..."
        npm install -g pm2
        print_success "PM2 installed"
    else
        print_warning "PM2 is already installed"
    fi

    print_info "To start your applications, run:"
    echo "  pm2 start /var/www/ecosystem.config.js"
    echo "  pm2 save"
    echo "  pm2 startup"
else
    print_warning "Node.js not found, skipping PM2 setup"
fi

# Final summary
echo ""
echo "========================================="
echo "Setup Complete!"
echo "========================================="
echo ""
print_success "Nginx configuration completed successfully!"
echo ""
echo "Next Steps:"
echo "1. Deploy your applications to:"
echo "   - /var/www/ementech-website/current/dist/"
echo "   - /var/www/dumuwaks-frontend/current/dist/"
echo "   - /var/www/dumuwaks-backend/current/"
echo ""
echo "2. Start PM2 applications:"
echo "   pm2 start /var/www/ecosystem.config.js"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "3. Test your websites:"
echo "   - https://ementech.co.ke"
echo "   - https://www.ementech.co.ke"
echo "   - https://app.ementech.co.ke"
echo "   - https://api.ementech.co.ke (if configured)"
echo ""
echo "4. Check status:"
echo "   - Nginx: sudo systemctl status nginx"
echo "   - PM2: pm2 status"
echo "   - Logs: sudo tail -f /var/log/nginx/error.log"
echo ""
echo "For detailed documentation, see: NGINX_REVERSE_PROXY_GUIDE.md"
echo ""
print_info "Configuration files backed up to /etc/nginx/nginx.conf.backup.*"
echo ""
