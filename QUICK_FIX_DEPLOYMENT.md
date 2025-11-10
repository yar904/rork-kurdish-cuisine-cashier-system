# 🚀 Quick Fix for "Snapshot Not Found" Error

## The Problem

Your app consists of:
1. **Frontend (Expo)** → Currently trying to deploy on Rork
2. **Backend (Hono + tRPC)** → Needs to run separately

The "snapshot not found" error is a **Rork platform issue**, not your code.

---

## ✅ Fastest Solution (5 Minutes)

### Deploy Backend to Render.com (Free)

1. **Go to Render.com**
   - Visit: https://render.com
   - Sign up/Login with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Select your repository
   - **Name**: kurdish-cuisine-backend
   - **Region**: Choose closest to you
   - **Branch**: main (or your default branch)
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: 
     ```
     npm install && npm install -g tsx
     ```
   - **Start Command**: 
     ```
     npx tsx index.ts
     ```

3. **Add Environment Variables** (click "Environment")
   ```
   SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4
   NODE_ENV=production
   PORT=3000
   ```

4. **Click "Create Web Service"**
   - Wait 2-3 minutes for deployment
   - You'll get a URL like: `https://kurdish-cuisine-backend.onrender.com`

5. **Test Backend**
   - Visit: `https://your-backend.onrender.com/api/health`
   - Should see: `{"status":"ok",...}`

---

### Update Frontend on Rork

1. **Update `.env` file** in your Rork project:
   ```bash
   EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend.onrender.com
   ```

2. **Update `backend/hono.ts`** - Add your frontend URL to CORS:
   ```typescript
   app.use("*", cors({
     origin: (origin) => {
       const allowedOrigins = [
         "https://kurdish-cuisine-cashier-system.rork.app",
         "https://your-backend.onrender.com",  // Add your backend URL
         "http://localhost:8081",
         "http://localhost:3000",
       ];
       // ... rest of CORS config
     }
   }));
   ```

3. **Redeploy** on Rork
   - The app should now connect to your Render backend
   - No more snapshot errors!

---

## Alternative: Deploy Frontend to Netlify

If Rork continues having issues:

### 1. Build Your Frontend Locally
```bash
npx expo export -p web
```

This creates a `dist/` folder with your built app.

### 2. Deploy to Netlify

**Option A: Drag & Drop (Fastest)**
1. Go to https://app.netlify.com/drop
2. Drag the `dist/` folder
3. Done!

**Option B: GitHub Integration**
1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect your repo
4. Settings:
   - **Build command**: `npx expo export -p web`
   - **Publish directory**: `dist`
5. Add environment variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend.onrender.com
   ```
6. Deploy!

---

## 🎯 Summary

**Current Setup:**
- ❌ Frontend trying to deploy on Rork (snapshot errors)
- ❌ Backend not deployed

**Fixed Setup:**
- ✅ Backend on Render.com (always running)
- ✅ Frontend on Netlify OR Rork (static files)
- ✅ Both communicate via API

---

## ✅ Verification Checklist

After deployment, test these URLs:

**Backend:**
- [ ] `https://your-backend.onrender.com/` → Shows version info
- [ ] `https://your-backend.onrender.com/api/health` → Returns `{"status":"ok"}`
- [ ] `https://your-backend.onrender.com/api/test` → Tests Supabase connection
- [ ] `https://your-backend.onrender.com/api/trpc` → tRPC endpoint

**Frontend:**
- [ ] Menu page loads
- [ ] Can add items to cart
- [ ] Kitchen view shows orders
- [ ] Waiter view works
- [ ] Admin panel accessible
- [ ] Analytics dashboard loads

---

## 🔥 Pro Tip

Render's free tier sleeps after 15 minutes of inactivity. When someone visits your app:
- First request might be slow (30 seconds) - backend waking up
- Subsequent requests are fast

**Upgrade to $7/month** to keep it always running.

---

## 🆘 Still Having Issues?

1. **Check backend logs**: Render.com → Your service → Logs tab
2. **Check frontend console**: Browser DevTools → Console tab
3. **Verify CORS**: Make sure backend allows your frontend URL
4. **Check env vars**: All `EXPO_PUBLIC_*` variables set in Netlify

---

## 📞 Contact Support

**Rork Issues**: Contact Rork support about snapshot restore
**Render Issues**: Check Render status page or logs
**Netlify Issues**: Check Netlify deploy logs

Your code is **100% ready** - you just need proper hosting! 🚀
