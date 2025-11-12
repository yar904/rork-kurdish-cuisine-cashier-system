#!/bin/bash

echo "🧹 Clearing Metro bundler cache..."
rm -rf node_modules/.cache
rm -rf .expo
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/react-*
rm -rf $TMPDIR/haste-*

echo "✅ Cache cleared! Now restart your dev server with:"
echo "   npx expo start --clear"
