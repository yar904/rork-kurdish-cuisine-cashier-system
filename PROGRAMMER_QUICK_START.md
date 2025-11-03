# 🚀 PROGRAMMER QUICK START - 30 MINUTES TO LAUNCH

**Kurdish Cuisine Cashier System**  
**Your mission:** Deploy this app on Netlify in 30 minutes

---

## ⚡ 3 STEPS TO DEPLOY

### STEP 1: Enable Netlify Site (5 min)

1. Go to: https://app.netlify.com/
2. Login with your credentials
3. Find site: **tapse** (or your site name)
4. If disabled: Click "Resume site" or "Enable site"

---

### STEP 2: Add Environment Variables (10 min)

**Location:** Netlify Dashboard → Site Settings → Build & Deploy → Environment Variables

**Copy-paste these 10 variables:**

```
NODE_ENV
production

SUPABASE_PROJECT_URL
https://oqspnszwjxzyvwqjvjiy.supabase.co

SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k

SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4

DATABASE_URL
postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres

FRONTEND_URL
https://tapse.netlify.app

EXPO_PUBLIC_SUPABASE_URL
https://oqspnszwjxzyvwqjvjiy.supabase.co

EXPO_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k

EXPO_PUBLIC_API_BASE_URL
https://tapse.netlify.app

EXPO_PUBLIC_RORK_API_BASE_URL
https://tapse.netlify.app
```

**How to add:**
For each variable above:
1. Click "Add a variable"
2. Key = first line (e.g., `NODE_ENV`)
3. Value = second line (e.g., `production`)
4. Scope = "All scopes"
5. Click "Save"

---

### STEP 3: Deploy (15 min)

**Option A: Netlify Dashboard (Easier)**
1. Go to: Netlify Dashboard → Deploys tab
2. Click: "Trigger deploy" → "Deploy site"
3. Wait: 5-10 minutes
4. Monitor: Check deploy logs for errors

**Option B: Command Line**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

---

## ✅ VERIFY DEPLOYMENT

After deploy completes, run these tests:

### 1. App Loads
Open: https://tapse.netlify.app  
✅ Should see: Your app interface

### 2. Backend Health
```bash
curl https://tapse.netlify.app/api/health
```
✅ Should see: `{"status":"ok","timestamp":"..."}`

### 3. Database Connection
```bash
curl https://tapse.netlify.app/api/test
```
✅ Should see: Success message

---

## 🚨 TROUBLESHOOTING

### Build Failed
1. Check Netlify deploy logs
2. Look for: "Missing environment variable"
3. Verify all 10 variables are added

### 404 on /api routes
1. Check `netlify.toml` exists in project root
2. Check `netlify/functions/api.js` exists
3. Redeploy

### Site Still Disabled
1. Go to Site Settings → General
2. Look for "Resume site" button
3. Click it

---

## 📋 CHECKLIST

Before saying "Done":

- [ ] Netlify site is enabled
- [ ] All 10 environment variables added
- [ ] Deployment succeeded (no errors in logs)
- [ ] https://tapse.netlify.app loads
- [ ] /api/health returns `{"status":"ok"}`
- [ ] /api/test succeeds
- [ ] No console errors in browser

---

## 📞 NEED HELP?

Read the full guide: `DEPLOYMENT_FINAL_SUMMARY.md`

---

## ⏱️ TIME BREAKDOWN

- Enable site: 5 min
- Add variables: 10 min  
- Deploy: 15 min
- **Total: 30 min**

---

**THAT'S IT! 🎉**

Follow these 3 steps and you're live in 30 minutes.
