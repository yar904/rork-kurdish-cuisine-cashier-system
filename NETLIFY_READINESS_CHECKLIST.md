# ✅ Netlify Deployment Readiness Checklist

## 🔧 Code Changes (COMPLETED)

- ✅ **Fixed:** `react-native-reanimated` added to `package.json`
- ✅ **Verified:** `babel.config.js` has the plugin configured correctly
- ✅ **Verified:** `netlify.toml` is properly configured
- ✅ **Verified:** `package-lock.json` updated with new dependency

## 📋 Required Environment Variables for Netlify

Add these to **Netlify Dashboard → Site Settings → Environment Variables**:

### Required Variables (All Scopes)

```bash
NODE_ENV=production

SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4

DATABASE_URL=postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres

FRONTEND_URL=https://tapse.netlify.app

# Expo Public Variables (Client-side)
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjAsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
EXPO_PUBLIC_RORK_API_BASE_URL=https://tapse.netlify.app
EXPO_PUBLIC_API_BASE_URL=https://tapse.netlify.app
EXPO_PUBLIC_API_URL=https://tapse.netlify.app
```

**Note:** Update `FRONTEND_URL` and `EXPO_PUBLIC_*_URL` variables with your actual Netlify site URL if different from `tapse.netlify.app`.

## ✅ Pre-Deployment Checklist

Before deploying to Netlify:

1. **Commit Changes**
   ```bash
   git add package.json package-lock.json
   git commit -m "fix: add react-native-reanimated dependency for Netlify build"
   git push
   ```

2. **Verify Netlify Configuration**
   - ✅ `netlify.toml` exists and has correct build command
   - ✅ `netlify/functions/api.js` exists (for backend API)
   - ✅ Build command: `npx expo export -p web`
   - ✅ Publish directory: `dist`

3. **Set Environment Variables**
   - Go to Netlify Dashboard → Site Settings → Environment Variables
   - Add all variables listed above
   - Set scope to "All scopes" for each variable

4. **Deploy**
   - Trigger a new deploy from Netlify Dashboard
   - Or push to connected Git branch

## 🚨 Potential Issues to Watch For

1. **Build Time:** Expect 5-10 minutes for first build
2. **Environment Variables:** Ensure all `EXPO_PUBLIC_*` variables are set (they're needed at build time)
3. **API Routes:** If using Netlify Functions, ensure `/api/*` routes are properly configured
4. **CORS:** If backend is separate, ensure CORS is configured correctly

## 📝 Files Modified

- `package.json` - Added `react-native-reanimated`
- `package-lock.json` - Updated with dependency tree

## 🎯 Next Steps

1. ✅ Commit and push the changes
2. ✅ Add environment variables in Netlify
3. ✅ Trigger a new deployment
4. ✅ Monitor build logs for any errors

---

**Status:** ✅ **READY TO DEPLOY** (after committing changes and setting environment variables)

