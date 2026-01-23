#!/bin/bash
# Test login with properly escaped password

curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@ementech.co.ke\",\"password\":\"Admin2026!\"}" | jq .
