#!/bin/bash

echo "🔧 Fixing Expo configuration..."

# Remove expo-audio plugin from app.json since it's not being used
cat > app.json << 'EOF'
{
  "expo": {
    "name": "Kurdish Cuisine Cashier System",
    "slug": "kurdish-cuisine-cashier-system",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "platforms": [
      "ios",
      "android",
      "web"
    ],
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "package": "app.rork.kurdishcuisinecashier"
    },
    "ios": {
      "bundleIdentifier": "app.rork.kurdishcuisinecashier"
    },
    "web": {
      "favicon": "./assets/images/favicon.png",
      "bundler": "metro"
    },
    "plugins": [
      [
        "expo-router",
        {
          "origin": "https://rork.com/"
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
EOF

echo "✅ Fixed app.json - removed expo-audio plugin"

# Clean node_modules and reinstall
echo "🧹 Cleaning node_modules..."
rm -rf node_modules

echo "📦 Installing dependencies..."
npm install

echo "✨ Done! Now run: bun start"
