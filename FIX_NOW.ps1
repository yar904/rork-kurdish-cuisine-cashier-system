Write-Host "🔧 Fixing Kurdish Cuisine Cashier System..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Fix backend zod version
Write-Host "📦 Step 1: Fixing backend dependencies..." -ForegroundColor Yellow
Set-Location backend

# Create a temporary fixed package.json
@"
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
"@ | Out-File -FilePath package.json -Encoding utf8

Write-Host "✅ Backend package.json fixed!" -ForegroundColor Green
Write-Host ""

# Step 2: Reinstall backend dependencies
Write-Host "📦 Step 2: Reinstalling backend dependencies..." -ForegroundColor Yellow
Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path package-lock.json -Force -ErrorAction SilentlyContinue
npm install
Write-Host "✅ Backend dependencies installed!" -ForegroundColor Green
Write-Host ""

# Go back to root
Set-Location ..

# Step 3: Install/update main dependencies
Write-Host "📦 Step 3: Checking main project dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✅ Main project dependencies installed!" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 All fixes complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Now you can run:" -ForegroundColor Cyan
Write-Host "   bun start                    (to start Expo)" -ForegroundColor White
Write-Host "   cd backend; npm run dev      (to start backend locally)" -ForegroundColor White
Write-Host ""
