#!/bin/bash

# 🚀 Kurdish Cuisine Cashier System - Vercel Deployment Script
# This script automates the deployment process and fixes common issues

set -e

echo "🚀 Starting Vercel Deployment Fix..."
echo ""

# Step 1: Clean .vercel folder
echo "📁 Step 1/5: Cleaning .vercel folder..."
if [ -d ".vercel" ]; then
  rm -rf .vercel
  echo "✅ Removed .vercel folder"
else
  echo "ℹ️  No .vercel folder found"
fi
echo ""

# Step 2: Verify files
echo "📄 Step 2/5: Verifying required files..."
if [ ! -f "vercel.json" ]; then
  echo "❌ ERROR: vercel.json not found in project root!"
  exit 1
fi
if [ ! -f "api/index.ts" ]; then
  echo "❌ ERROR: api/index.ts not found!"
  exit 1
fi
if [ ! -f "backend/api/index.ts" ]; then
  echo "❌ ERROR: backend/api/index.ts not found!"
  exit 1
fi
echo "✅ All required files present"
echo ""

# Step 3: Verify environment variables
echo "🔍 Step 3/5: Checking local environment variables..."
if [ ! -f ".env" ]; then
  echo "⚠️  WARNING: .env file not found"
else
  if grep -q "SUPABASE_PROJECT_URL" .env; then
    echo "✅ Using SUPABASE_PROJECT_URL (correct)"
  else
    echo "⚠️  WARNING: SUPABASE_PROJECT_URL not found in .env"
  fi
fi
echo ""

# Step 4: Deploy to Vercel
echo "🚀 Step 4/5: Deploying to Vercel..."
echo "⚠️  Make sure you've set environment variables in Vercel dashboard first!"
echo ""
echo "Required variables in Vercel:"
echo "  - SUPABASE_PROJECT_URL"
echo "  - SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - DATABASE_URL"
echo "  - FRONTEND_URL"
echo "  - EXPO_PUBLIC_SUPABASE_URL"
echo "  - EXPO_PUBLIC_SUPABASE_ANON_KEY"
echo "  - EXPO_PUBLIC_API_BASE_URL"
echo "  - EXPO_PUBLIC_RORK_API_BASE_URL"
echo "  - NODE_ENV"
echo ""
read -p "Have you set these in Vercel? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "❌ Please set environment variables in Vercel first"
  echo "   Visit: https://vercel.com/dashboard"
  exit 1
fi

echo ""
echo "🚀 Deploying with force flag (clears cache)..."
vercel --prod --force --yes

echo ""
echo "✅ Deployment triggered!"
echo ""

# Step 5: Test deployment
echo "🧪 Step 5/5: Testing deployment..."
echo "Waiting 10 seconds for deployment to complete..."
sleep 10

echo ""
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health)

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  echo "✅ SUCCESS! API is responding correctly"
  echo "Response: $HEALTH_RESPONSE"
else
  echo "⚠️  WARNING: Unexpected response"
  echo "Response: $HEALTH_RESPONSE"
  echo ""
  echo "If deployment is still in progress, wait a few minutes and run:"
  echo "curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health"
fi

echo ""
echo "🎉 Deployment script complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Check Vercel dashboard for deployment status"
echo "  2. Test the API: https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health"
echo "  3. Check logs if there are any issues"
echo ""
