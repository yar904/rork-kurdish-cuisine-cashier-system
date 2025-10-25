# 🔧 Deployment Issues Fixed

## Issues Identified & Resolved

### 1. ✅ **tRPC Endpoint Mismatch**
**Problem:** Backend was serving tRPC at `/trpc/*` but frontend was calling `/api/trpc/*`

**Fixed:**
- ✅ Updated `backend/hono.ts` to serve at `/api/trpc/*`
- ✅ Updated `backend/index.ts` to serve at `/api/trpc/*`
- ✅ Both backend files now match the frontend expectation

### 2. ✅ **SSR/Web Rendering Issue**
**Problem:** `Platform.OS === 'web'` check in landing page caused SSR hydration issues

**Fixed:**
- ✅ Removed conditional web rendering in `app/landing.tsx`
- ✅ Now uses `ImageBackground` consistently across all platforms
- ✅ Fixed unused imports (Platform, Settings)

### 3. ✅ **Backend Server Configuration**
**Problem:** Inconsistent server setup between index.ts and hono.ts

**Fixed:**
- ✅ Both files now have identical, correct configuration
- ✅ Both serve tRPC at correct endpoint: `/api/trpc/*`
- ✅ Both include all necessary health checks and endpoints
- ✅ CORS configured for production domain

---

## 📋 Deployment Checklist

### Backend Configuration
- ✅ Server entry point: `backend/index.ts` or `backend/hono.ts` (both work)
- ✅ Start command: `bun run start` or `tsx index.ts`
- ✅ Environment variables configured in backend/.env
- ✅ tRPC endpoint: `/api/trpc/*`
- ✅ Health check: `/api/health`
- ✅ Supabase test: `/api/test`
- ✅ CORS configured for production URL

### Environment Variables
Backend needs (in Rork dashboard):
```bash
NODE_ENV=production
SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4
PORT=3000
```

Frontend needs (already in .env):
```bash
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
EXPO_PUBLIC_RORK_API_BASE_URL=https://kurdish-cuisine-cashier-system.rork.app
```

---

## 🚀 How to Deploy on Rork

### Step 1: Configure Backend in Rork Dashboard
1. Go to your project settings in Rork dashboard
2. Set **Server Root Directory**: `backend/`
3. Set **Start Command**: `bun run start`
4. Set **Build Command**: `echo 'No build needed'`
5. Set **Runtime**: Bun

### Step 2: Add Environment Variables
In Rork Dashboard → Environment Variables, add ALL the backend environment variables listed above.

### Step 3: Deploy
1. Click **Publish** in Rork dashboard
2. Wait for deployment to complete
3. Check deployment logs for any errors

### Step 4: Verify Deployment
Test these endpoints:

**Health Check:**
```bash
curl https://kurdish-cuisine-cashier-system.rork.app/api/health
```
Expected: `{"status":"ok","timestamp":"...","environment":"production"}`

**Backend Status:**
```bash
curl https://kurdish-cuisine-cashier-system.rork.app/
```
Expected: `Backend is running ✅`

**Supabase Connection:**
```bash
curl https://kurdish-cuisine-cashier-system.rork.app/api/test
```
Expected: `{"message":"🔥 Rork backend is live and connected to Supabase!","supabaseConnected":true,...}`

**tRPC Endpoint:**
```bash
curl https://kurdish-cuisine-cashier-system.rork.app/api/trpc/menu.getAll
```

---

## 🔍 Troubleshooting

### If you get "snapshot not found" error:
- Check that the backend is running by visiting the health endpoint
- Verify environment variables are set in Rork dashboard (not just local .env)
- Check deployment logs for startup errors
- Ensure the start command is correct: `bun run start`

### If you get 404 errors:
- ✅ **FIXED** - tRPC endpoint was wrong, now corrected to `/api/trpc/*`
- Verify CORS is configured for your production domain
- Check that frontend `EXPO_PUBLIC_RORK_API_BASE_URL` matches your backend URL

### If frontend can't connect to backend:
- Verify `EXPO_PUBLIC_RORK_API_BASE_URL` in .env is correct
- Check browser console for CORS errors
- Test backend health endpoint directly

---

## 📱 Your Live URLs

Once deployed, your app will be available at:

**Frontend (Customer Menu):**
- https://kurdish-cuisine-cashier-system.rork.app/
- https://kurdish-cuisine-cashier-system.rork.app/landing
- https://kurdish-cuisine-cashier-system.rork.app/menu

**Backend API:**
- https://kurdish-cuisine-cashier-system.rork.app/api/health
- https://kurdish-cuisine-cashier-system.rork.app/api/test
- https://kurdish-cuisine-cashier-system.rork.app/api/trpc/[procedure]

**Staff Interfaces:**
- https://kurdish-cuisine-cashier-system.rork.app/staff-login
- https://kurdish-cuisine-cashier-system.rork.app/(tabs)/waiter
- https://kurdish-cuisine-cashier-system.rork.app/(tabs)/kitchen
- https://kurdish-cuisine-cashier-system.rork.app/(tabs)/cashier
- https://kurdish-cuisine-cashier-system.rork.app/(tabs)/admin

---

## ✅ What Was Changed

### Files Modified:
1. **backend/hono.ts** - Fixed tRPC endpoint from `/trpc/*` to `/api/trpc/*`
2. **backend/index.ts** - Fixed tRPC endpoint from `/trpc/*` to `/api/trpc/*`
3. **app/landing.tsx** - Removed Platform.OS check for web rendering

### Files NOT Changed:
- ✅ `.env` - Already correct
- ✅ `backend/.env` - Already correct
- ✅ `lib/trpc.ts` - Already correct
- ✅ All other app files - Already correct

---

## 🎉 Ready to Go Live!

All critical issues have been fixed. Your app should now deploy successfully on Rork.

**Next Steps:**
1. Push changes to GitHub (if not already done)
2. Click Publish in Rork dashboard
3. Test all endpoints after deployment
4. Add menu items via admin interface
5. Test customer ordering flow

**Support:**
If you still encounter issues after deployment:
- Check Rork deployment logs
- Verify all environment variables are set
- Test backend health endpoint first
- Check browser console for frontend errors
