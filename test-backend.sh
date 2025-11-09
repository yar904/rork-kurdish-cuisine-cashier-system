#!/bin/bash

echo "🧪 Testing Kurdish Cuisine Backend"
echo "=================================="
echo ""

BASE_URL="${1:-http://localhost:3000}"

echo "📍 Testing base URL: $BASE_URL"
echo ""

echo "1️⃣ Testing root endpoint..."
curl -s "$BASE_URL/" | jq 2>/dev/null || curl -s "$BASE_URL/"
echo ""
echo ""

echo "2️⃣ Testing health endpoint..."
curl -s "$BASE_URL/api/health" | jq 2>/dev/null || curl -s "$BASE_URL/api/health"
echo ""
echo ""

echo "3️⃣ Testing Supabase connection..."
curl -s "$BASE_URL/api/test"
echo ""
echo ""

echo "=================================="
echo "✅ Backend tests complete"
echo ""
echo "To test production, run:"
echo "  ./test-backend.sh https://kurdish-cuisine-cashier-system.rork.app"
