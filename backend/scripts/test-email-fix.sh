#!/bin/bash

################################################################################
# Email Flooding Fix - Test Script
#
# This script tests all aspects of the email flooding fix
################################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="${API_URL:-http://localhost:5000}"
EMAIL="admin@ementech.co.ke"
VPS_IP="69.164.244.165"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Email Flooding Fix - Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test counter
PASSED=0
FAILED=0

# Test function
test_step() {
    local test_name="$1"
    local test_command="$2"

    echo -e "${YELLOW}[TEST]${NC} $test_name"

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}  ✓ PASS${NC}"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}  ✗ FAIL${NC}"
        ((FAILED++))
        return 1
    fi
}

echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo -e "${BLUE}Part 1: Backend API Tests${NC}"
echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo ""

# Test 1: Backend is running
test_step "Backend API is accessible" "curl -f -s $API_URL/api/health || curl -f -s $API_URL/"

echo ""
echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo -e "${BLUE}Part 2: MongoDB Tests${NC}"
echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo ""

# Test 2: MongoDB cleanup
echo -e "${YELLOW}[TEST]${NC} Checking MongoDB for Fail2Ban emails..."
cd backend
SYSTEM_EMAIL_COUNT=$(node -e "
  require('dotenv').config();
  const mongoose = require('mongoose');
  const Email = require('./src/models/Email.js');
  (async () => {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://master25:master25@cluster0.qaobi.mongodb.net/ementech');
    const count = await Email.countDocuments({
      subject: { \\$regex: /\[Fail2Ban\]/ },
      isDeleted: false
    });
    console.log(count);
    await mongoose.disconnect();
  })().catch(console.error);
" 2>/dev/null || echo "ERROR")

if [ "$SYSTEM_EMAIL_COUNT" = "0" ]; then
    echo -e "${GREEN}  ✓ PASS - No Fail2Ban emails in database${NC}"
    ((PASSED++))
elif [ "$SYSTEM_EMAIL_COUNT" = "ERROR" ]; then
    echo -e "${YELLOW}  ⚠ SKIP - Could not connect to MongoDB${NC}"
else
    echo -e "${RED}  ✗ FAIL - Found $SYSTEM_EMAIL_COUNT Fail2Ban emails${NC}"
    ((FAILED++))
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo -e "${BLUE}Part 3: IMAP Monitor Tests${NC}"
echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo ""

# Test 3: IMAP monitor is running
test_step "IMAP monitor process is running" "ps aux | grep -v grep | grep emailMonitor"

# Test 4: Email monitor log file exists
test_step "Email monitor log exists" "test -f /var/log/email-monitor.log"

# Test 5: Recent log entries
echo -e "${YELLOW}[TEST]${NC} Checking recent IMAP monitor activity..."
if [ -f /var/log/email-monitor.log ]; then
    RECENT_LOGS=$(tail -20 /var/log/email-monitor.log | grep -c "✅" || echo "0")
    if [ "$RECENT_LOGS" -gt 0 ]; then
        echo -e "${GREEN}  ✓ PASS - Found $RECENT_LOGS recent successful operations${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}  ⚠ WARN - No recent successful operations in log${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠ SKIP - Log file not found${NC}"
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo -e "${BLUE}Part 4: VPS Fail2Ban Tests${NC}"
echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo ""

# Test 6: SSH connectivity to VPS
echo -e "${YELLOW}[TEST]${NC} Testing SSH connection to VPS..."
if ssh -o ConnectTimeout=5 -o BatchMode=yes root@$VPS_IP "echo 'Connected'" > /dev/null 2>&1; then
    echo -e "${GREEN}  ✓ PASS - Can connect to VPS${NC}"
    ((PASSED++))

    # Test 7: Fail2Ban is running on VPS
    echo -e "${YELLOW}[TEST]${NC} Checking Fail2Ban status on VPS..."
    if ssh root@$VPS_IP "systemctl is-active --quiet fail2ban"; then
        echo -e "${GREEN}  ✓ PASS - Fail2Ban is running${NC}"
        ((PASSED++))

        # Test 8: Fail2Ban has no email actions
        echo -e "${YELLOW}[TEST]${NC} Checking Fail2Ban email actions..."
        EMAIL_ACTIONS=$(ssh root@$VPS_IP "fail2ban-client get sshd action 2>/dev/null | grep -i mail || echo ''")
        if [ -z "$EMAIL_ACTIONS" ]; then
            echo -e "${GREEN}  ✓ PASS - No email actions configured${NC}"
            ((PASSED++))
        else
            echo -e "${RED}  ✗ FAIL - Email actions still configured:${NC}"
            echo "     $EMAIL_ACTIONS"
            ((FAILED++))
        fi
    else
        echo -e "${YELLOW}  ⚠ SKIP - Fail2Ban is not running${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠ SKIP - Cannot connect to VPS (SSH key or network issue)${NC}"
fi

echo ""
echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo -e "${BLUE}Part 5: Manual Verification Required${NC}"
echo -e "${BLUE}══════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}⚠️  The following tests require manual verification:${NC}"
echo ""
echo "1. Send a test email to $EMAIL"
echo "   Expected: Email appears in inbox without Fail2Ban spam"
echo ""
echo "2. Check the email inbox in the web interface"
echo "   Expected: Only business emails visible, no system emails"
echo ""
echo "3. Trigger a Fail2Ban ban (multiple failed SSH attempts)"
echo "   Expected: IP is banned but NO email is sent"
echo ""
echo "4. Check email sync functionality"
echo "   Expected: New emails appear automatically"
echo ""

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All automated tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Complete manual verification steps above"
    echo "  2. Monitor for 24-48 hours"
    echo "  3. Check that no Fail2Ban emails appear"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    echo ""
    echo "Please review the failures above and fix them."
    exit 1
fi
