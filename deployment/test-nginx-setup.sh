#!/bin/bash

################################################################################
# Nginx API Proxy Test Script
# Purpose: Comprehensive testing of nginx and backend configuration
# Usage: sudo ./test-nginx-setup.sh
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
    echo -e "${GREEN}[PASS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

################################################################################
# TEST COUNTERS
################################################################################

PASSED=0
FAILED=0
WARNED=0

################################################################################
# TEST FUNCTIONS
################################################################################

test_backend_running() {
    log_test "Checking if backend is running on port 5001..."

    if nc -z localhost 5001 2>/dev/null; then
        log_success "Backend is listening on port 5001"
        ((PASSED++))
        return 0
    else
        log_error "Backend is not listening on port 5001"
        ((FAILED++))
        return 1
    fi
}

test_backend_health() {
    log_test "Testing backend health endpoint directly..."

    RESPONSE=$(curl -s http://localhost:5001/api/health 2>&1)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/health)

    if [[ "$HTTP_CODE" = "200" ]]; then
        log_success "Backend health endpoint returned HTTP $HTTP_CODE"
        log_info "Response: $RESPONSE"
        ((PASSED++))
        return 0
    else
        log_error "Backend health endpoint returned HTTP $HTTP_CODE"
        ((FAILED++))
        return 1
    fi
}

test_nginx_running() {
    log_test "Checking if nginx is running..."

    if systemctl is-active --quiet nginx; then
        log_success "Nginx is running"
        ((PASSED++))
        return 0
    else
        log_error "Nginx is not running"
        ((FAILED++))
        return 1
    fi
}

test_nginx_config() {
    log_test "Testing nginx configuration syntax..."

    if nginx -t 2>&1 | grep -q "syntax is ok"; then
        log_success "Nginx configuration syntax is valid"
        ((PASSED++))
        return 0
    else
        log_error "Nginx configuration has syntax errors"
        ((FAILED++))
        return 1
    fi
}

test_nginx_site_enabled() {
    log_test "Checking if ementech-website site is enabled..."

    if [[ -L "/etc/nginx/sites-enabled/ementech-website.conf" ]]; then
        log_success "Ementech website is enabled in nginx"
        ((PASSED++))
        return 0
    else
        log_error "Ementech website is not enabled in nginx"
        ((FAILED++))
        return 1
    fi
}

test_ssl_certificates() {
    log_test "Checking SSL certificates..."

    if [[ -f "/etc/letsencrypt/live/ementech.co.ke/fullchain.pem" ]]; then

        # Check certificate expiration
        EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/ementech.co.ke/fullchain.pem | cut -d= -f2)
        EXPIRY_DATE=$(date -d "$EXPIRY" +%s)
        CURRENT_DATE=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRY_DATE - $CURRENT_DATE) / 86400 ))

        if [[ $DAYS_LEFT -gt 0 ]]; then
            log_success "SSL certificate is valid (expires in $DAYS_LEFT days)"
            ((PASSED++))
            return 0
        else
            log_error "SSL certificate has expired!"
            ((FAILED++))
            return 1
        fi
    else
        log_warning "SSL certificate not found at /etc/letsencrypt/live/ementech.co.ke/"
        log_warning "You need to obtain SSL certificates with certbot"
        ((WARNED++))
        return 1
    fi
}

test_dhparam() {
    log_test "Checking dhparam.pem file..."

    if [[ -f "/etc/nginx/ssl/dhparam.pem" ]]; then
        log_success "dhparam.pem exists"
        ((PASSED++))
        return 0
    else
        log_warning "dhparam.pem not found at /etc/nginx/ssl/dhparam.pem"
        log_warning "Run the setup script to generate it"
        ((WARNED++))
        return 1
    fi
}

test_nginx_health_endpoint() {
    log_test "Testing nginx health endpoint..."

    RESPONSE=$(curl -s http://localhost/health 2>&1)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/health)

    if [[ "$HTTP_CODE" = "200" ]]; then
        log_success "Nginx health endpoint returned HTTP $HTTP_CODE"
        ((PASSED++))
        return 0
    else
        log_warning "Nginx health endpoint returned HTTP $HTTP_CODE"
        ((WARNED++))
        return 1
    fi
}

test_nginx_api_proxy() {
    log_test "Testing nginx API proxy to backend..."

    RESPONSE=$(curl -s http://localhost/api/health 2>&1)
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health)

    if [[ "$HTTP_CODE" = "200" ]]; then
        log_success "Nginx API proxy returned HTTP $HTTP_CODE"
        log_info "Response: $RESPONSE"

        # Check if response is JSON
        if echo "$RESPONSE" | jq empty 2>/dev/null; then
            log_success "API response is valid JSON"
            ((PASSED++))
            return 0
        else
            log_warning "API response is not valid JSON"
            log_warning "Response: $RESPONSE"
            ((WARNED++))
            return 0
        fi
    else
        log_error "Nginx API proxy returned HTTP $HTTP_CODE"
        ((FAILED++))
        return 1
    fi
}

test_cors_headers() {
    log_test "Testing CORS headers on API endpoint..."

    HEADERS=$(curl -s -I http://localhost/api/health)

    if echo "$HEADERS" | grep -qi "access-control-allow-origin"; then
        log_success "CORS headers are present"
        log_info "CORS Origin: $(echo "$HEADERS" | grep -i "access-control-allow-origin" | head -1)"
        ((PASSED++))
        return 0
    else
        log_warning "CORS headers not found (may be handled by backend)"
        ((WARNED++))
        return 1
    fi
}

test_security_headers() {
    log_test "Testing security headers..."

    HEADERS=$(curl -s -I http://localhost/)

    MISSING_HEADERS=()

    echo "$HEADERS" | grep -qi "x-frame-options" || MISSING_HEADERS+=("X-Frame-Options")
    echo "$HEADERS" | grep -qi "x-content-type-options" || MISSING_HEADERS+=("X-Content-Type-Options")
    echo "$HEADERS" | grep -qi "strict-transport-security" || MISSING_HEADERS+=("HSTS")

    if [[ ${#MISSING_HEADERS[@]} -eq 0 ]]; then
        log_success "All security headers are present"
        ((PASSED++))
        return 0
    else
        log_warning "Missing security headers: ${MISSING_HEADERS[*]}"
        ((WARNED++))
        return 1
    fi
}

test_pm2_backend() {
    log_test "Checking PM2 backend process..."

    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "ementech-backend.*online"; then
            log_success "PM2 process 'ementech-backend' is online"
            ((PASSED++))
            return 0
        else
            log_error "PM2 process 'ementech-backend' is not running"
            ((FAILED++))
            return 1
        fi
    else
        log_warning "PM2 is not installed"
        ((WARNED++))
        return 1
    fi
}

test_rate_limiting() {
    log_test "Checking rate limiting configuration..."

    if grep -q "limit_req_zone" /etc/nginx/sites-available/ementech-website.conf 2>/dev/null; then
        log_success "Rate limiting is configured"
        ((PASSED++))
        return 0
    else
        log_warning "Rate limiting not found in configuration"
        ((WARNED++))
        return 1
    fi
}

test_http_to_https_redirect() {
    log_test "Testing HTTP to HTTPS redirect (requires external test)..."

    log_info "This test requires external access. Skipping automated check."
    log_info "To test manually: curl -I http://ementech.co.ke"
    ((WARNED++))
    return 0
}

################################################################################
# MAIN TEST FUNCTION
################################################################################

main() {
    echo ""
    echo "=========================================="
    echo "Nginx API Proxy Configuration Tests"
    echo "=========================================="
    echo ""

    # Check if running as root for some tests
    if [[ $EUID -ne 0 ]]; then
        log_warning "Some tests may require root privileges"
        log_warning "Run with sudo for complete testing"
        echo ""
    fi

    # Run all tests
    test_backend_running
    test_backend_health
    test_pm2_backend
    test_nginx_running
    test_nginx_config
    test_nginx_site_enabled
    test_ssl_certificates
    test_dhparam
    test_nginx_health_endpoint
    test_nginx_api_proxy
    test_cors_headers
    test_security_headers
    test_rate_limiting
    test_http_to_https_redirect

    # Print summary
    echo ""
    echo "=========================================="
    echo "Test Summary"
    echo "=========================================="
    echo -e "${GREEN}Passed:${NC} $PASSED"
    echo -e "${YELLOW}Warnings:${NC} $WARNED"
    echo -e "${RED}Failed:${NC} $FAILED"
    echo "=========================================="
    echo ""

    # Exit with appropriate code
    if [[ $FAILED -gt 0 ]]; then
        log_error "Some critical tests failed. Please review the errors above."
        exit 1
    elif [[ $WARNED -gt 0 ]]; then
        log_warning "Some tests passed with warnings. Review the warnings above."
        exit 0
    else
        log_success "All tests passed! Your nginx API proxy is working correctly."
        exit 0
    fi
}

# Run main function
main
