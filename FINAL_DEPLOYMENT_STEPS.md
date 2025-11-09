# 🚀 Final Deployment Steps - Kurdish Cuisine Cashier System

## ✅ Pre-Deployment Checklist

### 1. Environment Variables Status
- ✅ Root `.env` configured with production URLs
- ✅ Backend `.env` configured with Supabase credentials
- ✅ All keys are UPPERCASE format
- ✅ Production URL: `https://rork-kurdish-cuisine-cashier-system.vercel.app`

---

## 🔧 Vercel Configuration Steps

### Step 1: Clean Up Old Variables (2 mins)

Go to: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/settings/environment-variables

**Delete any lowercase or @ variables:**
- ❌ `supabase_url`
- ❌ `supabase_anon_key`
- ❌ `@supabase_url`
- ❌ `@frontend_url`
- ❌ Any other @ or lowercase variants

### Step 2: Add All 10 Variables (5 mins)

For each variable, click **"Add New"** → Enter Key & Value → Select **All Environments** (Production, Preview, Development) → **Save**

**Copy these exactly:**

```
NODE_ENV
```
Value: `production`

```
SUPABASE_URL
```
Value: `https://oqspnszwjxzyvwqjvjiy.supabase.co`

```
SUPABASE_ANON_KEY
```
Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k`

```
SUPABASE_SERVICE_ROLE_KEY
```
Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4`

```
DATABASE_URL
```
Value: `postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres`

```
FRONTEND_URL
```
Value: `https://rork-kurdish-cuisine-cashier-system.vercel.app`

```
EXPO_PUBLIC_RORK_API_BASE_URL
```
Value: `https://rork-kurdish-cuisine-cashier-system.vercel.app`

```
EXPO_PUBLIC_SUPABASE_URL
```
Value: `https://oqspnszwjxzyvwqjvjiy.supabase.co`

```
EXPO_PUBLIC_SUPABASE_ANON_KEY
```
Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k`

```
EXPO_PUBLIC_API_BASE_URL
```
Value: `https://rork-kurdish-cuisine-cashier-system.vercel.app`

### Step 3: Verify Project Settings

Go to: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/settings

**Build & Development Settings:**
- Framework Preset: `Other`
- Root Directory: **Leave empty** or `./`
- Build Command: **Leave empty** (auto-detect)
- Output Directory: **Leave empty**
- Install Command: `npm install`
- Node.js Version: `20.x`

**Save changes if any were modified.**

### Step 4: Trigger Fresh Deployment

**Option A: Redeploy from Dashboard (Recommended)**

1. Go to: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system
2. Click **"Deployments"** tab
3. Find the latest deployment
4. Click the **three dots (⋮)** menu
5. Select **"Redeploy"**
6. **Uncheck** "Use existing Build Cache" 
7. Click **"Redeploy"** button
8. Wait 2-3 minutes for deployment

**Option B: Push to Git (if connected)**

```bash
git add .
git commit -m "Fix environment variables for production"
git push origin main
```

---

## 🧪 Testing Your Deployment (2 mins)

### Test 1: Health Check

Open terminal and run:
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-25T..."
}
```

### Test 2: API Root

```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api
```

**Expected Response:**
```
✅ Kurdish Cuisine API running on Vercel Edge Runtime
```

### Test 3: tRPC Endpoint

```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/trpc/example.hi
```

**Expected:** tRPC response (not 404)

### Test 4: Frontend

Open browser: https://rork-kurdish-cuisine-cashier-system.vercel.app

**Expected:** Your app loads without console errors

---

## 🐛 Troubleshooting

### ❌ "Missing environment variable: SUPABASE_URL"

**Solution:**
1. Go back to Vercel Environment Variables
2. Verify `SUPABASE_URL` is added
3. Check it's applied to **Production** environment
4. Redeploy with **no cache**

### ❌ 404 Not Found on /api/health

**Solution:**
1. Check Vercel logs: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/logs
2. Verify Root Directory is **empty** or `./`
3. Check that `backend/api/index.ts` exists in your repo
4. Redeploy

### ❌ CORS Errors

**Solution:**
Your `backend/api/index.ts` already has CORS configured. If you still see errors:
1. Check browser console for the exact error
2. Verify `FRONTEND_URL` matches your actual deployment URL
3. Clear browser cache

### ❌ Supabase Connection Failed

**Solution:**
1. Test Supabase directly:
   ```bash
   curl https://oqspnszwjxzyvwqjvjiy.supabase.co/rest/v1/
   ```
2. If that works, check your environment variables again
3. Verify `SUPABASE_ANON_KEY` has no extra spaces

---

## ✅ Success Checklist

- [ ] All 10 environment variables added to Vercel
- [ ] Variables applied to Production, Preview, Development
- [ ] Root Directory setting verified
- [ ] Fresh deployment triggered (no cache)
- [ ] `/api/health` returns `{"status":"ok"}`
- [ ] `/api` shows success message
- [ ] Frontend loads at root URL
- [ ] No console errors in browser

---

## 🎉 You're Live!

Once all tests pass, your Kurdish Cuisine Cashier System is **production-ready**!

**Share your app:**
- Production URL: https://rork-kurdish-cuisine-cashier-system.vercel.app
- API Health: https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
- Admin Panel: https://rork-kurdish-cuisine-cashier-system.vercel.app/menu-management

---

## 📊 Monitoring

**Check deployment status:**
- Vercel Dashboard: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system
- Real-time logs: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/logs
- Analytics: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/analytics

**If you need help:**
1. Check deployment logs in Vercel
2. Look at browser console for frontend errors
3. Test API endpoints individually
4. Verify environment variables are all uppercase

---

**🚀 Ready to launch! Follow these steps in order and you'll be live in 10 minutes!**
