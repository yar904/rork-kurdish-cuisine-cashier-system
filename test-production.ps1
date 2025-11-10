# Production Deployment Test Script (PowerShell)
# Kurdish Cuisine Cashier System
# Run this after deploying to verify everything works

Write-Host "🧪 Testing Production Deployment..." -ForegroundColor Cyan
Write-Host "URL: https://rork-kurdish-cuisine-cashier-system.vercel.app" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

$BASE_URL = "https://rork-kurdish-cuisine-cashier-system.vercel.app"

# Test 1: Health Check
Write-Host "Test 1: API Health Check" -ForegroundColor Yellow
Write-Host "------------------------"
try {
    $healthResponse = Invoke-WebRequest -Uri "$BASE_URL/api/health" -UseBasicParsing
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "✅ Health check passed (HTTP $($healthResponse.StatusCode))" -ForegroundColor Green
        Write-Host "Response: $($healthResponse.Content)"
    }
} catch {
    Write-Host "❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: API Root
Write-Host "Test 2: API Root Endpoint" -ForegroundColor Yellow
Write-Host "------------------------"
try {
    $rootResponse = Invoke-WebRequest -Uri "$BASE_URL/api" -UseBasicParsing
    if ($rootResponse.StatusCode -eq 200) {
        Write-Host "✅ API root passed (HTTP $($rootResponse.StatusCode))" -ForegroundColor Green
        Write-Host "Response: $($rootResponse.Content)"
    }
} catch {
    Write-Host "❌ API root failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Frontend
Write-Host "Test 3: Frontend Root" -ForegroundColor Yellow
Write-Host "------------------------"
try {
    $frontendResponse = Invoke-WebRequest -Uri "$BASE_URL/" -UseBasicParsing
    if ($frontendResponse.StatusCode -eq 200) {
        Write-Host "✅ Frontend loads (HTTP $($frontendResponse.StatusCode))" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Frontend failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Key Pages
Write-Host "Test 4: Key Application Pages" -ForegroundColor Yellow
Write-Host "------------------------"

$pages = @(
    "/menu-management",
    "/kitchen",
    "/cashier",
    "/waiter",
    "/analytics",
    "/reports"
)

foreach ($page in $pages) {
    try {
        $pageResponse = Invoke-WebRequest -Uri "$BASE_URL$page" -UseBasicParsing
        if ($pageResponse.StatusCode -eq 200) {
            Write-Host "✅ $page (HTTP $($pageResponse.StatusCode))" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ $page failed" -ForegroundColor Red
    }
}
Write-Host ""

# Test 5: tRPC Endpoint
Write-Host "Test 5: tRPC Endpoint" -ForegroundColor Yellow
Write-Host "------------------------"
try {
    $trpcResponse = Invoke-WebRequest -Uri "$BASE_URL/api/trpc/example.hi" -UseBasicParsing
    Write-Host "✅ tRPC endpoint accessible (HTTP $($trpcResponse.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "⚠️  tRPC returned error (might need specific query format)" -ForegroundColor Yellow
}
Write-Host ""

# Summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🎯 Test Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests show ✅, your deployment is successful!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Open browser: $BASE_URL"
Write-Host "2. Test full workflows (create menu item, order, etc.)"
Write-Host "3. Monitor logs: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/logs"
Write-Host ""
Write-Host "🚀 You're live!" -ForegroundColor Green
