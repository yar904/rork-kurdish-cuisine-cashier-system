# 🚀 DEPLOY NOW - Final Checklist

**Date:** 2025-10-25  
**Status:** ✅ READY TO DEPLOY  
**Project:** Kurdish Cuisine Cashier System

---

## ✅ Pre-Deployment Verification

### Code Status
- ✅ `SUPABASE_URL` → `SUPABASE_PROJECT_URL` (renamed everywhere)
- ✅ All .env files updated
- ✅ Backend uses `SUPABASE_PROJECT_URL`
- ✅ Frontend uses `EXPO_PUBLIC_SUPABASE_URL` (unchanged)
- ✅ No code references to old `SUPABASE_URL`

### Files Ready
- ✅ `.env` (root) - configured
- ✅ `backend/.env` - configured
- ✅ `api/index.ts` - exports backend API
- ✅ `vercel.json` - routing configured
- ✅ `backend/api/index.ts` - Hono API with health check

---

## 🎯 Deployment Steps

### Step 1: Verify Local Environment

Run this command to validate your local environment configuration:

```bash
node test-env-config.js
```

**Expected Output:**
```
✅ All environment variables are configured correctly!
```

If any errors appear, fix them before proceeding.

---

### Step 2: Add Environment Variables to Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

#### Delete Old Variables (if they exist):
- ❌ `SUPABASE_URL`
- ❌ `supabase_url`

#### Add These 10 Variables:

Use the values from `QUICK_VERCEL_SETUP.txt` or copy directly from below:

1. **NODE_ENV**
   - Value: `production`
   - Apply to: ✅ Production, ✅ Preview, ✅ Development

2. **SUPABASE_PROJECT_URL**
   - Value: `https://oqspnszwjxzyvwqjvjiy.supabase.co`
   - Apply to: ✅ Production, ✅ Preview, ✅ Development

3. **SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k`
   - Apply to: ✅ Production, ✅ Preview, ✅ Development

4. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4`
   - Apply to: ✅ Production, ✅ Preview, ✅ Development

5. **DATABASE_URL**
   - Value: `postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres`
   - Apply to: ✅ Production, ✅ Preview, ✅ Development

6. **FRONTEND_URL**
   - Value: `https://rork-kurdish-cuisine-cashier-system.vercel.app`
   - Apply to: ✅ Production, ✅ Preview, ✅ Development

7. **EXPO_PUBLIC_SUPABASE_URL**
   - Value: `https://oqspnszwjxzyvwqjvjiy.supabase.co`
   - Apply to: ✅ Production, ✅ Preview, ✅ Development

8. **EXPO_PUBLIC_SUPABASE_ANON_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k`
   - Apply to: ✅ Production, ✅ Preview, ✅ Development

9. **EXPO_PUBLIC_API_BASE_URL**
   - Value: `https://rork-kurdish-cuisine-cashier-system.vercel.app`
   - Apply to: ✅ Production, ✅ Preview, ✅ Development

10. **EXPO_PUBLIC_RORK_API_BASE_URL**
    - Value: `https://rork-kurdish-cuisine-cashier-system.vercel.app`
    - Apply to: ✅ Production, ✅ Preview, ✅ Development

---

### Step 3: Verify Variables Are Set

Before deploying, double-check in Vercel:

**Settings → Environment Variables**

Confirm you see all 10 variables listed with checkmarks for:
- ✅ Production
- ✅ Preview  
- ✅ Development

---

### Step 4: Deploy to Production

#### Option A - CLI (Recommended):

```bash
vercel --prod --yes --force
```

This will:
- Use production configuration
- Skip confirmation prompts
- Force a fresh build (no cache)

#### Option B - Vercel Dashboard:

1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
3. Uncheck **"Use existing Build Cache"**
4. Click **"Redeploy"**

**Expected Build Time:** 3-5 minutes

---

### Step 5: Monitor Deployment

Watch the build logs for:
- ✅ No "Environment Variable references Secret which does not exist" errors
- ✅ Build completes successfully
- ✅ Functions deployed
- ✅ Deployment URL available

---

### Step 6: Test Deployment

Once deployment is complete, run these tests:

#### 1. Health Check
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

#### 2. Test tRPC Connection
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/trpc/example.hi
```

**Expected:** Valid tRPC response (not a 404)

#### 3. Test Database Connection
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/trpc/tables.getAll
```

**Expected:** JSON array of tables or empty array `[]`

---

## ✅ Success Indicators

Your deployment is successful when:

1. ✅ Build completes with no environment variable errors
2. ✅ Health endpoint returns `{"status":"ok"}`
3. ✅ No 404 errors on /api routes
4. ✅ Supabase connection works (database queries succeed)
5. ✅ CORS is configured (frontend can access API)

---

## 🚨 Troubleshooting

### Issue: "supabase_url does not exist"

**Fix:**
1. Ensure `SUPABASE_URL` is completely deleted from Vercel
2. Verify `SUPABASE_PROJECT_URL` exists instead
3. Check it's applied to all environments
4. Redeploy with `--force`

### Issue: 404 on /api/health

**Fix:**
1. Verify `api/index.ts` exists at project root
2. Check `vercel.json` is at project root
3. Ensure `vercel.json` contains correct routes:
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

**Fix:**
1. Verify `FRONTEND_URL` matches your Vercel deployment URL
2. Check `backend/api/index.ts` includes CORS configuration
3. Ensure origin includes your deployment URL

### Issue: Supabase connection fails

**Fix:**
1. Test Supabase credentials directly:
   ```bash
   curl https://oqspnszwjxzyvwqjvjiy.supabase.co/rest/v1/
   ```
2. Verify `SUPABASE_PROJECT_URL` and keys are correct
3. Check Supabase project is active and accessible

---

## 📋 Post-Deployment Checklist

After successful deployment:

- [ ] Health endpoint responds correctly
- [ ] API routes are accessible
- [ ] Database queries work
- [ ] Frontend can connect to API
- [ ] No console errors in browser
- [ ] Mobile app can connect (if testing on device)

---

## 🎉 You're Live!

Once all tests pass:

**Production URL:**  
https://rork-kurdish-cuisine-cashier-system.vercel.app

**API Health:**  
https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health

**tRPC Endpoint:**  
https://rork-kurdish-cuisine-cashier-system.vercel.app/api/trpc

---

## 📞 Need Help?

If deployment fails after following these steps:

1. Check Vercel deployment logs for specific errors
2. Verify all 10 environment variables are set correctly
3. Ensure variables are applied to all 3 environments
4. Try a fresh deployment with `--force` flag
5. Review `VERCEL_ENV_VARIABLES_FINAL.md` for detailed troubleshooting

---

**Ready to deploy?** Follow the steps above and your system will be live in 5 minutes! 🚀
