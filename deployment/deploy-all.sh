#!/bin/bash

################################################################################
# Master Deployment Script: All Ementech Projects
# Purpose: Deploy both ementech-website and dumuwaks applications
# Usage: ./deploy-all.sh [--dry-run] [--skip-website] [--skip-dumuwaks]
################################################################################

# Exit on error, undefined variables, and pipe failures
set -euo pipefail

################################################################################
# CONFIGURATION
################################################################################

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Flags
DRY_RUN=""
SKIP_WEBSITE=false
SKIP_DUMUWAKS=false

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

log_section() {
    echo -e "\n${BOLD}${BLUE}==========================================${NC}"
    echo -e "${BOLD}${BLUE}$1${NC}"
    echo -e "${BOLD}${BLUE}==========================================${NC}\n"
}

################################################################################
# USAGE
################################################################################

usage() {
    cat <<EOF
Usage: $0 [OPTIONS]

Deploy all Ementech projects to VPS.

OPTIONS:
    --dry-run          Simulate deployment without making changes
    --skip-website     Skip ementech-website deployment
    --skip-dumuwaks    Skip dumuwaks deployment
    -h, --help         Show this help message

EXAMPLES:
    # Deploy everything
    $0

    # Deploy only ementech-website
    $0 --skip-dumuwaks

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
            DRY_RUN="--dry-run"
            shift
            ;;
        --skip-website)
            SKIP_WEBSITE=true
            shift
            ;;
        --skip-dumuwaks)
            SKIP_DUMUWAKS=true
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

# Validate options
if [[ "$SKIP_WEBSITE" = true && "$SKIP_DUMUWAKS" = true ]]; then
    log_error "Cannot skip both deployments. At least one project must be deployed."
    exit 1
fi

################################################################################
# DEPLOYMENT FUNCTIONS
################################################################################

deploy_ementech_website() {
    if [[ "$SKIP_WEBSITE" = true ]]; then
        log_warning "Skipping ementech-website deployment"
        return
    fi

    log_section "Deploying Ementech Corporate Website"

    if "$SCRIPT_DIR/deploy-ementech.sh" $DRY_RUN; then
        log_success "Ementech website deployed successfully"
        return 0
    else
        log_error "Ementech website deployment failed"
        return 1
    fi
}

deploy_dumuwaks() {
    if [[ "$SKIP_DUMUWAKS" = true ]]; then
        log_warning "Skipping dumuwaks deployment"
        return
    fi

    log_section "Deploying Dumu Waks Application"

    if "$SCRIPT_DIR/deploy-dumuwaks.sh" $DRY_RUN; then
        log_success "Dumu Waks deployed successfully"
        return 0
    else
        log_error "Dumu Waks deployment failed"
        return 1
    fi
}

################################################################################
# FINAL SUMMARY
################################################################################

print_summary() {
    local exit_code=$1

    log_section "Deployment Summary"

    if [[ $exit_code -eq 0 ]]; then
        echo -e "${GREEN}✓${NC} All deployments completed successfully!"
        echo ""
        echo "Deployed applications:"
        [[ "$SKIP_WEBSITE" = false ]] && echo "  - https://ementech.co.ke (Corporate Website)"
        [[ "$SKIP_DUMUWAKS" = false ]] && echo "  - https://app.ementech.co.ke (Dumu Waks Frontend)"
        [[ "$SKIP_DUMUWAKS" = false ]] && echo "  - https://api.ementech.co.ke (Dumu Waks Backend API)"
        echo ""
        echo "Next steps:"
        echo "  1. Test all deployed applications"
        echo "  2. Check PM2 status: ssh root@ementech.co.ke 'pm2 status'"
        echo "  3. Check nginx status: ssh root@ementech.co.ke 'systemctl status nginx'"
        echo "  4. Monitor logs: ssh root@ementech.co.ke 'pm2 logs'"
    else
        echo -e "${RED}✗${NC} Deployment encountered errors"
        echo ""
        echo "Please review the error messages above and:"
        echo "  1. Check the logs for detailed error information"
        echo "  2. Verify VPS connectivity"
        echo "  3. Ensure all dependencies are installed"
        echo "  4. Retry the deployment"
    fi

    echo ""
}

################################################################################
# MAIN DEPLOYMENT FLOW
################################################################################

main() {
    echo -e "${BOLD}${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${BLUE}║   Ementech Projects Master Deployment  ║${NC}"
    echo -e "${BOLD}${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "Started at: $(date)"
    echo ""

    # Track deployment status
    WEBSITE_STATUS=0
    DUMUWAKS_STATUS=0

    # Deploy ementech-website
    if ! deploy_ementech_website; then
        WEBSITE_STATUS=1
    fi

    # Deploy dumuwaks
    if ! deploy_dumuwaks; then
        DUMUWAKS_STATUS=1
    fi

    # Determine overall exit code
    if [[ $WEBSITE_STATUS -ne 0 || $DUMUWAKS_STATUS -ne 0 ]]; then
        EXIT_CODE=1
    else
        EXIT_CODE=0
    fi

    # Print summary
    print_summary $EXIT_CODE

    echo "Completed at: $(date)"

    exit $EXIT_CODE
}

# Run main function
main
