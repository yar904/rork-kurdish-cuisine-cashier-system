# 🚀 Kurdish Cuisine Cashier System - Vercel Deployment Script (PowerShell)
# This script automates the deployment process and fixes common issues

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Vercel Deployment Fix..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean .vercel folder
Write-Host "📁 Step 1/5: Cleaning .vercel folder..." -ForegroundColor Yellow
if (Test-Path ".vercel") {
    Remove-Item -Recurse -Force .vercel
    Write-Host "✅ Removed .vercel folder" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No .vercel folder found" -ForegroundColor Gray
}
Write-Host ""

# Step 2: Verify files
Write-Host "📄 Step 2/5: Verifying required files..." -ForegroundColor Yellow
$missingFiles = @()

if (-not (Test-Path "vercel.json")) {
    $missingFiles += "vercel.json"
}
if (-not (Test-Path "api/index.ts")) {
    $missingFiles += "api/index.ts"
}
if (-not (Test-Path "backend/api/index.ts")) {
    $missingFiles += "backend/api/index.ts"
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ ERROR: Missing files:" -ForegroundColor Red
    $missingFiles | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
    exit 1
}

Write-Host "✅ All required files present" -ForegroundColor Green
Write-Host ""

# Step 3: Verify environment variables
Write-Host "🔍 Step 3/5: Checking local environment variables..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  WARNING: .env file not found" -ForegroundColor Yellow
} else {
    $envContent = Get-Content .env -Raw
    if ($envContent -match "SUPABASE_PROJECT_URL") {
        Write-Host "✅ Using SUPABASE_PROJECT_URL (correct)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  WARNING: SUPABASE_PROJECT_URL not found in .env" -ForegroundColor Yellow
    }
}
Write-Host ""

# Step 4: Deploy to Vercel
Write-Host "🚀 Step 4/5: Deploying to Vercel..." -ForegroundColor Yellow
Write-Host "⚠️  Make sure you've set environment variables in Vercel dashboard first!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Required variables in Vercel:" -ForegroundColor Cyan
Write-Host "  - SUPABASE_PROJECT_URL"
Write-Host "  - SUPABASE_ANON_KEY"
Write-Host "  - SUPABASE_SERVICE_ROLE_KEY"
Write-Host "  - DATABASE_URL"
Write-Host "  - FRONTEND_URL"
Write-Host "  - EXPO_PUBLIC_SUPABASE_URL"
Write-Host "  - EXPO_PUBLIC_SUPABASE_ANON_KEY"
Write-Host "  - EXPO_PUBLIC_API_BASE_URL"
Write-Host "  - EXPO_PUBLIC_RORK_API_BASE_URL"
Write-Host "  - NODE_ENV"
Write-Host ""

$confirm = Read-Host "Have you set these in Vercel? (y/n)"
if ($confirm -notmatch '^[Yy]$') {
    Write-Host "❌ Please set environment variables in Vercel first" -ForegroundColor Red
    Write-Host "   Visit: https://vercel.com/dashboard" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "🚀 Deploying with force flag (clears cache)..." -ForegroundColor Cyan
vercel --prod --force --yes

Write-Host ""
Write-Host "✅ Deployment triggered!" -ForegroundColor Green
Write-Host ""

# Step 5: Test deployment
Write-Host "🧪 Step 5/5: Testing deployment..." -ForegroundColor Yellow
Write-Host "Waiting 10 seconds for deployment to complete..."
Start-Sleep -Seconds 10

Write-Host ""
Write-Host "Testing health endpoint..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health" -Method Get
    
    if ($response.status -eq "ok") {
        Write-Host "✅ SUCCESS! API is responding correctly" -ForegroundColor Green
        Write-Host "Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "⚠️  WARNING: Unexpected response" -ForegroundColor Yellow
        Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  WARNING: Could not reach endpoint" -ForegroundColor Yellow
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "If deployment is still in progress, wait a few minutes and run:" -ForegroundColor Yellow
    Write-Host "Invoke-RestMethod -Uri 'https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health'" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "🎉 Deployment script complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Check Vercel dashboard for deployment status"
Write-Host "  2. Test the API: https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health"
Write-Host "  3. Check logs if there are any issues"
Write-Host ""
