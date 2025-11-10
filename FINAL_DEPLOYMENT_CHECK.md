# 🚀 Final Deployment Checklist - Kurdish Cuisine System

## ✅ Completed Setup

### Environment Variables (Root `.env`)
- ✅ `EXPO_PUBLIC_RORK_API_BASE_URL` → Points to Vercel backend
- ✅ `EXPO_PUBLIC_SUPABASE_URL` → Configured
- ✅ `EXPO_PUBLIC_SUPABASE_ANON_KEY` → Configured
- ✅ `FRONTEND_URL` → Configured

### Backend Environment (`backend/.env`)
- ✅ `NODE_ENV=production`
- ✅ `SUPABASE_URL` → Configured
- ✅ `SUPABASE_ANON_KEY` → Configured
- ✅ `SUPABASE_SERVICE_ROLE_KEY` → Configured
- ✅ `DATABASE_URL` → PostgreSQL connection string
- ✅ `FRONTEND_URL` → Vercel frontend URL

### Backend Configuration
- ✅ `backend/api/index.ts` → Hono + tRPC server configured
- ✅ `backend/vercel.json` → Deployment config ready
- ✅ CORS configured for localhost:3000, localhost:8081, and production

---

## 🔧 Required Actions Before Deployment

### 1. Install Missing Backend Dependencies
```bash
cd backend
npm install @trpc/server@^11.0.0 superjson@^2.2.1
cd ..
```

### 2. Verify Supabase URL Consistency
⚠️ **Check your Supabase project URL** - I see two different subdomains in your files:
- Root `.env`: `oqspnszwjxzyvwqjvjiy`
- Backend `.env`: `opsnszw...` (different in reference)

**Action Required**: Verify which is correct by logging into Supabase dashboard and update both files to match.

### 3. Set Environment Variables in Vercel

Go to your Vercel project → Settings → Environment Variables and add:

**For All Environments** (Production, Preview, Development):
```
NODE_ENV=production
SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4
DATABASE_URL=postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres
FRONTEND_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
```

### 4. Configure Vercel Project Settings

**For Backend Deployment**:
- Root Directory: `backend`
- Build Command: `npm run vercel-build`
- Install Command: `npm install`
- Output Directory: (leave empty)
- Node.js Version: **20.x**

**For Frontend Deployment** (if separate):
- Root Directory: `.` (root)
- Build Command: `expo export -p web`
- Install Command: `npm install`
- Output Directory: `dist`

---

## 🧪 Testing Steps After Deployment

### Backend Tests
1. **Health Check**: Visit `https://your-backend.vercel.app/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Root Endpoint**: Visit `https://your-backend.vercel.app/api`
   - Should return: "✅ Kurdish Cuisine API running on Vercel Edge Runtime"

3. **tRPC Endpoint**: Visit `https://your-backend.vercel.app/api/trpc`
   - Should not error (tRPC endpoint active)

### Frontend Tests
1. Open your Vercel frontend URL
2. Navigate to `/menu-management` - should load menu items from Supabase
3. Navigate to `/cashier` - should show POS interface
4. Navigate to `/kitchen` - should show kitchen orders
5. Navigate to `/waiter` - should show table management

### Database Connection Test
1. Try adding a menu item from `/menu-management`
2. Verify it appears in Supabase dashboard
3. Check if real-time updates work (if implemented)

---

## 🚨 Common Issues & Fixes

### Issue: "Network request failed"
**Fix**: Check CORS settings in `backend/api/index.ts` - now includes localhost:8081

### Issue: "Supabase credentials invalid"
**Fix**: Verify Supabase URL subdomain matches exactly in all files

### Issue: "tRPC endpoint not found"
**Fix**: Ensure `@trpc/server` and `superjson` are installed in backend

### Issue: "Runtime error on Vercel"
**Fix**: Verify `export const config = { runtime: 'edge' }` is present in `backend/api/index.ts`

### Issue: Environment variables not loading
**Fix**: In Vercel, redeploy after adding environment variables

---

## 📦 Deployment Commands

### Deploy Backend to Vercel
```bash
cd backend
vercel --prod
```

### Deploy Frontend to Vercel
```bash
vercel --prod
```

### Or Deploy Both (from root)
```bash
vercel --prod
```

---

## ✨ Post-Deployment Checklist

- [ ] Backend health endpoint returns OK
- [ ] Frontend loads without errors
- [ ] Menu management CRUD operations work
- [ ] Orders can be created from cashier
- [ ] Kitchen receives orders
- [ ] Waiter can manage tables
- [ ] Real-time updates work (if enabled)
- [ ] All Supabase queries execute successfully
- [ ] No CORS errors in browser console
- [ ] Mobile responsive design works
- [ ] Analytics page loads data

---

## 🎯 Missing Dependencies Alert

Before deploying, run:
```bash
cd backend
npm install @trpc/server superjson
npm install
```

This ensures tRPC server and data transformer are available in production.

---

## 📞 Support

If deployment fails:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables in Vercel dashboard
4. Test backend `/api/health` endpoint independently
5. Check Supabase logs for connection issues

---

**Ready to deploy?** Complete steps 1-4 above, then push to your Git repository. Vercel will auto-deploy! 🚀
