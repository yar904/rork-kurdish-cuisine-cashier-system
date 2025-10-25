#!/bin/bash

# ============================================
# Rork Native Deployment Verification Script
# Kurdish Cuisine Cashier System
# ============================================

echo "🔍 Verifying Rork Native Deployment..."
echo ""

BASE_URL="https://kurdish-cuisine-cashier-system.rork.app"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Health Endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Health check passed${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Health check failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi

echo ""

# Test 2: Supabase Connection
echo "2️⃣  Testing Supabase Connection..."
TEST_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/test")
HTTP_CODE=$(echo "$TEST_RESPONSE" | tail -n1)
BODY=$(echo "$TEST_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] && echo "$BODY" | grep -q "supabaseConnected"; then
    echo -e "${GREEN}✅ Supabase connection successful${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Supabase connection failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi

echo ""

# Test 3: Root Endpoint
echo "3️⃣  Testing Root Endpoint..."
ROOT_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
HTTP_CODE=$(echo "$ROOT_RESPONSE" | tail -n1)
BODY=$(echo "$ROOT_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Root endpoint accessible${NC}"
    echo "   Response: $BODY"
else
    echo -e "${RED}❌ Root endpoint failed (HTTP $HTTP_CODE)${NC}"
    echo "   Response: $BODY"
fi

echo ""
echo "============================================"
echo "🎉 Verification Complete!"
echo "============================================"
echo ""
echo "📋 Summary:"
echo "   Base URL: $BASE_URL"
echo "   Health: $BASE_URL/api/health"
echo "   Test: $BASE_URL/api/test"
echo "   tRPC: $BASE_URL/trpc"
echo ""
