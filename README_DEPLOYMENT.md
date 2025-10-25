# 🚀 Vercel Deployment Guide
## Kurdish Cuisine Cashier System

> **Status:** ✅ Ready for Production  
> **Last Updated:** January 25, 2025

---

## 📚 Table of Contents

1. [Quick Start](#-quick-start) (3 minutes)
2. [Files Overview](#-files-overview)
3. [Step-by-Step Guide](#-step-by-step-guide)
4. [Verification](#-verification)
5. [Troubleshooting](#-troubleshooting)

---

## ⚡ Quick Start

### Prerequisites
- Vercel account connected to your project
- Terminal access
- 3 minutes of time

### One-Command Deployment

**Linux/Mac:**
```bash
bash verify-env.sh && bash DEPLOY_NOW.sh
```

**Windows:**
```powershell
.\DEPLOY_NOW.ps1
```

---

## 📁 Files Overview

| File | Purpose | When to Use |
|------|---------|-------------|
| `DEPLOYMENT_QUICK_START.md` | 3-minute guide | Quick reference |
| `DEPLOYMENT_SUMMARY.md` | Complete overview | Understanding the setup |
| `VERCEL_DEPLOYMENT_FIX.md` | Detailed instructions | Troubleshooting |
| `VERCEL_ENV_COPY_PASTE.txt` | Environment variables | Copy/paste into Vercel |
| `DEPLOY_NOW.sh` | Automated deployment | Linux/Mac deployment |
| `DEPLOY_NOW.ps1` | Automated deployment | Windows deployment |
| `verify-env.sh` | Pre-deployment check | Before deploying |

---

## 📋 Step-by-Step Guide

### Step 1: Verify Local Setup (30 seconds)

```bash
bash verify-env.sh
```

**Expected Output:**
```
✅ .env exists
✅ backend/.env exists
✅ SUPABASE_PROJECT_URL found
✅ No old SUPABASE_URL variable
✅ All checks passed!
```

### Step 2: Configure Vercel (2 minutes)

1. **Open Vercel Dashboard:**
   - Go to: https://vercel.com/dashboard
   - Select: `rork-kurdish-cuisine-cashier-system`
   - Navigate to: Settings → Environment Variables

2. **Delete Old Variables:**
   - Remove `SUPABASE_URL` (if exists)
   - Remove `supabase_url` (if exists)
   - Remove any lowercase variants

3. **Add New Variables:**
   - Open `VERCEL_ENV_COPY_PASTE.txt`
   - Copy/paste each variable
   - Apply to: **Production + Preview + Development**
   - Click Save after each variable

**Required Variables:**
```
✅ NODE_ENV
✅ SUPABASE_PROJECT_URL
✅ SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ DATABASE_URL
✅ FRONTEND_URL
✅ EXPO_PUBLIC_SUPABASE_URL
✅ EXPO_PUBLIC_SUPABASE_ANON_KEY
✅ EXPO_PUBLIC_API_BASE_URL
✅ EXPO_PUBLIC_RORK_API_BASE_URL
```

### Step 3: Deploy (30 seconds)

**Automated:**
```bash
bash DEPLOY_NOW.sh
```

**Manual:**
```bash
# Clean cache
rm -rf .vercel

# Deploy
vercel --prod --force --yes
```

### Step 4: Verify (10 seconds)

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

---

## ✅ Verification

### Health Check
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
```

### API Root
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/
```

### tRPC Endpoint
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/trpc/example.hi
```

---

## 🐛 Troubleshooting

### Problem: "Secret 'supabase_url' does not exist"

**Cause:** Vercel has lowercase secret reference

**Solution:**
1. Delete all `SUPABASE_URL` variants in Vercel
2. Add `SUPABASE_PROJECT_URL` instead
3. Redeploy with `--force` flag

### Problem: 404 on `/api/health`

**Cause:** Routing configuration issue

**Solution:**
1. Verify `vercel.json` is at project root
2. Check `api/index.ts` exports correctly
3. Review Vercel deployment logs

### Problem: CORS errors

**Cause:** Frontend URL not whitelisted

**Solution:**
1. Verify `FRONTEND_URL` in Vercel environment variables
2. Check `backend/api/index.ts` CORS configuration

### Problem: Build fails

**Cause:** Various issues

**Solution:**
1. Delete `.vercel` folder: `rm -rf .vercel`
2. Re-link: `vercel link`
3. Deploy: `vercel --prod --force --yes`

### Problem: Environment variables not loading

**Cause:** Not applied to all environments

**Solution:**
1. Go to Vercel → Settings → Environment Variables
2. For each variable, ensure:
   - ✅ Production checked
   - ✅ Preview checked
   - ✅ Development checked
3. Click Update
4. Redeploy

---

## 📊 Deployment Checklist

Before deploying, verify:

- [ ] Ran `verify-env.sh` successfully
- [ ] No `SUPABASE_URL` in Vercel dashboard
- [ ] All 10 environment variables added to Vercel
- [ ] Variables applied to all environments
- [ ] No syntax errors in code
- [ ] `vercel.json` at project root
- [ ] `api/index.ts` exists
- [ ] `backend/api/index.ts` exists

After deploying:

- [ ] Build completed without errors
- [ ] No "Secret does not exist" in logs
- [ ] `/api/health` returns `{"status":"ok"}`
- [ ] No 404 or 500 errors
- [ ] Frontend can connect to backend

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ **Build completes** without secret errors  
✅ **Health endpoint** returns OK status  
✅ **API responds** to requests  
✅ **tRPC procedures** are accessible  
✅ **Supabase connection** works  
✅ **Frontend** can communicate with backend  

---

## 📞 Support

If you encounter issues:

1. **Review Logs:**
   - Vercel Dashboard → Deployments → [Latest] → Logs

2. **Check Documentation:**
   - `VERCEL_DEPLOYMENT_FIX.md` - Detailed troubleshooting
   - `DEPLOYMENT_SUMMARY.md` - Complete overview

3. **Verify Configuration:**
   - Run `verify-env.sh`
   - Check Vercel environment variables

4. **Test Locally:**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

---

## 🎉 Post-Deployment

After successful deployment:

1. **Test All Features:**
   - Menu management
   - Order creation
   - Table management
   - Reports

2. **Monitor Performance:**
   - Check Vercel analytics
   - Review error logs

3. **Update DNS (if using custom domain):**
   - Add A/CNAME records
   - Verify SSL certificate

4. **Share Access:**
   - Provide URL to team
   - Set up user accounts

---

**Ready to deploy?**

```bash
bash verify-env.sh && bash DEPLOY_NOW.sh
```

---

**Questions?** Check `VERCEL_DEPLOYMENT_FIX.md` for detailed troubleshooting.
