@echo off
REM Update package.json scripts to include health checks

echo 🔧 Updating package.json scripts...

REM Backup original package.json
copy package.json package.json.backup >nul
echo ✅ Backed up package.json to package.json.backup

REM Check if Node.js is available
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    exit /b 1
)

REM Use Node.js to update package.json
node -e "const fs = require('fs'); const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8')); pkg.scripts.start = 'node scripts/pre-build-check.js && expo start'; pkg.scripts['start:web'] = 'node scripts/pre-build-check.js && expo start --web'; pkg.scripts['start:tunnel'] = 'node scripts/pre-build-check.js && expo start --tunnel'; pkg.scripts.android = 'node scripts/pre-build-check.js && expo start --android'; pkg.scripts.ios = 'node scripts/pre-build-check.js && expo start --ios'; pkg.scripts.web = 'node scripts/pre-build-check.js && expo start --web'; pkg.scripts.build = 'node scripts/pre-build-check.js && expo export -p web && node scripts/post-build-report.js'; pkg.scripts['build:web'] = 'node scripts/pre-build-check.js && expo export -p web && node scripts/post-build-report.js'; pkg.scripts['health-check'] = 'node scripts/pre-build-check.js'; pkg.scripts['health-report'] = 'node scripts/post-build-report.js'; fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));"

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to update package.json
    exit /b 1
)

echo ✅ Updated package.json scripts
echo.
echo 📋 New scripts available:
echo   - npm run health-check     # Run health check manually
echo   - npm run health-report    # Generate health report manually
echo   - npm start                # Starts with automatic health check
echo   - npm run build            # Builds with health checks
echo.
echo 🎉 Health monitoring system activated!
echo 📖 See BUILD_HEALTH_SYSTEM.md for full documentation
