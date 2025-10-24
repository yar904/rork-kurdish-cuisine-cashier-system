#!/bin/bash

# 🧪 Backend Deployment Test Script
# Tests your backend API endpoints before deploying to Vercel

echo "🧪 Testing Kurdish Cuisine Backend API..."
echo ""

# Configuration
BASE_URL="${1:-http://localhost:3000}"
echo "📍 Testing against: $BASE_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Health Check
echo "Test 1: Health Check Endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Status: $HTTP_CODE"
  echo "  Response: $BODY"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} - Status: $HTTP_CODE"
  echo "  Response: $BODY"
  ((TESTS_FAILED++))
fi
echo ""

# Test 2: Root Endpoint
echo "Test 2: Root Endpoint"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ PASS${NC} - Status: $HTTP_CODE"
  echo "  Response: $BODY"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} - Status: $HTTP_CODE"
  echo "  Response: $BODY"
  ((TESTS_FAILED++))
fi
echo ""

# Test 3: CORS Headers
echo "Test 3: CORS Configuration"
CORS_HEADERS=$(curl -s -I -X OPTIONS "$BASE_URL/api/health" | grep -i "access-control")

if [ ! -z "$CORS_HEADERS" ]; then
  echo -e "${GREEN}✓ PASS${NC} - CORS headers present"
  echo "$CORS_HEADERS" | sed 's/^/  /'
  ((TESTS_PASSED++))
else
  echo -e "${YELLOW}⚠ WARNING${NC} - No CORS headers found (might be OK for some setups)"
  ((TESTS_FAILED++))
fi
echo ""

# Test 4: tRPC Route (basic connectivity)
echo "Test 4: tRPC Endpoint Accessibility"
RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/trpc/example.hi")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

# tRPC returns 400 for GET requests (expected), 200 for valid POST
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ PASS${NC} - tRPC endpoint is accessible (Status: $HTTP_CODE)"
  ((TESTS_PASSED++))
else
  echo -e "${RED}✗ FAIL${NC} - Status: $HTTP_CODE (expected 200 or 400)"
  ((TESTS_FAILED++))
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Test Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✓ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}✗ Failed: $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed! Your backend is ready to deploy.${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Please fix the issues before deploying.${NC}"
  exit 1
fi
