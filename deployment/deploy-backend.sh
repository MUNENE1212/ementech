#!/bin/bash

################################################################################
# Deployment Script: Ementech Backend API
# Purpose: Deploy the marketing ecosystem backend to VPS
# Usage: ./deploy-backend.sh [--dry-run] [--skip-env-check]
################################################################################

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

################################################################################
# CONFIGURATION
################################################################################

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

# VPS Configuration
VPS_HOST="${VPS_HOST:-69.164.244.165}"
VPS_USER="${VPS_USER:-root}"
V_SSH_PORT="${VPS_SSH_PORT:-22}"

# Remote Configuration
REMOTE_BACKEND_DIR="/var/www/ementech-website/backend"
TEMP_DEPLOY_FILE="/tmp/ementech-backend.tar.gz"

# Flags
DRY_RUN=false
SKIP_ENV_CHECK=false

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
# USAGE
################################################################################

usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Deploy Ementech marketing ecosystem backend to VPS.

OPTIONS:
    --dry-run           Run through deployment without actually deploying
    --skip-env-check    Skip environment variable validation
    -h, --help          Show this help message

ENVIRONMENT VARIABLES:
    VPS_HOST            VPS hostname or IP (default: 69.164.244.165)
    VPS_USER            SSH user (default: root)
    VPS_SSH_PORT        SSH port (default: 22)

EXAMPLES:
    # Normal deployment
    $0

    # Dry run
    $0 --dry-run

    # Skip environment check
    $0 --skip-env-check

    # Custom VPS
    VPS_HOST=192.168.1.100 VPS_USER=deploy $0

EOF
    exit 0
}

################################################################################
# PARSE ARGUMENTS
################################################################################

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-env-check)
            SKIP_ENV_CHECK=true
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
# PRE-FLIGHT CHECKS
################################################################################

preflight_checks() {
    log_info "Running pre-flight checks..."

    # Check if backend directory exists
    if [[ ! -d "$BACKEND_DIR" ]]; then
        log_error "Backend directory not found: $BACKEND_DIR"
        exit 1
    fi

    # Check for required files
    if [[ ! -f "$BACKEND_DIR/package.json" ]]; then
        log_error "package.json not found in backend directory"
        exit 1
    fi

    if [[ ! -f "$BACKEND_DIR/src/server.js" ]]; then
        log_error "server.js not found in backend/src/"
        exit 1
    fi

    if [[ ! -f "$BACKEND_DIR/ecosystem.config.cjs" ]]; then
        log_error "ecosystem.config.cjs not found in backend directory"
        exit 1
    fi

    # Check for Node.js
    if ! command -v node &> /dev/null; then
        log_warning "Node.js is not installed locally (optional for deployment)"
    fi

    # Check for rsync
    if ! command -v rsync &> /dev/null; then
        log_error "rsync is not installed. Install with: sudo apt-get install rsync"
        exit 1
    fi

    # Check SSH connectivity (skip for dry-run)
    if [[ "$DRY_RUN" = false ]]; then
        log_info "Testing SSH connection to $VPS_USER@$VPS_HOST..."
        if ! ssh -p "$V_SSH_PORT" -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'" &> /dev/null; then
            log_error "Cannot connect to VPS via SSH. Check your credentials and network."
            exit 1
        fi
    fi

    # Check environment file
    if [[ "$SKIP_ENV_CHECK" = false ]]; then
        if [[ ! -f "$BACKEND_DIR/.env" ]]; then
            log_error ".env file not found in backend directory"
            log_error "Create .env file from .env.example: cp backend/.env.example backend/.env"
            log_error "Then fill in production values before deploying."
            exit 1
        fi
        log_info "Environment file found (.env)"
    fi

    log_success "Pre-flight checks passed"
}

################################################################################
# BUILD/ PREPARE BACKEND
################################################################################

prepare_backend() {
    log_info "Preparing backend for deployment..."

    cd "$BACKEND_DIR"

    # Check if node_modules exists, if not, run npm install
    if [[ ! -d "node_modules" ]]; then
        log_info "Installing dependencies..."
        npm ci
    else
        log_info "Dependencies already installed (node_modules exists)"
    fi

    log_success "Backend prepared successfully"
}

################################################################################
# CREATE DEPLOYMENT PACKAGE
################################################################################

create_deployment_package() {
    log_info "Creating deployment package..."

    cd "$BACKEND_DIR"

    # Create tarball excluding unnecessary files
    tar czf "$TEMP_DEPLOY_FILE" \
        --exclude=node_modules \
        --exclude=logs \
        --exclude=.git \
        --exclude=.env.example \
        --exclude=*.log \
        --exclude=tmp \
        --exclude=temp \
        . 2>/dev/null || {
        log_error "Failed to create deployment package"
        exit 1
    }

    # Verify package was created
    if [[ ! -f "$TEMP_DEPLOY_FILE" ]]; then
        log_error "Deployment package not created: $TEMP_DEPLOY_FILE"
        exit 1
    fi

    local size=$(du -h "$TEMP_DEPLOY_FILE" | cut -f1)
    log_success "Deployment package created: $TEMP_DEPLOY_FILE ($size)"
}

################################################################################
# DEPLOY TO VPS
################################################################################

deploy_to_vps() {
    log_info "Deploying to VPS..."

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Skipping actual deployment"
        log_info "Would deploy to: $VPS_USER@$VPS_HOST:$REMOTE_BACKEND_DIR"
        log_info "Package size: $(du -h "$TEMP_DEPLOY_FILE" | cut -f1)"
        return
    fi

    # Upload package to VPS
    log_info "Uploading deployment package to VPS..."
    rsync -avz --progress \
        -e "ssh -p $V_SSH_PORT" \
        "$TEMP_DEPLOY_FILE" \
        "$VPS_USER@$VPS_HOST:/tmp/ementech-backend-deploy.tar.gz"

    # Extract and setup on VPS
    log_info "Extracting and setting up backend on VPS..."
    ssh -p "$V_SSH_PORT" "$VPS_USER@$VPS_HOST" <<EOF
        set -e

        echo "Creating backend directory..."
        mkdir -p "$REMOTE_BACKEND_DIR"

        echo "Extracting deployment package..."
        cd "$REMOTE_BACKEND_DIR"
        tar xzf /tmp/ementech-backend-deploy.tar.gz

        echo "Installing production dependencies..."
        npm ci --production

        echo "Setting permissions..."
        chmod +x "$REMOTE_BACKEND_DIR"
        chmod +x "$REMOTE_BACKEND_DIR/src"

        echo "Cleaning up temporary package..."
        rm -f /tmp/ementech-backend-deploy.tar.gz

        echo "Backend deployed successfully!"
EOF

    log_success "Backend deployed to VPS"
}

################################################################################
# CONFIGURE PM2
################################################################################

configure_pm2() {
    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Skipping PM2 configuration"
        return
    fi

    log_info "Configuring PM2..."

    ssh -p "$V_SSH_PORT" "$VPS_USER@$VPS_HOST" <<EOF
        set -e

        echo "Starting backend with PM2..."
        cd "$REMOTE_BACKEND_DIR"
        pm2 start ecosystem.config.cjs

        echo "Saving PM2 configuration..."
        pm2 save

        echo "Displaying PM2 status..."
        pm2 list
EOF

    log_success "PM2 configured and backend started"
}

################################################################################
# VERIFY DEPLOYMENT
################################################################################

verify_deployment() {
    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Skipping verification"
        return
    fi

    log_info "Verifying deployment..."

    # Wait for backend to start
    sleep 5

    # Check PM2 status
    log_info "Checking PM2 process status..."
    local pm2_status=$(ssh -p "$V_SSH_PORT" "$VPS_USER@$VPS_HOST" "pm2 list | grep ementech-backend | awk '{print \$10}'" || echo "not running")

    if [[ "$pm2_status" = "online" ]]; then
        log_success "Backend process is ONLINE"
    else
        log_warning "Backend process status: $pm2_status"
        log_info "Check PM2 logs: ssh $VPS_USER@$VPS_HOST 'pm2 logs ementech-backend --lines 50'"
    fi

    # Test API health endpoint
    log_info "Testing API health endpoint..."
    local http_status=$(ssh -p "$V_SSH_PORT" "$VPS_USER@$VPS_HOST" "curl -s -o /dev/null -w '%{http_code}' http://localhost:5001/api/health" || echo "000")

    if [[ "$http_status" = "200" ]]; then
        log_success "Health check passed (HTTP $http_status)"
    else
        log_warning "Health check returned HTTP $http_status"
        log_info "Backend may need additional configuration or startup time"
    fi

    # Display recent logs
    log_info "Recent PM2 logs:"
    ssh -p "$V_SSH_PORT" "$VPS_USER@$VPS_HOST" "pm2 logs ementech-backend --lines 20 --nostream"
}

################################################################################
# CLEANUP
################################################################################

cleanup() {
    log_info "Cleaning up temporary files..."
    rm -f "$TEMP_DEPLOY_FILE"
    log_success "Cleanup complete"
}

################################################################################
# DISPLAY NEXT STEPS
################################################################################

display_next_steps() {
    cat <<EOF

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPLOYMENT COMPLETE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Backend deployed to: $VPS_USER@$VPS_HOST:$REMOTE_BACKEND_DIR

NEXT STEPS:

1. Verify backend is running:
   ssh $VPS_USER@$VPS_HOST 'pm2 list'

2. View logs:
   ssh $VPS_USER@$VPS_HOST 'pm2 logs ementech-backend'

3. Test API:
   curl https://ementech.co.ke/api/health

4. Monitor resources:
   ssh $VPS_USER@$VPS_HOST 'pm2 monit'

5. Check environment:
   ssh $VPS_USER@$VPS_HOST 'cat $REMOTE_BACKEND_DIR/.env'

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

If issues occur, check troubleshooting guide:
  docs/BACKEND_INVESTIGATION_REPORT.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
}

################################################################################
# MAIN DEPLOYMENT FLOW
################################################################################

main() {
    echo ""
    log_info "=========================================="
    log_info "EmenTech Backend Deployment"
    log_info "=========================================="
    log_info "VPS: $VPS_USER@$VPS_HOST"
    log_info "Backend: $BACKEND_DIR"
    log_info "Remote: $REMOTE_BACKEND_DIR"
    log_info "=========================================="
    echo ""

    preflight_checks
    prepare_backend
    create_deployment_package
    deploy_to_vps
    configure_pm2
    verify_deployment
    cleanup
    display_next_steps

    if [[ "$DRY_RUN" = true ]]; then
        log_info "This was a DRY RUN. No actual changes were made."
    fi
}

# Run main function
main
