# 🏥 Build Health Monitoring System

This system automatically monitors and diagnoses the health of your Rork/Tapse environment during every build and deployment.

## 📋 What It Does

- ✅ Checks active ports (8081, 8082, 19000, 19001, 19002, 3000) for conflicts
- 🧹 Clears Metro bundler and Expo cache automatically
- 🔍 Verifies environment variables are loaded correctly
- 🗄️ Pings Supabase to ensure connection is healthy
- 🔤 Verifies fonts and assets are loaded successfully
- ⏱️ Tracks build duration and completion time
- 📊 Generates detailed JSON reports
- 💡 Suggests exact terminal commands to fix detected issues

## 🚀 Usage

### Automatic Health Checks

To enable automatic health checks on every build, update your `package.json` scripts:

```json
{
  "scripts": {
    "start": "node scripts/pre-build-check.js && expo start",
    "start:web": "node scripts/pre-build-check.js && expo start --web",
    "build": "node scripts/pre-build-check.js && expo export -p web && node scripts/post-build-report.js",
    "build:web": "node scripts/pre-build-check.js && expo export -p web && node scripts/post-build-report.js"
  }
}
```

### Manual Health Checks

Run health checks manually anytime:

```bash
# Pre-build health check
npm run health-check
# or
node scripts/pre-build-check.js

# Post-build report
npm run health-report
# or
node scripts/post-build-report.js
```

## 📁 File Structure

```
scripts/
├── health-utils.js         # Core utilities for all health checks
├── pre-build-check.js      # Runs before build starts
└── post-build-report.js    # Runs after build completes

logs/
└── build_health.json       # Latest health report (auto-generated)
```

## 📊 Report Format

The health report is saved in `/logs/build_health.json` with the following structure:

```json
{
  "type": "pre-build" | "post-build",
  "timestamp": "2025-01-09T10:30:00.000Z",
  "duration": 45000,
  "ports": {
    "8081": {
      "occupied": true,
      "pids": ["12345"],
      "killCommand": "kill -9 12345"
    }
  },
  "cache": {
    "success": true,
    "message": "Cache cleared successfully"
  },
  "env": {
    "allPresent": true,
    "results": {
      "EXPO_PUBLIC_SUPABASE_URL": {
        "exists": true,
        "value": "https://oqspnszwjxzy..."
      }
    },
    "missing": []
  },
  "supabase": {
    "ok": true,
    "status": 200,
    "duration": "245ms"
  },
  "assets": {
    "fonts": ["Inter.ttf", "NotoNaskhArabic.ttf"],
    "images": ["icon.png", "splash-icon.png", "favicon.png"],
    "totalFonts": 5,
    "totalImages": 4
  },
  "previewUrl": "http://localhost:8081"
}
```

## 🔧 Console Output

The scripts provide colorful, emoji-rich console output:

```
============================================================
🚀 BUILD HEALTH REPORT 🚀
============================================================

⏱️ Timestamp: 2025-01-09T10:30:00.000Z
⏱️ Duration: 45s

🔌 PORT STATUS:
  ✅ Port 8081 is available
  ✅ Port 8082 is available
  ✅ Port 19000 is available

🧹 CACHE STATUS:
  ✅ Cache cleared successfully

ℹ️ ENVIRONMENT VARIABLES:
  ✅ All required variables present

🗄️ SUPABASE CONNECTION:
  ✅ Connected (200) - 245ms

🔤 ASSETS:
  ✅ Fonts: 5 loaded
    Top fonts: Inter.ttf, NotoNaskhArabic.ttf
  ✅ Images: 4 loaded
    Top images: icon.png, splash-icon.png, favicon.png

🌐 Preview URL: http://localhost:8081

============================================================
✅ All systems healthy!
============================================================
```

## 🐛 Error Detection & Fixes

When issues are detected, the system provides exact commands to fix them:

### Port Conflicts
```
❌ Port 8081 is occupied (PID: 12345)
   Fix: kill -9 12345
```

### Missing Environment Variables
```
❌ Missing variables: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY
   Fix: Add these variables to your .env file
```

### Supabase Connection Failed
```
❌ Failed (Network Error)
   Error: fetch failed
   Fix: Check your EXPO_PUBLIC_SUPABASE_URL and internet connection
```

### Cache Issues
```
❌ Cache clear failed
   Fix: Manually run: rm -rf .expo node_modules/.cache
   Or on Windows: rd /s /q .expo && rd /s /q node_modules\.cache
```

## 🔄 Integration with CI/CD

The scripts are designed to work in both local and CI/CD environments:

- **Exit codes**: Scripts exit with code `1` if blocking issues are detected
- **JSON output**: Detailed reports are saved for parsing by CI tools
- **Cross-platform**: Works on Windows, macOS, and Linux

## 🎯 Compatibility

- ✅ Works with both `npm` and `bun`
- ✅ Compatible with Expo SDK 54+
- ✅ Supports Windows, macOS, and Linux
- ✅ Works in Rork preview environment
- ✅ Works in production deployments

## 📝 Notes

- Reports are overwritten on each run (only the latest report is kept)
- Pre-build checks will **exit with error** if blocking issues are found
- Post-build reports are **informational only** and never block builds
- The system automatically creates the `/logs` directory if it doesn't exist
- Cache clearing is safe and only removes Expo/Metro temporary files

## 🛠️ Customization

To check additional ports, edit `scripts/health-utils.js`:

```javascript
async function checkCommonPorts() {
  const portsToCheck = [8081, 8082, 19000, 19001, 19002, 3000, YOUR_PORT_HERE];
  // ...
}
```

To add more environment variables to verify, edit `scripts/health-utils.js`:

```javascript
async function verifyEnvVariables() {
  const requiredVars = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
    'EXPO_PUBLIC_RORK_API_BASE_URL',
    'YOUR_CUSTOM_VAR_HERE'
  ];
  // ...
}
```

---

**Ready to use!** The health monitoring system is now active. Simply update your `package.json` scripts to enable automatic checks on every build.
