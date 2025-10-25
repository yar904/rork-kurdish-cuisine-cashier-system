# 🚀 Quick Deployment Guide
## Kurdish Cuisine Cashier System - Vercel

---

## ⚡ 3-Minute Setup

### 1. Clean Local Cache (5 seconds)
```bash
rm -rf .vercel
```

### 2. Set Vercel Environment Variables (2 minutes)

**Go to:** https://vercel.com/dashboard → Your Project → Settings → Environment Variables

**Delete if exists:**
- ❌ `SUPABASE_URL`
- ❌ `supabase_url`

**Copy from:** `VERCEL_ENV_COPY_PASTE.txt`

**Add 10 variables** (apply to Production + Preview + Development):
1. `NODE_ENV` = `production`
2. `SUPABASE_PROJECT_URL` = `https://oqspnszwjxzyvwqjvjiy.supabase.co`
3. `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
4. `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
5. `DATABASE_URL` = `postgresql://Farman12Tapse@db...`
6. `FRONTEND_URL` = `https://rork-kurdish-cuisine-cashier-system.vercel.app`
7. `EXPO_PUBLIC_SUPABASE_URL` = `https://oqspnszwjxzyvwqjvjiy.supabase.co`
8. `EXPO_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
9. `EXPO_PUBLIC_API_BASE_URL` = `https://rork-kurdish-cuisine-cashier-system.vercel.app`
10. `EXPO_PUBLIC_RORK_API_BASE_URL` = `https://rork-kurdish-cuisine-cashier-system.vercel.app`

### 3. Deploy (30 seconds)

**Automated (Recommended):**
```bash
bash DEPLOY_NOW.sh
```

**Manual:**
```bash
vercel --prod --force --yes
```

### 4. Test (10 seconds)
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
```

**Expected:**
```json
{"status":"ok","timestamp":"2025-01-25T..."}
```

---

## 🐛 Common Issues

| Issue | Fix |
|-------|-----|
| "Secret 'supabase_url' does not exist" | Delete old `SUPABASE_URL` variable in Vercel |
| 404 on `/api/health` | Check `vercel.json` is at project root |
| CORS errors | Verify `FRONTEND_URL` is set correctly |
| Deployment fails | Run `vercel --prod --force --yes` |

---

## ✅ Success Indicators

- ✅ Build completes without "Secret does not exist" errors
- ✅ `/api/health` returns `{"status":"ok"}`
- ✅ No 404 or 500 errors in Vercel logs
- ✅ Supabase connection works

---

## 📞 Need Help?

1. Check `VERCEL_DEPLOYMENT_FIX.md` for detailed steps
2. Review Vercel deployment logs
3. Verify all environment variables are uppercase
4. Ensure variables are applied to all environments

---

**Ready to deploy?** → `bash DEPLOY_NOW.sh`
