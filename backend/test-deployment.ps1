# 🧪 Backend Deployment Test Script (PowerShell)
# Tests your backend API endpoints before deploying to Vercel

Write-Host "🧪 Testing Kurdish Cuisine Backend API..." -ForegroundColor Cyan
Write-Host ""

# Configuration
$BaseUrl = if ($args[0]) { $args[0] } else { "http://localhost:3000" }
Write-Host "📍 Testing against: $BaseUrl" -ForegroundColor Yellow
Write-Host ""

# Test counters
$TestsPassed = 0
$TestsFailed = 0

# Test 1: Health Check
Write-Host "Test 1: Health Check Endpoint" -ForegroundColor White
try {
    $Response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -Method GET -UseBasicParsing
    if ($Response.StatusCode -eq 200) {
        Write-Host "✓ PASS - Status: $($Response.StatusCode)" -ForegroundColor Green
        Write-Host "  Response: $($Response.Content)" -ForegroundColor Gray
        $TestsPassed++
    }
} catch {
    Write-Host "✗ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $TestsFailed++
}
Write-Host ""

# Test 2: Root Endpoint
Write-Host "Test 2: Root Endpoint" -ForegroundColor White
try {
    $Response = Invoke-WebRequest -Uri "$BaseUrl/" -Method GET -UseBasicParsing
    if ($Response.StatusCode -eq 200) {
        Write-Host "✓ PASS - Status: $($Response.StatusCode)" -ForegroundColor Green
        Write-Host "  Response: $($Response.Content)" -ForegroundColor Gray
        $TestsPassed++
    }
} catch {
    Write-Host "✗ FAIL - Error: $($_.Exception.Message)" -ForegroundColor Red
    $TestsFailed++
}
Write-Host ""

# Test 3: CORS Headers
Write-Host "Test 3: CORS Configuration" -ForegroundColor White
try {
    $Response = Invoke-WebRequest -Uri "$BaseUrl/api/health" -Method OPTIONS -UseBasicParsing
    $CorsHeaders = $Response.Headers | Where-Object { $_.Key -like "*Access-Control*" }
    if ($CorsHeaders) {
        Write-Host "✓ PASS - CORS headers present" -ForegroundColor Green
        $CorsHeaders | ForEach-Object { Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Gray }
        $TestsPassed++
    } else {
        Write-Host "⚠ WARNING - No CORS headers found" -ForegroundColor Yellow
        $TestsFailed++
    }
} catch {
    Write-Host "⚠ WARNING - Could not check CORS: $($_.Exception.Message)" -ForegroundColor Yellow
    $TestsFailed++
}
Write-Host ""

# Test 4: tRPC Endpoint
Write-Host "Test 4: tRPC Endpoint Accessibility" -ForegroundColor White
try {
    $Response = Invoke-WebRequest -Uri "$BaseUrl/api/trpc/example.hi" -Method GET -UseBasicParsing -ErrorAction SilentlyContinue
    if ($Response.StatusCode -eq 200 -or $Response.StatusCode -eq 400) {
        Write-Host "✓ PASS - tRPC endpoint is accessible (Status: $($Response.StatusCode))" -ForegroundColor Green
        $TestsPassed++
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 400) {
        Write-Host "✓ PASS - tRPC endpoint is accessible (Status: 400, expected)" -ForegroundColor Green
        $TestsPassed++
    } else {
        Write-Host "✗ FAIL - Unexpected error: $($_.Exception.Message)" -ForegroundColor Red
        $TestsFailed++
    }
}
Write-Host ""

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Test Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "✓ Passed: $TestsPassed" -ForegroundColor Green
Write-Host "✗ Failed: $TestsFailed" -ForegroundColor Red
Write-Host ""

if ($TestsFailed -eq 0) {
    Write-Host "🎉 All tests passed! Your backend is ready to deploy." -ForegroundColor Green
    exit 0
} else {
    Write-Host "❌ Some tests failed. Please fix the issues before deploying." -ForegroundColor Red
    exit 1
}
