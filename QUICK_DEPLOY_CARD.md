# 🎯 QUICK DEPLOY CARD

**Kurdish Cuisine Cashier System - Production Deployment**

---

## ⚡ 3-Minute Deploy

### 1. Verify Environment (30 seconds)
```bash
node test-env-config.js
```
✅ Expected: "All environment variables are configured correctly!"

---

### 2. Add to Vercel (2 minutes)

**Go to:** Vercel Dashboard → Settings → Environment Variables

**Delete:** `SUPABASE_URL` (if exists)

**Add these 10 variables** (apply to Production, Preview, Development):

```
NODE_ENV=production
SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4
DATABASE_URL=postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres
FRONTEND_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
EXPO_PUBLIC_API_BASE_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
EXPO_PUBLIC_RORK_API_BASE_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
```

---

### 3. Deploy (30 seconds)
```bash
vercel --prod --yes --force
```

---

### 4. Test (30 seconds)
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
```

✅ Expected: `{"status":"ok","timestamp":"..."}`

---

## 🎉 Done!

Your system is live at:
**https://rork-kurdish-cuisine-cashier-system.vercel.app**

---

## 🚨 Quick Fixes

**Error:** "supabase_url does not exist"  
**Fix:** Delete `SUPABASE_URL` from Vercel, ensure `SUPABASE_PROJECT_URL` exists

**Error:** 404 on /api/health  
**Fix:** Check `vercel.json` is at project root with correct routes

**Error:** CORS  
**Fix:** Verify `FRONTEND_URL` matches your Vercel URL

---

📖 **Full Guide:** See `DEPLOY_NOW_FINAL.md`  
📋 **Environment Details:** See `VERCEL_ENV_VARIABLES_FINAL.md`  
📝 **Copy/Paste Values:** See `QUICK_VERCEL_SETUP.txt`
