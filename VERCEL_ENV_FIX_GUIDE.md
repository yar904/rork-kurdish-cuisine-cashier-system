# 🚀 Vercel Environment Fix & Deployment Guide

## ✅ Current Environment Variables (All Uppercase)

Based on your project files, here are ALL the environment variables that need to be in Vercel:

### Backend Variables (Required for API)
```
NODE_ENV=production
SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4
DATABASE_URL=postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres
FRONTEND_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
```

### Frontend/Expo Variables (Required for Client)
```
EXPO_PUBLIC_RORK_API_BASE_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
EXPO_PUBLIC_API_BASE_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
```

---

## 🔧 Step-by-Step Fix Instructions

### 1️⃣ Clean Up Vercel Environment Variables

Go to: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/settings/environment-variables

**DELETE these if they exist (lowercase/incorrect):**
- `supabase_url`
- `supabase_anon_key`
- `supabase_service_role_key`
- `frontend_url`
- Any other lowercase variants

### 2️⃣ Add All Environment Variables (Uppercase)

For EACH variable below, click **"Add New"** and:
- Enter the **Key** (variable name)
- Enter the **Value** (from above)
- Select environments: **Production**, **Preview**, **Development** (all three)
- Click **Save**

**Variables to add:**

1. `NODE_ENV` → `production`
2. `SUPABASE_URL` → `https://oqspnszwjxzyvwqjvjiy.supabase.co`
3. `SUPABASE_ANON_KEY` → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k`
4. `SUPABASE_SERVICE_ROLE_KEY` → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4`
5. `DATABASE_URL` → `postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres`
6. `FRONTEND_URL` → `https://rork-kurdish-cuisine-cashier-system.vercel.app`
7. `EXPO_PUBLIC_RORK_API_BASE_URL` → `https://rork-kurdish-cuisine-cashier-system.vercel.app`
8. `EXPO_PUBLIC_SUPABASE_URL` → `https://oqspnszwjxzyvwqjvjiy.supabase.co`
9. `EXPO_PUBLIC_SUPABASE_ANON_KEY` → `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k`
10. `EXPO_PUBLIC_API_BASE_URL` → `https://rork-kurdish-cuisine-cashier-system.vercel.app`

### 3️⃣ Verify Vercel Project Settings

Go to: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/settings

Check:
- ✅ **Root Directory**: Leave empty (or set to `./` if prompted)
- ✅ **Framework Preset**: Other
- ✅ **Build Command**: `npm run build` or leave empty
- ✅ **Output Directory**: Leave empty
- ✅ **Install Command**: `npm install`
- ✅ **Node.js Version**: 20.x

### 4️⃣ Trigger a Fresh Deployment

**Option A: From Vercel Dashboard**
1. Go to: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system
2. Click **"Deployments"** tab
3. Click **"Redeploy"** on the latest deployment
4. Check **"Use existing Build Cache"** → **NO** (uncheck it)
5. Click **"Redeploy"**

**Option B: From Terminal (if you have Vercel CLI)**
```bash
cd /path/to/your/project
vercel --prod --force
```

### 5️⃣ Test Your Deployment

After deployment completes (2-3 minutes), test these endpoints:

**Health Check:**
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-XX..."
}
```

**Root Check:**
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api
```

Expected response:
```
✅ Kurdish Cuisine API running on Vercel Edge Runtime
```

---

## 🐛 Troubleshooting

### If you see "Missing environment variable" errors:
1. Double-check all variables are added in Vercel
2. Ensure they're applied to **Production** environment
3. Redeploy with **fresh build** (no cache)

### If /api/health returns 404:
1. Check Root Directory setting (should be empty or `./`)
2. Verify `backend/api/index.ts` exists
3. Check deployment logs for build errors

### If Supabase connection fails:
1. Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
2. Test Supabase connection directly:
   ```bash
   curl https://oqspnszwjxzyvwqjvjiy.supabase.co/rest/v1/
   ```

---

## ✅ Final Checklist

- [ ] Removed all lowercase/stale environment variables from Vercel
- [ ] Added all 10 uppercase environment variables
- [ ] Applied variables to Production, Preview, and Development
- [ ] Root Directory is empty or `./`
- [ ] Redeployed with fresh build (no cache)
- [ ] `/api/health` returns `{"status":"ok"}`
- [ ] `/api` returns success message
- [ ] Frontend loads at root URL

---

## 🎯 Quick Copy-Paste for Vercel

If Vercel supports bulk import, use this format:

```
NODE_ENV=production
SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4
DATABASE_URL=postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres
FRONTEND_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
EXPO_PUBLIC_RORK_API_BASE_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
EXPO_PUBLIC_API_BASE_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
```

---

**🚀 Ready to launch! Follow these steps and your Kurdish Cuisine Cashier System will be live today!**
