# 🚀 Vercel Deployment Fix Guide
## Kurdish Cuisine Cashier System

---

## ✅ Current Status
- ✅ Code updated: `SUPABASE_PROJECT_URL` instead of `SUPABASE_URL`
- ✅ Backend uses correct environment variables
- ✅ Frontend uses `EXPO_PUBLIC_SUPABASE_URL`
- ✅ API routing configured via `vercel.json`

---

## 🔧 Steps to Fix Deployment

### 1️⃣ Delete .vercel folder (if exists)
```bash
rm -rf .vercel
```

### 2️⃣ Set Environment Variables in Vercel Dashboard

Go to: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/settings/environment-variables

**Delete these if they exist:**
- ❌ `SUPABASE_URL` (any case variation)
- ❌ `supabase_url`
- ❌ Any lowercase secret references

**Add/Update these variables (Production, Preview, Development):**

```env
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

### 3️⃣ Verify Project Settings

In Vercel Project Settings:
- **Framework Preset:** Other
- **Root Directory:** `./` (empty or root)
- **Build Command:** (leave default)
- **Output Directory:** (leave default)
- **Install Command:** `npm install` or `bun install`

### 4️⃣ Re-link and Deploy

```bash
# Re-link project
vercel link

# Deploy with force flag (clears cache)
vercel --prod --force --yes
```

### 5️⃣ Test Deployment

```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX..."
}
```

---

## 🐛 Troubleshooting

### Issue: "Environment Variable references Secret that does not exist"
**Solution:** Delete ALL variants of the variable in Vercel (check lowercase, uppercase, etc.), then re-add with correct uppercase name.

### Issue: 404 on /api/health
**Solution:** 
- Verify `vercel.json` is at project root
- Verify `api/index.ts` exists and exports from `backend/api/index`
- Check Vercel logs for routing errors

### Issue: CORS errors
**Solution:** Ensure `FRONTEND_URL` is set correctly in environment variables

### Issue: Supabase connection fails
**Solution:** 
- Verify `SUPABASE_PROJECT_URL` (not `SUPABASE_URL`)
- Check that keys are correct and not wrapped in quotes
- Ensure variables are applied to all environments

---

## 📋 Deployment Checklist

- [ ] Deleted `.vercel` folder locally
- [ ] Removed old `SUPABASE_URL` from Vercel dashboard
- [ ] Added all environment variables with uppercase names
- [ ] Applied variables to Production, Preview, Development
- [ ] Re-linked project with `vercel link`
- [ ] Deployed with `vercel --prod --force --yes`
- [ ] Tested `/api/health` endpoint
- [ ] Verified Supabase connection works

---

## 🎯 Quick Deploy Command

```bash
# One-command deploy after fixing environment variables
vercel --prod --force --yes && curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
```

---

**Last Updated:** 2025-01-25  
**Status:** Ready for deployment ✅
