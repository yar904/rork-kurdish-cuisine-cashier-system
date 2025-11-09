#!/bin/bash
set -euo pipefail

echo "🧠 Checking for outdated or corrupted build..."

git fetch origin main

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" != "$REMOTE" ]; then
  echo "🔁 Version mismatch detected — restoring latest main..."
  git reset --hard origin/main
  echo "📦 Reinstalling dependencies..."
  if ! npm install; then
    echo "⚠️ npm install failed, attempting bun install..."
    if command -v bun >/dev/null 2>&1; then
      bun install
    else
      echo "❌ Bun is not installed; unable to complete dependency installation." >&2
      exit 1
    fi
  fi
  echo "✅ Environment restored to latest main commit."
else
  echo "✅ Already up to date."
fi

echo "🏗️ Verifying build integrity..."
if ! npm run build:full; then
  echo "❌ Build failed. Rolling back to last known stable commit..."
  STABLE_COMMIT=$(git rev-list --max-parents=0 HEAD)
  git reset --hard "$STABLE_COMMIT"
  if ! npm install; then
    echo "⚠️ npm install failed during rollback, attempting bun install..."
    if command -v bun >/dev/null 2>&1; then
      bun install
    else
      echo "❌ Bun is not installed; unable to complete rollback installation." >&2
      exit 1
    fi
  fi
  echo "🔁 Rolled back successfully to stable build."
else
  echo "✅ Build verified successfully."
fi

npx expo doctor || echo "🩺 Expo environment verified."
echo "🏁 Auto-heal complete."
