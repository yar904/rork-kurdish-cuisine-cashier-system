# ✅ PRE-DEPLOY VALIDATION CHECKLIST

**Run this checklist before deploying to production**

---

## 🔍 Automated Validation

### Run Validation Script
```bash
node test-env-config.js
```

**Expected Output:**
```
🔍 Validating Environment Configuration...

📄 Checking Root .env...
✅ EXPO_PUBLIC_RORK_API_BASE_URL = https://rork-kurdish-cuisine-cashier-system.vercel.app
✅ EXPO_PUBLIC_SUPABASE_URL = https://oqspnszwjxzyvwqjvjiy.supabase.co
✅ EXPO_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ FRONTEND_URL = https://rork-kurdish-cuisine-cashier-system.vercel.app

📄 Checking Backend .env...
✅ NODE_ENV = production
✅ SUPABASE_PROJECT_URL = https://oqspnszwjxzyvwqjvjiy.supabase.co
✅ SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ DATABASE_URL = postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres
✅ FRONTEND_URL = https://rork-kurdish-cuisine-cashier-system.vercel.app
✅ EXPO_PUBLIC_SUPABASE_URL = https://oqspnszwjxzyvwqjvjiy.supabase.co
✅ EXPO_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ EXPO_PUBLIC_API_BASE_URL = https://rork-kurdish-cuisine-cashier-system.vercel.app

🌐 Checking Production URLs...
✅ EXPO_PUBLIC_RORK_API_BASE_URL points to production
✅ FRONTEND_URL points to production
✅ EXPO_PUBLIC_API_BASE_URL points to production

════════════════════════════════════════════════════════════════
✅ All environment variables are configured correctly!

📋 Next steps:
1. Copy these variables to Vercel (see VERCEL_ENV_FIX_GUIDE.md)
2. Apply to Production, Preview, and Development
3. Trigger a fresh deployment
4. Test: curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
```

**If you see this output, proceed to Manual Validation below.**

**If you see errors, fix them before continuing.**

---

## 📋 Manual Validation Checklist

### 1. Local Files
- [ ] `.env` exists at project root
- [ ] `backend/.env` exists in backend folder
- [ ] `vercel.json` exists at project root (not in backend/)
- [ ] `api/index.ts` exists at project root
- [ ] `backend/api/index.ts` exists with Hono + tRPC setup

### 2. Environment Variables - Root .env
Open `.env` and verify:
- [ ] `EXPO_PUBLIC_RORK_API_BASE_URL` = `https://rork-kurdish-cuisine-cashier-system.vercel.app`
- [ ] `EXPO_PUBLIC_SUPABASE_URL` = `https://oqspnszwjxzyvwqjvjiy.supabase.co`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` = starts with `eyJhbGciOiJIUzI1NiIs...`
- [ ] `FRONTEND_URL` = `https://rork-kurdish-cuisine-cashier-system.vercel.app`

### 3. Environment Variables - backend/.env
Open `backend/.env` and verify:
- [ ] `NODE_ENV` = `production`
- [ ] `SUPABASE_PROJECT_URL` = `https://oqspnszwjxzyvwqjvjiy.supabase.co` (**NOT** `SUPABASE_URL`)
- [ ] `SUPABASE_ANON_KEY` = starts with `eyJhbGciOiJIUzI1NiIs...`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = starts with `eyJhbGciOiJIUzI1NiIs...`
- [ ] `DATABASE_URL` = `postgresql://Farman12Tapse@db...`
- [ ] `FRONTEND_URL` = `https://rork-kurdish-cuisine-cashier-system.vercel.app`
- [ ] `EXPO_PUBLIC_SUPABASE_URL` = `https://oqspnszwjxzyvwqjvjiy.supabase.co`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` = starts with `eyJhbGciOiJIUzI1NiIs...`
- [ ] `EXPO_PUBLIC_API_BASE_URL` = `https://rork-kurdish-cuisine-cashier-system.vercel.app`

### 4. Code References
Search project for old variable name:
```bash
grep -r "SUPABASE_URL[^_]" backend/ --exclude-dir=node_modules
```

**Expected:** No results (or only in comments explaining the fix)

### 5. vercel.json Configuration
Open `vercel.json` and verify:
```json
{
  "version": 2,
  "routes": [
    { "src": "/api/(.*)", "dest": "api/index.ts" },
    { "src": "/(.*)", "dest": "api/index.ts" }
  ]
}
```

- [ ] `version` = `2`
- [ ] No `builds` key exists (removed)
- [ ] Routes point to `api/index.ts`

### 6. api/index.ts Entry Point
Open `api/index.ts` and verify:
```typescript
export { GET, POST, config } from "../backend/api/index";
```

- [ ] Exports GET, POST, config
- [ ] Points to `../backend/api/index`

### 7. Backend API Handler
Open `backend/api/index.ts` and verify:
- [ ] Imports Hono
- [ ] Configures CORS
- [ ] Sets up tRPC server
- [ ] Has `/health` endpoint
- [ ] Exports GET, POST, config

---

## 🌐 Vercel Environment Variables

### Pre-Deployment Checklist

**Go to:** Vercel Dashboard → Your Project → Settings → Environment Variables

### Step 1: Check for Old Variables
Look for these and **DELETE** if they exist:
- [ ] ❌ Checked for `SUPABASE_URL` → Delete if exists
- [ ] ❌ Checked for `supabase_url` → Delete if exists

### Step 2: Verify All 10 Required Variables Exist

Check that these variables are added:
- [ ] `NODE_ENV`
- [ ] `SUPABASE_PROJECT_URL` (**must be this name**, not SUPABASE_URL)
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `DATABASE_URL`
- [ ] `FRONTEND_URL`
- [ ] `EXPO_PUBLIC_SUPABASE_URL`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `EXPO_PUBLIC_API_BASE_URL`
- [ ] `EXPO_PUBLIC_RORK_API_BASE_URL`

### Step 3: Verify Environment Assignment

For EACH variable above, verify it's applied to:
- [ ] ✅ Production
- [ ] ✅ Preview
- [ ] ✅ Development

### Step 4: Verify Values Match

Compare Vercel values with `QUICK_VERCEL_SETUP.txt`:
- [ ] All URLs point to `https://rork-kurdish-cuisine-cashier-system.vercel.app`
- [ ] All Supabase URLs point to `https://oqspnszwjxzyvwqjvjiy.supabase.co`
- [ ] Keys start with `eyJhbGciOiJIUzI1NiIs...`
- [ ] DATABASE_URL starts with `postgresql://`

---

## 🧪 Pre-Deployment Tests

### Local Build Test (Optional)
```bash
npm run build
# or
bun run build
```

**Expected:** Build succeeds with no TypeScript errors

### Local Backend Test (Optional)
```bash
cd backend
npm run dev
# or
bun run dev
```

Then in another terminal:
```bash
curl http://localhost:3000/
```

**Expected:** Backend responds with success message

---

## 📊 Final Validation Summary

### All Checks Must Pass

| Category | Check | Status |
|----------|-------|--------|
| **Local Files** | All required files exist | [ ] |
| **Root .env** | All variables correct | [ ] |
| **Backend .env** | All variables correct | [ ] |
| **Code References** | No old SUPABASE_URL references | [ ] |
| **vercel.json** | Configuration correct | [ ] |
| **api/index.ts** | Entry point correct | [ ] |
| **backend/api/index.ts** | API handler correct | [ ] |
| **Vercel Variables** | Old variables deleted | [ ] |
| **Vercel Variables** | All 10 new variables added | [ ] |
| **Vercel Variables** | Applied to all environments | [ ] |
| **Validation Script** | Passes successfully | [ ] |

---

## 🚀 Ready to Deploy?

### If All Checks Pass ✅

You're ready to deploy! Choose your deployment guide:

**Quick Deploy:**
```bash
vercel --prod --yes --force
```

**Or follow:** `QUICK_DEPLOY_CARD.md` for step-by-step

---

### If Any Checks Fail ❌

**DO NOT DEPLOY YET**

Fix the failing checks first:

1. **Local files missing:** Verify files exist at correct paths
2. **Environment variables wrong:** Update .env files with correct values
3. **Old code references:** Update to use `SUPABASE_PROJECT_URL`
4. **Configuration issues:** Check vercel.json and api/index.ts
5. **Vercel variables:** Add/update in Vercel dashboard

After fixing, re-run this validation checklist.

---

## 📋 Post-Fix Actions

After fixing any issues:

1. **Re-run validation script:**
   ```bash
   node test-env-config.js
   ```

2. **Commit changes (if any):**
   ```bash
   git add .
   git commit -m "Fix environment configuration"
   git push origin main
   ```

3. **Re-run this checklist**

4. **When all checks pass → Deploy**

---

## 🎯 Success Criteria

You can proceed to deployment when:

✅ Validation script passes  
✅ All manual checks complete  
✅ All Vercel variables configured  
✅ No old variable references  
✅ Configuration files correct  

---

## 📞 Need Help?

If validation fails and you can't fix it:

1. **Check documentation:**
   - `FINAL_FIX_SUMMARY.md` - Understanding the fix
   - `VERCEL_ENV_VARIABLES_FINAL.md` - Detailed variable guide
   - `DEPLOYMENT_STATUS.md` - Current system status

2. **Common issues:**
   - Missing files → Check project structure
   - Wrong values → Compare with QUICK_VERCEL_SETUP.txt
   - Old references → Search and replace SUPABASE_URL
   - Vercel config → Verify all 10 variables

3. **Start over:**
   - Review `START_DEPLOYMENT_HERE.md`
   - Follow `DEPLOY_NOW_FINAL.md` step-by-step

---

**Status:** Ready for validation  
**Next Step:** Run `node test-env-config.js`  
**After Validation:** Deploy with `vercel --prod --yes --force`

---

Good luck! 🚀
