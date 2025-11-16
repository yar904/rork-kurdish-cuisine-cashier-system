# Platform Idle Mode Fix

## Issue
The platform is stuck in idle mode after refreshing, with error: "Colors is not defined"

## Root Cause
Metro bundler HMR (Hot Module Reload) cache issue causing undefined imports

## Solution

### Step 1: Clear Metro Cache
```bash
# Stop the current server (Ctrl+C)

# Clear cache and restart
npx expo start --clear

# Or alternative
npx expo start -c
```

### Step 2: Hard Refresh Browser
- **Chrome/Edge**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- **Safari**: Cmd+Option+R
- **Mobile**: Close and reopen the Expo Go app

### Step 3: If Still Not Working
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install

# Clear all caches
npx expo start --clear --reset-cache

# On mobile, uninstall and reinstall Expo Go
```

## Why Menu Items Not Showing

The cashier screen queries menu items from the backend using tRPC. If no items show:

1. **Check backend is running**: The backend at `https://opsnzswjxzvywvqjvjvy.functions.supabase.co/tapse-backend` must be accessible
2. **Check database**: Menu items must exist in the Supabase `menu_items` table
3. **Check console**: Open browser DevTools (F12) and look for network errors

## Quick Test
Once the app loads, open browser console (F12) and type:
```javascript
// This should show if menu data is loading
console.log('Menu loading status')
```

Look for any errors in red in the console - these will tell you exactly what's failing.

## If Backend Connection Fails

The app uses Supabase backend. Check:
1. Supabase project is active
2. Database tables exist (menu_items, orders, order_items, etc.)
3. RLS policies allow reading data
4. tRPC routes are deployed correctly

## Alternative: Use Local Dev Backend

If you want to develop locally without the deployed backend, you'll need to:
1. Set up local Supabase (optional)
2. Or use mock data temporarily
3. Update `app/_layout.tsx` line 64 to use local URL

## Need Help?

If the problem persists:
1. Copy the full error message from browser console
2. Check Network tab in DevTools for failed requests
3. Verify your Supabase project URL and keys in `.env`
