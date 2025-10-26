# ✅ SOLUTION: Fix "Snapshot Not Found" Error

## 🔍 What's Happening

Your app shows "snapshot not found" on `https://kurdish-cuisine-cashier-system.rork.app` because:

1. **Your app has a BACKEND** (Hono + tRPC server)
2. **Rork's deployment snapshot is missing/corrupted**
3. **Backend needs to run on a Node.js server** (can't be static)

## ✅ The Fix (5 Minutes)

### Step 1: Deploy Your Backend

Your backend is in the `/backend` folder and needs to run on a server.

**Use Render.com (FREE)**:

1. Go to: https://render.com
2. Sign up with GitHub
3. Click **"New +"** → **"Web Service"**
4. Select your repository
5. Configure:
   - **Name**: `kurdish-cuisine-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm install -g tsx`
   - **Start Command**: `npx tsx index.ts`
   - **Environment**: Node

6. Add Environment Variables:
   ```
   SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4
   NODE_ENV=production
   PORT=3000
   ```

7. Click **"Create Web Service"**
8. Wait 2-3 minutes
9. You'll get a URL like: `https://kurdish-cuisine-backend.onrender.com`

### Step 2: Test Your Backend

Visit these URLs to confirm it's working:

✅ `https://your-backend.onrender.com/` - Should show version info  
✅ `https://your-backend.onrender.com/api/health` - Should return `{"status":"ok"}`  
✅ `https://your-backend.onrender.com/api/test` - Should test Supabase connection  

### Step 3: Update Your Frontend

In your Rork project, update the `.env` file:

```bash
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend.onrender.com
```

**Replace** `https://your-backend.onrender.com` with your actual Render URL!

### Step 4: Redeploy on Rork

Save the `.env` file and let Rork rebuild. Your app should now work!

---

## 🎉 Done!

Your app is now working with:
- ✅ **Backend** on Render.com
- ✅ **Frontend** on Rork (or Netlify)
- ✅ **Database** on Supabase

---

## 🔀 Alternative: Deploy Frontend to Netlify

If Rork continues having issues, deploy your frontend to Netlify:

1. Go to: https://app.netlify.com
2. Click **"Add new site"** → **"Import an existing project"**
3. Connect your repo
4. Settings:
   - **Build command**: `npx expo export -p web`
   - **Publish directory**: `dist`
5. Add environment variables:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
   EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend.onrender.com
   ```
6. Deploy!

---

## 📊 What You Have Now

```
┌─────────────────────────┐
│   Frontend (Expo Web)   │  ← Users see this
│   Rork/Netlify          │
└──────────┬──────────────┘
           │ API calls
           ↓
┌─────────────────────────┐
│   Backend (Hono+tRPC)   │  ← Handles data
│   Render.com            │
└──────────┬──────────────┘
           │ SQL queries
           ↓
┌─────────────────────────┐
│   Database (Postgres)   │  ← Stores data
│   Supabase              │
└─────────────────────────┘
```

---

## 💰 Cost

**Free tier includes**:
- ✅ Render: Backend hosting (sleeps after 15 min inactivity)
- ✅ Netlify: Frontend hosting (unlimited)
- ✅ Supabase: Database (500MB, 2GB transfer)

**Total: $0/month**

**To prevent backend sleep** (instant response):
- Upgrade Render to $7/month
- Or use Railway.app (~$10/month)

---

## 🆘 Troubleshooting

### Backend not responding
- Check logs on Render dashboard
- Verify environment variables are set
- Make sure PORT is set to 3000

### CORS errors
- Already fixed! Your backend now accepts Netlify, Render, Vercel, Railway URLs
- If needed, add your specific domain to `backend/hono.ts`

### Frontend shows old version
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear Netlify cache and redeploy
- Check if `.env` changes were saved

### Still showing "snapshot not found"
- Contact Rork support
- Or switch to Netlify (see alternative above)

---

## 📚 More Resources

- **Detailed guides**:
  - `QUICK_FIX_DEPLOYMENT.md` - Step-by-step backend deployment
  - `NETLIFY_FULL_STACK_GUIDE.md` - Complete Netlify setup
  - `HOSTING_OPTIONS_COMPARISON.md` - Compare all hosting options

- **Quick reference**:
  - `QUICK_NETLIFY_SETUP.md` - Netlify essentials
  - `railway.json` - Railway config (alternative)

---

## ✅ Success Checklist

After deployment, verify:

- [ ] Backend health check returns OK
- [ ] Frontend loads without errors
- [ ] Menu page displays items
- [ ] Can create orders
- [ ] Kitchen view shows orders
- [ ] Waiter view works
- [ ] Admin panel accessible
- [ ] Order status updates work
- [ ] Data persists (Supabase)

---

## 🎯 Summary

**Problem**: Rork snapshot missing  
**Cause**: Backend needs separate hosting  
**Solution**: Deploy backend to Render.com  
**Time**: 5 minutes  
**Cost**: FREE  

**Your app is ready to go live!** 🚀

---

## Need More Help?

All the files you need are already created:

1. **Start here**: This file (you're reading it!)
2. **Backend setup**: `QUICK_FIX_DEPLOYMENT.md`
3. **Frontend on Netlify**: `NETLIFY_FULL_STACK_GUIDE.md`
4. **Compare options**: `HOSTING_OPTIONS_COMPARISON.md`

**Follow `QUICK_FIX_DEPLOYMENT.md` to get started now!**
