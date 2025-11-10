#!/bin/bash

echo "🔧 Fixing Kurdish Cuisine Cashier System..."
echo ""

# Step 1: Fix backend zod version
echo "📦 Step 1: Fixing backend dependencies..."
cd backend

# Create a temporary fixed package.json
cat > package.json << 'EOF'
{
  "name": "kurdish-cuisine-backend",
  "version": "1.0.0",
  "description": "Backend for Kurdish Cuisine Cashier System",
  "main": "hono.ts",
  "type": "module",
  "scripts": {
    "dev": "tsx watch --env-file=.env hono.ts",
    "build": "tsc --project tsconfig.json",
    "start": "node dist/hono.js"
  },
  "dependencies": {
    "@hono/node-server": "^1.12.0",
    "@hono/trpc-server": "^0.4.0",
    "@supabase/supabase-js": "^2.44.2",
    "@trpc/server": "^11.7.1",
    "dotenv": "^16.4.5",
    "hono": "^4.10.4",
    "superjson": "^2.2.5",
    "typescript": "^5.9.3",
    "zod": "^4.1.12"
  },
  "devDependencies": {
    "@types/node": "^20.11.24",
    "tsx": "^4.19.0"
  },
  "author": "Yar Khader",
  "license": "MIT"
}
EOF

echo "✅ Backend package.json fixed!"
echo ""

# Step 2: Reinstall backend dependencies
echo "📦 Step 2: Reinstalling backend dependencies..."
rm -rf node_modules package-lock.json
npm install
echo "✅ Backend dependencies installed!"
echo ""

# Go back to root
cd ..

# Step 3: Install/update main dependencies
echo "📦 Step 3: Checking main project dependencies..."
npm install
echo "✅ Main project dependencies installed!"
echo ""

echo "🎉 All fixes complete!"
echo ""
echo "🚀 Now you can run:"
echo "   bun start        (to start Expo)"
echo "   cd backend && npm run dev    (to start backend locally)"
echo ""
