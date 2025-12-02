#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

REQUIRED_FILES=(
  "app/menu.tsx"
  "contexts/RestaurantContext.tsx"
  "contexts/TableContext.tsx"
  "contexts/NotificationContext.tsx"
  "lib/trpcClient.ts"
)

DEPRECATED_FILES=(
  "app/public-menu.tsx"
  "lib/api.ts"
  "lib/supabase.ts"
)

echo "🔁 Starting full workspace repair..."

bash "$ROOT_DIR/clear-cache.sh"

echo "🗑️ Removing additional caches..."
rm -rf "$ROOT_DIR/node_modules/.cache" "$ROOT_DIR/.expo" "$ROOT_DIR/.expo-shared" "$ROOT_DIR/.turbo" "$ROOT_DIR/.parcel-cache" "$ROOT_DIR/.cache"
rm -rf "$ROOT_DIR/.gradle" "$ROOT_DIR/.idea" "$ROOT_DIR/.vscode/.cache"
find "$ROOT_DIR" -name "*.tsbuildinfo" -delete || true

BACKUP_DIR="$ROOT_DIR/node_modules.backup"
if [ -d "$ROOT_DIR/node_modules" ]; then
  echo "♻️ Backing up existing node_modules before reinstall..."
  rm -rf "$BACKUP_DIR"
  mv "$ROOT_DIR/node_modules" "$BACKUP_DIR"
fi

echo "♻️ Reinstalling dependencies with npm ci..."
if npm ci; then
  rm -rf "$BACKUP_DIR"
else
  echo "⚠️ npm ci failed. Restoring previous node_modules cache if available."
  rm -rf "$ROOT_DIR/node_modules"
  if [ -d "$BACKUP_DIR" ]; then
    mv "$BACKUP_DIR" "$ROOT_DIR/node_modules"
  fi
  exit 1
fi

echo "🧭 Rebuilding TypeScript project to re-index types..."
npx tsc --noEmit

echo "🔍 Validating critical files..."
STATUS=0
for path in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$path" ]; then
    echo "❌ Missing required file: $path"
    STATUS=1
  else
    echo "✅ Found required file: $path"
  fi
done

for path in "${DEPRECATED_FILES[@]}"; do
  if [ -f "$path" ]; then
    echo "❌ Deprecated file should be removed: $path"
    STATUS=1
  else
    echo "✅ Deprecated file not present: $path"
  fi
done

if [ $STATUS -ne 0 ]; then
  echo "⚠️ Workspace validation failed. Please address the issues above."
  exit 1
fi

echo "🎉 Workspace repair complete. You can restart the bundler with:"
echo "   npx expo start --clear"
