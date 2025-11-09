# ✅ Vercel Environment Variables - Final Configuration

**Last Updated:** 2025-10-25  
**Status:** ✅ Fixed - SUPABASE_URL → SUPABASE_PROJECT_URL

---

## 🎯 Problem Solved

The recurring error:
```
Environment Variable 'SUPABASE_URL' references Secret 'supabase_url', which does not exist
```

**Root Cause:** Vercel converts variable names to lowercase when creating secrets, causing a mismatch.

**Solution:** Renamed `SUPABASE_URL` → `SUPABASE_PROJECT_URL` throughout the entire project.

---

## 📋 Environment Variables to Add to Vercel

### Required for All Environments (Production, Preview, Development)

Copy these **exact** values to Vercel → Settings → Environment Variables:

```bash
NODE_ENV=production

# Supabase Configuration
SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4

# Database
DATABASE_URL=postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres

# Frontend/API URLs
FRONTEND_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app

# Expo Public Variables (client-side accessible)
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
EXPO_PUBLIC_API_BASE_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
EXPO_PUBLIC_RORK_API_BASE_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
```

---

## 🚀 Step-by-Step Deployment Guide

### 1. Clean Up Old Variables (If They Exist)

Go to Vercel Dashboard → Your Project → Settings → Environment Variables

**DELETE these if they exist:**
- ❌ `SUPABASE_URL` (old name)
- ❌ `supabase_url` (lowercase secret)

### 2. Add New Variables

For **each** variable above:
1. Click "Add New"
2. Enter the **Key** (e.g., `SUPABASE_PROJECT_URL`)
3. Enter the **Value**
4. Select **All environments**: Production, Preview, Development
5. Click "Save"

### 3. Verify All Variables Are Set

Check that these **10 variables** exist in all environments:
- ✅ NODE_ENV
- ✅ SUPABASE_PROJECT_URL
- ✅ SUPABASE_ANON_KEY
- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ DATABASE_URL
- ✅ FRONTEND_URL
- ✅ EXPO_PUBLIC_SUPABASE_URL
- ✅ EXPO_PUBLIC_SUPABASE_ANON_KEY
- ✅ EXPO_PUBLIC_API_BASE_URL
- ✅ EXPO_PUBLIC_RORK_API_BASE_URL

### 4. Trigger Fresh Deployment

Option A - Via CLI:
```bash
vercel --prod --yes --force
```

Option B - Via Dashboard:
1. Go to Deployments tab
2. Click "Redeploy" on the latest deployment
3. Check "Use existing Build Cache" → **OFF**
4. Click "Redeploy"

### 5. Test Deployment

After deployment completes (3-5 minutes):

```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-10-25T..."
}
```

---

## 🔍 Troubleshooting

### Issue: Still getting "supabase_url does not exist"

**Solution:**
1. Delete the variable `SUPABASE_URL` from Vercel completely
2. Ensure `SUPABASE_PROJECT_URL` is set instead
3. Redeploy with `--force` flag

### Issue: 404 on /api/health

**Solution:**
1. Check that `api/index.ts` exists at the project root
2. Verify `vercel.json` is at the project root (not in backend/)
3. Ensure `vercel.json` contains:
   ```json
   {
     "version": 2,
     "routes": [
       { "src": "/api/(.*)", "dest": "api/index.ts" },
       { "src": "/(.*)", "dest": "api/index.ts" }
     ]
   }
   ```

### Issue: CORS errors

**Solution:**
Check that `FRONTEND_URL` is set correctly in Vercel and matches your deployment URL.

---

## 📝 Key Changes Made

1. **Renamed Environment Variable:**
   - Old: `SUPABASE_URL`
   - New: `SUPABASE_PROJECT_URL`

2. **Updated Files:**
   - ✅ `backend/.env`
   - ✅ `backend/index.ts`
   - ✅ `.env` (root)
   - ✅ `lib/supabase.ts` (uses `EXPO_PUBLIC_SUPABASE_URL`)

3. **No Code Changes Required:**
   - Frontend uses `EXPO_PUBLIC_SUPABASE_URL` (unchanged)
   - Backend now uses `SUPABASE_PROJECT_URL`

---

## ✅ Verification Checklist

Before deploying, run this command locally:

```bash
node test-env-config.js
```

This will validate that all required environment variables are set correctly.

**Expected output:**
```
✅ All environment variables are configured correctly!
```

---

## 🎉 Success Indicators

After deployment, you should see:

1. ✅ No "supabase_url does not exist" error in build logs
2. ✅ Health endpoint returns `{"status":"ok"}`
3. ✅ Supabase connection works (check any database query endpoint)
4. ✅ Frontend can access API successfully

---

## 📞 Support

If you encounter issues:

1. Check Vercel deployment logs for specific errors
2. Verify all 10 environment variables are set
3. Ensure variables are applied to all environments
4. Try redeploying with `--force` flag

**Project:** Kurdish Cuisine Cashier System  
**Vercel URL:** https://rork-kurdish-cuisine-cashier-system.vercel.app  
**API Health:** https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
