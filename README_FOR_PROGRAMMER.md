# 🚨 URGENT FIX NEEDED - Netlify Build Failing

## Problem
Netlify build is failing with: **`sh: 1: tsc: not found`**

This happens because backend dependencies (including TypeScript) are not installed before building.

## Solution (2 minutes)

### Step 1: Update package.json
Open the root `package.json` file and change line 12:

**FROM:**
```json
"build:backend": "npm --prefix backend run build",
```

**TO:**
```json
"build:backend": "npm --prefix backend install && npm --prefix backend run build",
```

### Step 2: Commit and Push
```bash
git add package.json
git commit -m "Fix: Install backend dependencies before build"
git push origin main
```

### Step 3: Verify on Netlify
- Go to Netlify dashboard
- Wait for automatic deploy to trigger
- Build should now succeed

## What This Does
- Installs backend dependencies (including `typescript`) before running the build
- The `netlify.toml` already has this fix, but package.json also needs it for consistency

## Expected Result
✅ Build completes successfully  
✅ Site deploys to Netlify  
✅ Frontend and backend both work  

## If Still Failing
Check that all environment variables are set in Netlify:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `FRONTEND_URL`

---

**That's it! Just change 1 line in package.json.**
