# ☑️ TODAY'S DEPLOYMENT CHECKLIST

**Project:** Kurdish Cuisine Cashier System  
**Target:** Production Launch  
**Time Required:** 10 minutes  

---

## 🔴 CRITICAL TASKS (Must Complete)

### 1. Clean Up Vercel Environment Variables
**URL:** https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/settings/environment-variables

- [ ] Delete `supabase_url` (if exists)
- [ ] Delete `supabase_anon_key` (if exists)
- [ ] Delete `@supabase_url` (if exists)
- [ ] Delete `@frontend_url` (if exists)
- [ ] Delete any other lowercase or @ prefixed variables

### 2. Add 10 Environment Variables (All Uppercase)

Use `VERCEL_ENV_QUICK_COPY.txt` as reference.

For EACH variable: Add New → Paste Key → Paste Value → Select Production + Preview + Development → Save

- [ ] `NODE_ENV` = `production`
- [ ] `SUPABASE_URL` = `https://oqspnszwjxzyvwqjvjiy.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key from file)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key from file)
- [ ] `DATABASE_URL` = `postgresql://Farman12Tapse@db...` (full URL from file)
- [ ] `FRONTEND_URL` = `https://rork-kurdish-cuisine-cashier-system.vercel.app`
- [ ] `EXPO_PUBLIC_RORK_API_BASE_URL` = `https://rork-kurdish-cuisine-cashier-system.vercel.app`
- [ ] `EXPO_PUBLIC_SUPABASE_URL` = `https://oqspnszwjxzyvwqjvjiy.supabase.co`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (full key from file)
- [ ] `EXPO_PUBLIC_API_BASE_URL` = `https://rork-kurdish-cuisine-cashier-system.vercel.app`

### 3. Verify Each Variable Shows 3 Environments

After adding all variables, scroll through the list and confirm:

- [ ] Each variable shows: `Production` `Preview` `Development` badges

### 4. Check Project Settings
**URL:** https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/settings

- [ ] Root Directory: Empty or `./`
- [ ] Framework Preset: Other
- [ ] Build Command: Empty (auto-detect)
- [ ] Node.js Version: 20.x

### 5. Trigger Fresh Deployment
**URL:** https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system

- [ ] Go to "Deployments" tab
- [ ] Click "Redeploy" on latest deployment
- [ ] **UNCHECK** "Use existing Build Cache"
- [ ] Click "Redeploy" button
- [ ] Wait for deployment (2-3 mins)

---

## 🟢 TESTING (Verify Success)

### Test 1: API Health Check

**Command:**
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
```

**Expected:**
```json
{"status":"ok","timestamp":"2025-01-25T..."}
```

- [ ] Health endpoint returns 200 OK
- [ ] Response includes status and timestamp

### Test 2: API Root

**Command:**
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api
```

**Expected:**
```
✅ Kurdish Cuisine API running on Vercel Edge Runtime
```

- [ ] Root endpoint returns success message

### Test 3: Frontend Loads

**Open in browser:**
```
https://rork-kurdish-cuisine-cashier-system.vercel.app
```

- [ ] Page loads without errors
- [ ] No console errors in DevTools (F12)
- [ ] App interface is visible

### Test 4: Check Key Pages

Visit each and verify they load:

- [ ] https://rork-kurdish-cuisine-cashier-system.vercel.app/menu-management
- [ ] https://rork-kurdish-cuisine-cashier-system.vercel.app/kitchen
- [ ] https://rork-kurdish-cuisine-cashier-system.vercel.app/cashier
- [ ] https://rork-kurdish-cuisine-cashier-system.vercel.app/waiter
- [ ] https://rork-kurdish-cuisine-cashier-system.vercel.app/analytics
- [ ] https://rork-kurdish-cuisine-cashier-system.vercel.app/reports

---

## 🟡 OPTIONAL POST-LAUNCH

### Monitor Deployment
- [ ] Check Vercel logs: https://vercel.com/your-team/rork-kurdish-cuisine-cashier-system/logs
- [ ] Verify no errors in real-time logs
- [ ] Check analytics dashboard

### Test Full Workflow
- [ ] Create a test menu item
- [ ] Create a test order
- [ ] Update order status
- [ ] View in kitchen screen
- [ ] Process in cashier screen
- [ ] Check reports and analytics

### Performance Check
- [ ] Test API response times
- [ ] Check page load speeds
- [ ] Verify mobile responsiveness

---

## 🆘 IF SOMETHING FAILS

### Common Issues & Quick Fixes

**Issue:** "Missing environment variable: SUPABASE_URL"
- **Fix:** Verify variable is UPPERCASE in Vercel, applied to Production, redeploy with no cache

**Issue:** 404 on /api/health
- **Fix:** Check Root Directory is empty, verify backend/api/index.ts exists, redeploy

**Issue:** CORS errors
- **Fix:** Verify FRONTEND_URL matches deployment URL, check backend/api/index.ts has correct origins

**Issue:** Supabase connection fails
- **Fix:** Test Supabase directly, check for extra spaces in keys, verify keys match exactly

---

## ✅ COMPLETION CRITERIA

Your deployment is successful when:

- ✅ All 10 environment variables are in Vercel (uppercase)
- ✅ Each variable shows 3 environment badges
- ✅ Fresh deployment completed without errors
- ✅ `/api/health` returns `{"status":"ok"}`
- ✅ `/api` shows success message
- ✅ Frontend loads without console errors
- ✅ Key pages accessible

---

## 🎉 SUCCESS!

Once all items are checked, you're LIVE! 

**Share your live app:**
- Production URL: https://rork-kurdish-cuisine-cashier-system.vercel.app

---

**Print this checklist and check off each item as you complete it! 📋✅**
