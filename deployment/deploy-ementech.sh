#!/bin/bash

################################################################################
# Deployment Script: Ementech Corporate Website
# Purpose: Build and deploy the ementech-website React application to VPS
# Usage: ./deploy-ementech.sh [--dry-run] [--skip-build]
################################################################################

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

################################################################################
# CONFIGURATION
################################################################################

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# VPS Configuration
VPS_HOST="${VPS_HOST:-ementech.co.ke}"
VPS_USER="${VPS_USER:-root}"
V_SSH_PORT="${VPS_SSH_PORT:-22}"

# Project Configuration
PROJECT_NAME="ementech-website"
REMOTE_DEPLOY_DIR="/var/www/ementech-website"
REMOTE_CURRENT_DIR="$REMOTE_DEPLOY_DIR/current"
REMOTE_RELEASES_DIR="$REMOTE_DEPLOY_DIR/releases"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REMOTE_RELEASE_DIR="$REMOTE_RELEASES_DIR/$TIMESTAMP"

# Local Configuration
LOCAL_BUILD_DIR="$PROJECT_ROOT/dist"

# Flags
DRY_RUN=false
SKIP_BUILD=false

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

Deploy Ementech corporate website to VPS.

OPTIONS:
    --dry-run        Run through deployment without actually deploying
    --skip-build     Skip build step (use existing dist/)
    -h, --help       Show this help message

ENVIRONMENT VARIABLES:
    VPS_HOST         VPS hostname or IP (default: ementech.co.ke)
    VPS_USER         SSH user (default: root)
    VPS_SSH_PORT     SSH port (default: 22)

EXAMPLES:
    # Normal deployment
    $0

    # Dry run
    $0 --dry-run

    # Skip build (use existing dist/)
    $0 --skip-build

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
        --skip-build)
            SKIP_BUILD=true
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

    # Check if we're in the project root
    if [[ ! -f "$PROJECT_ROOT/package.json" ]]; then
        log_error "package.json not found. Are you in the project root?"
        exit 1
    fi

    # Check for Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi

    # Check for npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
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

    log_success "Pre-flight checks passed"
}

################################################################################
# BUILD APPLICATION
################################################################################

build_application() {
    if [[ "$SKIP_BUILD" = true ]]; then
        log_warning "Skipping build as requested..."
        return
    fi

    log_info "Building application for production..."

    cd "$PROJECT_ROOT"

    # Install dependencies
    log_info "Installing dependencies..."
    npm ci

    # Build application
    log_info "Creating production build..."
    npm run build

    # Verify build output
    if [[ ! -d "$LOCAL_BUILD_DIR" ]]; then
        log_error "Build failed: dist/ directory not found"
        exit 1
    fi

    log_success "Application built successfully"
}

################################################################################
# DEPLOY TO VPS
################################################################################

deploy_to_vps() {
    log_info "Deploying to VPS..."

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Skipping actual deployment"
        log_info "Would deploy to: $VPS_USER@$VPS_HOST:$REMOTE_RELEASE_DIR"
        return
    fi

    # Create remote directories
    log_info "Creating remote directories..."
    ssh -p "$V_SSH_PORT" "$VPS_USER@$VPS_HOST" <<EOF
        set -e
        mkdir -p "$REMOTE_RELEASE_DIR"
        mkdir -p "$REMOTE_RELEASES_DIR"
EOF

    # Sync files to VPS
    log_info "Syncing files to VPS (this may take a while)..."
    rsync -avz --delete \
        -e "ssh -p $V_SSH_PORT" \
        "$LOCAL_BUILD_DIR/" \
        "$VPS_USER@$VPS_HOST:$REMOTE_RELEASE_DIR/" \
        --progress \
        --exclude '*.map' \
        --exclude '.DS_Store'

    log_success "Files synced to VPS"
}

################################################################################
# UPDATE SYMLINKS AND RELOAD
################################################################################

update_symlinks_and_reload() {
    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Skipping symlink update"
        log_info "Would update symlink: $REMOTE_CURRENT_DIR -> $REMOTE_RELEASE_DIR"
        return
    fi

    log_info "Updating symlinks and reloading nginx..."

    ssh -p "$V_SSH_PORT" "$VPS_USER@$VPS_HOST" <<EOF
        set -e

        # Update current symlink
        ln -sfn "$REMOTE_RELEASE_DIR" "$REMOTE_CURRENT_DIR"

        # Set proper permissions
        chown -R www-data:www-data "$REMOTE_CURRENT_DIR"
        chmod -R 755 "$REMOTE_CURRENT_DIR"

        # Test nginx configuration
        nginx -t

        # Reload nginx
        systemctl reload nginx

        echo "Deployment successful!"
EOF

    log_success "Application deployed and nginx reloaded"
}

################################################################################
# CLEANUP OLD RELEASES
################################################################################

cleanup_old_releases() {
    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Skipping cleanup"
        return
    fi

    log_info "Cleaning up old releases (keeping last 5)..."

    ssh -p "$V_SSH_PORT" "$VPS_USER@$VPS_HOST" <<EOF
        set -e
        cd "$REMOTE_RELEASES_DIR"
        ls -t | tail -n +6 | xargs -r rm -rf
EOF

    log_success "Cleanup complete"
}

################################################################################
# HEALTH CHECK
################################################################################

health_check() {
    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Skipping health check"
        return
    fi

    log_info "Running health check..."

    # Wait a moment for nginx to reload
    sleep 2

    # Check HTTP status
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$VPS_HOST/health" || echo "000")

    if [[ "$HTTP_STATUS" = "200" ]]; then
        log_success "Health check passed (HTTP $HTTP_STATUS)"
    else
        log_warning "Health check returned HTTP $HTTP_STATUS"
    fi
}

################################################################################
# MAIN DEPLOYMENT FLOW
################################################################################

main() {
    log_info "=========================================="
    log_info "Ementech Website Deployment"
    log_info "=========================================="
    log_info "VPS: $VPS_USER@$VPS_HOST"
    log_info "Project: $PROJECT_NAME"
    log_info "Release: $TIMESTAMP"
    log_info "=========================================="

    preflight_checks
    build_application
    deploy_to_vps
    update_symlinks_and_reload
    cleanup_old_releases
    health_check

    log_info "=========================================="
    log_success "Deployment completed successfully!"
    log_info "=========================================="

    if [[ "$DRY_RUN" = true ]]; then
        log_info "This was a DRY RUN. No actual changes were made."
    fi
}

# Run main function
main
