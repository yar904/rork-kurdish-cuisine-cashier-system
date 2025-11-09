#!/bin/bash

# Update package.json scripts to include health checks
echo "🔧 Updating package.json scripts..."

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "❌ jq is not installed. Installing..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install jq
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        sudo apt-get install -y jq
    else
        echo "⚠️  Please install jq manually: https://stedolan.github.io/jq/download/"
        exit 1
    fi
fi

# Backup original package.json
cp package.json package.json.backup
echo "✅ Backed up package.json to package.json.backup"

# Update scripts using jq
jq '.scripts.start = "node scripts/pre-build-check.js && expo start" |
    .scripts["start:web"] = "node scripts/pre-build-check.js && expo start --web" |
    .scripts["start:tunnel"] = "node scripts/pre-build-check.js && expo start --tunnel" |
    .scripts.android = "node scripts/pre-build-check.js && expo start --android" |
    .scripts.ios = "node scripts/pre-build-check.js && expo start --ios" |
    .scripts.web = "node scripts/pre-build-check.js && expo start --web" |
    .scripts.build = "node scripts/pre-build-check.js && expo export -p web && node scripts/post-build-report.js" |
    .scripts["build:web"] = "node scripts/pre-build-check.js && expo export -p web && node scripts/post-build-report.js" |
    .scripts["health-check"] = "node scripts/pre-build-check.js" |
    .scripts["health-report"] = "node scripts/post-build-report.js"' package.json > package.json.tmp

mv package.json.tmp package.json

echo "✅ Updated package.json scripts"
echo ""
echo "📋 New scripts available:"
echo "  - npm run health-check     # Run health check manually"
echo "  - npm run health-report    # Generate health report manually"
echo "  - npm start                # Starts with automatic health check"
echo "  - npm run build            # Builds with health checks"
echo ""
echo "🎉 Health monitoring system activated!"
echo "📖 See BUILD_HEALTH_SYSTEM.md for full documentation"
