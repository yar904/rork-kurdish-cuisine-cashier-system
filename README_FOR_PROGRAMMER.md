# URGENT FIX NEEDED - Netlify Build Failure

## Problem
The build is failing on Netlify with error: `tsc: not found`

This happens because the backend dependencies aren't being installed before building.

## Fix Required

### Step 1: Update package.json build script

In the root `package.json`, change line 12 from:
```json
"build:backend": "npm --prefix backend run build",
```

To:
```json
"build:backend": "npm --prefix backend install && npm --prefix backend run build",
```

This ensures backend dependencies (including TypeScript) are installed before building.

### Step 2: Commit and push

```bash
git add package.json
git commit -m "Fix: Install backend deps before build"
git push origin main
```

### Step 3: Netlify will auto-deploy

Once pushed, Netlify will automatically detect the changes and rebuild. The build should succeed this time.

## Alternative Quick Fix (If you can't edit package.json)

Update `netlify.toml` build command:

```toml
[build]
command = "npm --prefix backend install && npm run build"
publish = "dist"
functions = "netlify/functions"
```

## What This Does

1. Installs backend dependencies (TypeScript, Hono, etc.)
2. Builds backend TypeScript to JavaScript
3. Builds frontend Expo web app
4. Deploys both to Netlify

## Expected Result

After this fix:
- ✅ Backend builds successfully (TypeScript compiles)
- ✅ Frontend builds successfully (Expo web export)
- ✅ Netlify functions deploy
- ✅ Site goes live

## Environment Variables Already Set

All required env vars are configured in Netlify:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY
- EXPO_PUBLIC_RORK_API_BASE_URL
- FRONTEND_URL
- DATABASE_URL
- SUPABASE_SERVICE_ROLE_KEY

No changes needed there.

## Time to Fix: 2 minutes
