#!/bin/bash

################################################################################
# Nginx Configuration Setup Script
# Purpose: Configure nginx reverse proxy for Ementech API
# Usage: sudo ./setup-nginx-api-proxy.sh
################################################################################

set -euo pipefail

################################################################################
# COLORS FOR OUTPUT
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

################################################################################
# CONFIGURATION
################################################################################

NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"
NGINX_SSL_DIR="/etc/nginx/ssl"
CONFIG_FILE="ementech-website.conf"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_CONFIG="$PROJECT_ROOT/deployment/$CONFIG_FILE"

################################################################################
# CHECK ROOT PRIVILEGES
################################################################################

if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo)"
   exit 1
fi

################################################################################
# BACKUP FUNCTION
################################################################################

backup_config() {
    local config_file=$1
    if [[ -f "$config_file" ]]; then
        local backup_file="${config_file}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$config_file" "$backup_file"
        log_info "Backed up $config_file to $backup_file"
    fi
}

################################################################################
# CREATE SSL DIRECTORY AND DHPARAM
################################################################################

setup_ssl_dhparam() {
    log_info "Setting up SSL directory and dhparam..."

    # Create SSL directory if it doesn't exist
    if [[ ! -d "$NGINX_SSL_DIR" ]]; then
        mkdir -p "$NGINX_SSL_DIR"
        log_success "Created SSL directory: $NGINX_SSL_DIR"
    fi

    # Generate dhparam.pem if it doesn't exist
    if [[ ! -f "$NGINX_SSL_DIR/dhparam.pem" ]]; then
        log_info "Generating dhparam.pem (this may take a few minutes)..."

        # Use smaller size for faster generation (2048 bits)
        # For production, consider using 4096 bits for better security
        openssl dhparam -out "$NGINX_SSL_DIR/dhparam.pem" 2048

        log_success "dhparam.pem generated successfully"
    else
        log_info "dhparam.pem already exists, skipping generation"
    fi

    # Set proper permissions
    chmod 600 "$NGINX_SSL_DIR/dhparam.pem"
    chown root:root "$NGINX_SSL_DIR/dhparam.pem"
}

################################################################################
# DEPLOY NGINX CONFIGURATION
################################################################################

deploy_nginx_config() {
    log_info "Deploying nginx configuration..."

    # Check if source config exists
    if [[ ! -f "$SOURCE_CONFIG" ]]; then
        log_error "Configuration file not found: $SOURCE_CONFIG"
        exit 1
    fi

    # Backup existing config
    backup_config "$NGINX_SITES_AVAILABLE/$CONFIG_FILE"

    # Copy new configuration
    cp "$SOURCE_CONFIG" "$NGINX_SITES_AVAILABLE/$CONFIG_FILE"
    log_success "Configuration file deployed to $NGINX_SITES_AVAILABLE/$CONFIG_FILE"

    # Remove existing symlink if it exists
    if [[ -L "$NGINX_SITES_ENABLED/$CONFIG_FILE" ]]; then
        rm "$NGINX_SITES_ENABLED/$CONFIG_FILE"
        log_info "Removed old symlink"
    fi

    # Create new symlink
    ln -s "$NGINX_SITES_AVAILABLE/$CONFIG_FILE" "$NGINX_SITES_ENABLED/$CONFIG_FILE"
    log_success "Created symlink in $NGINX_SITES_ENABLED/"

    # Remove default site if it's enabled
    if [[ -L "$NGINX_SITES_ENABLED/default" ]]; then
        backup_config "$NGINX_SITES_ENABLED/default"
        rm "$NGINX_SITES_ENABLED/default"
        log_info "Disabled default site"
    fi
}

################################################################################
# TEST NGINX CONFIGURATION
################################################################################

test_nginx_config() {
    log_info "Testing nginx configuration..."

    if nginx -t; then
        log_success "Nginx configuration test passed"
        return 0
    else
        log_error "Nginx configuration test failed"
        return 1
    fi
}

################################################################################
# RESTART NGINX
################################################################################

restart_nginx() {
    log_info "Restarting nginx..."

    if systemctl restart nginx; then
        log_success "Nginx restarted successfully"
    else
        log_error "Failed to restart nginx"
        exit 1
    fi
}

################################################################################
# CHECK BACKEND STATUS
################################################################################

check_backend_status() {
    log_info "Checking backend status..."

    if curl -s http://localhost:5001/api/health > /dev/null; then
        log_success "Backend is responding on port 5001"
    else
        log_warning "Backend may not be running on port 5001"
        log_warning "Please ensure your backend is started with: pm2 start ementech-backend"
    fi
}

################################################################################
# VERIFY ENDPOINTS
################################################################################

verify_endpoints() {
    log_info "Verifying endpoints..."

    # Wait a moment for nginx to fully start
    sleep 2

    # Check if SSL certificates exist
    if [[ ! -f "/etc/letsencrypt/live/ementech.co.ke/fullchain.pem" ]]; then
        log_warning "SSL certificates not found at /etc/letsencrypt/live/ementech.co.ke/"
        log_warning "You need to obtain SSL certificates first with:"
        log_warning "  sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke"
        log_warning "For now, nginx will fail to start until SSL certificates are obtained."
        log_warning ""
        log_warning "To temporarily test without SSL, you can:"
        log_warning "  1. Comment out the SSL certificate lines in the config"
        log_warning "  2. Change listen 443 ssl to listen 8080"
        log_warning "  3. Test with http://ementech.co.ke:8080/api/health"
        return
    fi

    # Test health endpoint (HTTP first, then HTTPS)
    log_info "Testing HTTP health endpoint..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health || echo "000")

    if [[ "$HTTP_CODE" = "200" ]]; then
        log_success "HTTP health endpoint is working (HTTP $HTTP_CODE)"
    else
        log_warning "HTTP health endpoint returned HTTP $HTTP_CODE"
    fi

    # Test API endpoint
    log_info "Testing API endpoint via nginx..."
    API_RESPONSE=$(curl -s http://localhost/api/health || echo "{}")

    if [[ -n "$API_RESPONSE" ]]; then
        log_success "API endpoint is responding"
        log_info "Response: $API_RESPONSE"
    else
        log_warning "API endpoint did not return a response"
    fi
}

################################################################################
# MAIN FUNCTION
################################################################################

main() {
    log_info "=========================================="
    log_info "Nginx API Proxy Configuration Setup"
    log_info "=========================================="

    # Check if we can access the required directories
    if [[ ! -d "$NGINX_SITES_AVAILABLE" ]] || [[ ! -d "$NGINX_SITES_ENABLED" ]]; then
        log_error "Nginx directories not found. Is nginx installed?"
        exit 1
    fi

    # Run setup steps
    setup_ssl_dhparam
    deploy_nginx_config

    if test_nginx_config; then
        restart_nginx
        check_backend_status
        verify_endpoints

        log_info "=========================================="
        log_success "Nginx configuration completed successfully!"
        log_info "=========================================="
        log_info ""
        log_info "Next steps:"
        log_info "1. Ensure SSL certificates are obtained (if not already)"
        log_info "   sudo certbot --nginx -d ementech.co.ke -d www.ementech.co.ke"
        log_info ""
        log_info "2. Test the API endpoint:"
        log_info "   curl http://localhost/api/health"
        log_info "   curl https://ementech.co.ke/api/health"
        log_info ""
        log_info "3. Check nginx logs if there are issues:"
        log_info "   sudo tail -f /var/log/nginx/ementech-website-error.log"
        log_info ""
    else
        log_error "Nginx configuration test failed. Please check the errors above."
        log_info "You can restore the backup configuration if needed."
        exit 1
    fi
}

# Run main function
main
