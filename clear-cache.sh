#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
TMP_DIR="${TMPDIR:-/tmp}"

echo "🧹 Clearing Metro/Expo bundler cache..."
rm -rf "$ROOT_DIR/node_modules/.cache" "$ROOT_DIR/.expo" "$ROOT_DIR/.expo-shared" "$ROOT_DIR/.cache"
rm -rf "$ROOT_DIR/.turbo" "$ROOT_DIR/.parcel-cache" "$ROOT_DIR/.metro-cache"
rm -rf "$TMP_DIR"/metro-* "$TMP_DIR"/react-* "$TMP_DIR"/haste-*
rm -rf "$HOME/.expo" "$HOME/.expo-shared" "$HOME/.cache/expo" "$HOME/.cache/metro"

echo "🧩 Clearing TypeScript incremental state..."
find "$ROOT_DIR" -name "*.tsbuildinfo" -delete || true

echo "📦 Clearing React Native platform caches..."
rm -rf "$ROOT_DIR/android/app/build" "$ROOT_DIR/ios/build"

echo "✅ Cache cleared! Now restart your dev server with:"
echo "   npx expo start --clear"
