#!/bin/bash
set -euo pipefail

if [ ! -d .git ]; then
  echo "❌ This script must be run from the project root (Git repository)." >&2
  exit 1
fi

echo "🔄 Fetching latest main branch..."
git fetch origin main

echo "🧹 Resetting working tree to origin/main..."
git reset --hard origin/main

echo "📦 Installing dependencies (npm install --silent)..."
npm install --silent

npx expo doctor || echo "Expo doctor check skipped"

echo "✅ Startup sync complete."
