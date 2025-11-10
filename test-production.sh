#!/bin/bash

# Production Deployment Test Script
# Kurdish Cuisine Cashier System
# Run this after deploying to verify everything works

echo "🧪 Testing Production Deployment..."
echo "URL: https://rork-kurdish-cuisine-cashier-system.vercel.app"
echo "================================================"
echo ""

BASE_URL="https://rork-kurdish-cuisine-cashier-system.vercel.app"

# Test 1: Health Check
echo "Test 1: API Health Check"
echo "------------------------"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/health")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Health check passed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
else
    echo "❌ Health check failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
echo ""

# Test 2: API Root
echo "Test 2: API Root Endpoint"
echo "------------------------"
ROOT_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api")
HTTP_CODE=$(echo "$ROOT_RESPONSE" | tail -n1)
BODY=$(echo "$ROOT_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API root passed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
else
    echo "❌ API root failed (HTTP $HTTP_CODE)"
    echo "Response: $BODY"
fi
echo ""

# Test 3: Frontend
echo "Test 3: Frontend Root"
echo "------------------------"
FRONTEND_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/")
HTTP_CODE=$(echo "$FRONTEND_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Frontend loads (HTTP $HTTP_CODE)"
else
    echo "❌ Frontend failed (HTTP $HTTP_CODE)"
fi
echo ""

# Test 4: Key Pages
echo "Test 4: Key Application Pages"
echo "------------------------"

declare -a pages=(
    "/menu-management"
    "/kitchen"
    "/cashier"
    "/waiter"
    "/analytics"
    "/reports"
)

for page in "${pages[@]}"
do
    PAGE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
    if [ "$PAGE_RESPONSE" = "200" ]; then
        echo "✅ $page (HTTP $PAGE_RESPONSE)"
    else
        echo "❌ $page (HTTP $PAGE_RESPONSE)"
    fi
done
echo ""

# Test 5: tRPC Endpoint
echo "Test 5: tRPC Endpoint"
echo "------------------------"
TRPC_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/trpc/example.hi")
HTTP_CODE=$(echo "$TRPC_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" != "404" ]; then
    echo "✅ tRPC endpoint accessible (HTTP $HTTP_CODE)"
else
    echo "⚠️  tRPC returned 404 (might need specific query format)"
fi
echo ""

# Summary
echo "================================================"
echo "🎯 Test Summary"
echo "================================================"
echo ""
echo "If all tests show ✅, your deployment is successful!"
echo ""
echo "Next steps:"
echo "1. Open browser: $BASE_URL"
echo "2. Test full workflows (create menu item, order, etc.)"
echo "3. Monitor logs: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/logs"
echo ""
echo "🚀 You're live!"
