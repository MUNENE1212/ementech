#!/bin/bash

################################################################################
# Deployment Script: Dumu Waks Full Stack Application
# Purpose: Build and deploy frontend and backend to VPS
# Usage: ./deploy-dumuwaks.sh [--dry-run] [--skip-build] [--frontend-only] [--backend-only]
################################################################################

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

################################################################################
# CONFIGURATION
################################################################################

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Project paths
BACKEND_ROOT="/media/munen/muneneENT/PLP/MERN/Proj/backend"
FRONTEND_ROOT="/media/munen/muneneENT/PLP/MERN/Proj/frontend"

# VPS Configuration
VPS_HOST="${VPS_HOST:-ementech.co.ke}"
VPS_USER="${VPS_USER:-root}"
VPS_SSH_PORT="${VPS_SSH_PORT:-22}"

# Remote paths
BACKEND_REMOTE_DIR="/var/www/dumuwaks-backend"
FRONTEND_REMOTE_DIR="/var/www/dumuwaks-frontend"

# Flags
DRY_RUN=false
SKIP_BUILD=false
FRONTEND_ONLY=false
BACKEND_ONLY=false

################################################################################
# COLORS FOR OUTPUT
################################################################################

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

################################################################################
# USAGE
################################################################################

usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Deploy Dumu Waks frontend and backend to VPS.

OPTIONS:
    --dry-run         Run through deployment without actually deploying
    --skip-build      Skip build steps (use existing dist/)
    --frontend-only   Deploy only frontend
    --backend-only    Deploy only backend
    -h, --help        Show this help message

ENVIRONMENT VARIABLES:
    VPS_HOST          VPS hostname or IP (default: ementech.co.ke)
    VPS_USER          SSH user (default: root)
    VPS_SSH_PORT      SSH port (default: 22)

EXAMPLES:
    # Deploy both frontend and backend
    $0

    # Deploy only backend
    $0 --backend-only

    # Dry run
    $0 --dry-run
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
        --frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        --backend-only)
            BACKEND_ONLY=true
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

# Validate mutually exclusive options
if [[ "$FRONTEND_ONLY" = true && "$BACKEND_ONLY" = true ]]; then
    log_error "Cannot specify both --frontend-only and --backend-only"
    exit 1
fi

################################################################################
# PRE-FLIGHT CHECKS
################################################################################

preflight_checks() {
    log_info "Running pre-flight checks..."

    # Check for required commands
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi

    if ! command -v rsync &> /dev/null; then
        log_error "rsync is not installed"
        exit 1
    fi

    # Check SSH connectivity
    if [[ "$DRY_RUN" = false ]]; then
        log_info "Testing SSH connection to $VPS_USER@$VPS_HOST..."
        if ! ssh -p "$VPS_SSH_PORT" -o ConnectTimeout=10 "$VPS_USER@$VPS_HOST" "echo 'SSH connection successful'" &> /dev/null; then
            log_error "Cannot connect to VPS via SSH"
            exit 1
        fi
    fi

    # Check project directories
    if [[ "$BACKEND_ONLY" = false && ! -d "$FRONTEND_ROOT" ]]; then
        log_error "Frontend directory not found: $FRONTEND_ROOT"
        exit 1
    fi

    if [[ "$FRONTEND_ONLY" = false && ! -d "$BACKEND_ROOT" ]]; then
        log_error "Backend directory not found: $BACKEND_ROOT"
        exit 1
    fi

    log_success "Pre-flight checks passed"
}

################################################################################
# BUILD FRONTEND
################################################################################

build_frontend() {
    if [[ "$SKIP_BUILD" = true ]]; then
        log_warning "Skipping frontend build..."
        return
    fi

    log_info "Building frontend application..."

    cd "$FRONTEND_ROOT"

    # Install dependencies
    log_info "Installing frontend dependencies..."
    npm ci

    # Build application
    log_info "Creating production build..."
    npm run build

    # Verify build
    if [[ ! -d "$FRONTEND_ROOT/dist" ]]; then
        log_error "Frontend build failed"
        exit 1
    fi

    log_success "Frontend built successfully"
}

################################################################################
# DEPLOY FRONTEND
################################################################################

deploy_frontend() {
    log_info "Deploying frontend to VPS..."

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Skipping frontend deployment"
        return
    fi

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    RELEASE_DIR="$FRONTEND_REMOTE_DIR/releases/$TIMESTAMP"

    # Create remote directories
    ssh -p "$VPS_SSH_PORT" "$VPS_USER@$VPS_HOST" <<EOF
        set -e
        mkdir -p "$RELEASE_DIR"
        mkdir -p "$FRONTEND_REMOTE_DIR/releases"
EOF

    # Sync frontend files
    log_info "Syncing frontend files..."
    rsync -avz --delete \
        -e "ssh -p $VPS_SSH_PORT" \
        "$FRONTEND_ROOT/dist/" \
        "$VPS_USER@$VPS_HOST:$RELEASE_DIR/" \
        --progress

    # Update symlink
    ssh -p "$VPS_SSH_PORT" "$VPS_USER@$VPS_HOST" <<EOF
        set -e
        ln -sfn "$RELEASE_DIR" "$FRONTEND_REMOTE_DIR/current"
        chown -R www-data:www-data "$FRONTEND_REMOTE_DIR/current"
        chmod -R 755 "$FRONTEND_REMOTE_DIR/current"
EOF

    log_success "Frontend deployed successfully"
}

################################################################################
# DEPLOY BACKEND
################################################################################

deploy_backend() {
    log_info "Deploying backend to VPS..."

    if [[ "$DRY_RUN" = true ]]; then
        log_warning "DRY RUN: Skipping backend deployment"
        return
    fi

    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    RELEASE_DIR="$BACKEND_REMOTE_DIR/releases/$TIMESTAMP"

    # Create remote directories
    ssh -p "$VPS_SSH_PORT" "$VPS_USER@$VPS_HOST" <<EOF
        set -e
        mkdir -p "$RELEASE_DIR"
        mkdir -p "$BACKEND_REMOTE_DIR/releases"
EOF

    # Sync backend files (exclude node_modules and other unnecessary files)
    log_info "Syncing backend files..."
    rsync -avz \
        -e "ssh -p $VPS_SSH_PORT" \
        "$BACKEND_ROOT/" \
        "$VPS_USER@$VPS_HOST:$RELEASE_DIR/" \
        --progress \
        --exclude 'node_modules' \
        --exclude 'dist' \
        --exclude '.git' \
        --exclude 'uploads' \
        --exclude '*.log' \
        --exclude '.env' \
        --exclude 'coverage' \
        --exclude '.nyc_output'

    # Install dependencies and restart
    ssh -p "$VPS_SSH_PORT" "$VPS_USER@$VPS_HOST" <<EOF
        set -e

        # Install production dependencies
        cd "$RELEASE_DIR"
        npm ci --production

        # Copy environment file if exists
        if [[ -f "$BACKEND_REMOTE_DIR/current/.env" ]]; then
            cp "$BACKEND_REMOTE_DIR/current/.env" "$RELEASE_DIR/.env"
        fi

        # Update symlink
        ln -sfn "$RELEASE_DIR" "$BACKEND_REMOTE_DIR/current"

        # Restart PM2
        pm2 reload ecosystem.config.js --env production

        # Save PM2 configuration
        pm2 save
EOF

    log_success "Backend deployed successfully"
}

################################################################################
# CLEANUP OLD RELEASES
################################################################################

cleanup_releases() {
    if [[ "$DRY_RUN" = true ]]; then
        return
    fi

    log_info "Cleaning up old releases (keeping last 5)..."

    if [[ "$BACKEND_ONLY" = false ]]; then
        ssh -p "$VPS_SSH_PORT" "$VPS_USER@$VPS_HOST" <<EOF
            set -e
            cd "$FRONTEND_REMOTE_DIR/releases"
            ls -t | tail -n +6 | xargs -r rm -rf
EOF
    fi

    if [[ "$FRONTEND_ONLY" = false ]]; then
        ssh -p "$VPS_SSH_PORT" "$VPS_USER@$VPS_HOST" <<EOF
            set -e
            cd "$BACKEND_REMOTE_DIR/releases"
            ls -t | tail -n +6 | xargs -r rm -rf
EOF
    fi

    log_success "Cleanup complete"
}

################################################################################
# HEALTH CHECKS
################################################################################

health_checks() {
    if [[ "$DRY_RUN" = true ]]; then
        return
    fi

    log_info "Running health checks..."

    sleep 3

    # Check backend API
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://api.ementech.co.ke/health" || echo "000")
    if [[ "$BACKEND_STATUS" = "200" ]]; then
        log_success "Backend health check passed (HTTP $BACKEND_STATUS)"
    else
        log_warning "Backend health check returned HTTP $BACKEND_STATUS"
    fi

    # Check frontend (if deployed)
    if [[ "$BACKEND_ONLY" = false ]]; then
        FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://app.ementech.co.ke/health" || echo "000")
        if [[ "$FRONTEND_STATUS" = "200" ]]; then
            log_success "Frontend health check passed (HTTP $FRONTEND_STATUS)"
        else
            log_warning "Frontend health check returned HTTP $FRONTEND_STATUS"
        fi
    fi
}

################################################################################
# MAIN DEPLOYMENT FLOW
################################################################################

main() {
    log_info "=========================================="
    log_info "Dumu Waks Deployment"
    log_info "=========================================="
    log_info "VPS: $VPS_USER@$VPS_HOST"

    if [[ "$FRONTEND_ONLY" = true ]]; then
        log_info "Mode: Frontend only"
    elif [[ "$BACKEND_ONLY" = true ]]; then
        log_info "Mode: Backend only"
    else
        log_info "Mode: Full stack"
    fi

    log_info "=========================================="

    preflight_checks

    if [[ "$BACKEND_ONLY" = false ]]; then
        build_frontend
        deploy_frontend
    fi

    if [[ "$FRONTEND_ONLY" = false ]]; then
        deploy_backend
    fi

    cleanup_releases
    health_checks

    log_info "=========================================="
    log_success "Deployment completed successfully!"
    log_info "=========================================="

    if [[ "$DRY_RUN" = true ]]; then
        log_info "This was a DRY RUN. No actual changes were made."
    fi
}

# Run main function
main
