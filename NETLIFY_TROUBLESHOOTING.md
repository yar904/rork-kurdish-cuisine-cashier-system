# 🔧 NETLIFY DEPLOYMENT TROUBLESHOOTING

**Quick fixes for common Netlify deployment issues**

---

## 🚨 ISSUE: "Site is disabled on Netlify"

### Symptoms
- Can't access https://tapse.netlify.app
- Netlify dashboard shows site as "Disabled" or "Stopped"
- Error message: "This site has been disabled"

### Solution
1. **Login to Netlify**
   - Go to: https://app.netlify.com/
   - Use your credentials

2. **Find Your Site**
   - Look for site named: `tapse`
   - Or search for: `tapse.netlify.app`

3. **Enable the Site**
   - Click on the site name
   - Look for one of these buttons:
     - "Resume site"
     - "Enable site"
     - "Activate site"
   - Click it

4. **Verify**
   - Site status should change to "Active"
   - Try accessing https://tapse.netlify.app

---

## 🚨 ISSUE: "Build Failed"

### Symptoms
- Deploy shows red "Failed" status
- Build logs show errors
- Site doesn't update after push

### Solution 1: Missing Environment Variables
```
Error: Environment variable not found
```

**Fix:**
1. Go to: Site Settings → Build & Deploy → Environment Variables
2. Verify all 10 variables are added:
   - NODE_ENV
   - SUPABASE_PROJECT_URL
   - SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   - DATABASE_URL
   - FRONTEND_URL
   - EXPO_PUBLIC_SUPABASE_URL
   - EXPO_PUBLIC_SUPABASE_ANON_KEY
   - EXPO_PUBLIC_API_BASE_URL
   - EXPO_PUBLIC_RORK_API_BASE_URL
3. Re-deploy: Deploys → Trigger deploy → Deploy site

### Solution 2: Build Command Failed
```
Error: Command failed with exit code 1
```

**Fix:**
1. Check build command in `netlify.toml`:
   ```toml
   [build]
   command = "npm run build"
   ```
2. Verify `package.json` has build script:
   ```json
   "build": "npm run build:backend && npm run build:web"
   ```
3. Check Node version:
   - Go to: Site Settings → Build & Deploy → Build settings
   - Environment: Should be Node 20
4. Clear cache and retry:
   - Deploys → Options → Clear cache and retry deploy

### Solution 3: npm Install Failed
```
Error: npm install failed
```

**Fix:**
1. Check `netlify.toml` has:
   ```toml
   [build.environment]
   NPM_FLAGS = "--legacy-peer-deps"
   ```
2. Commit and push changes
3. Redeploy

---

## 🚨 ISSUE: "404 on /api routes"

### Symptoms
- https://tapse.netlify.app loads fine
- https://tapse.netlify.app/api/health returns 404
- API calls fail with 404

### Solution
1. **Check netlify.toml redirects:**
   ```toml
   [[redirects]]
   from = "/api/*"
   to = "/.netlify/functions/api/:splat"
   status = 200
   ```

2. **Verify serverless function exists:**
   - Check file: `netlify/functions/api.js`
   - Should contain:
     ```javascript
     import app from "../../backend/hono";
     export default app;
     ```

3. **Verify backend build:**
   - Check build logs for "build:backend" step
   - Should compile TypeScript to JavaScript

4. **Redeploy:**
   ```bash
   git add .
   git commit -m "Fix API routes"
   git push
   ```

---

## 🚨 ISSUE: "Supabase Connection Failed"

### Symptoms
- API health check works
- /api/test fails
- Database queries return errors
- Console shows: "Invalid Supabase credentials"

### Solution
1. **Verify environment variables:**
   - `SUPABASE_PROJECT_URL` should be: `https://oqspnszwjxzyvwqjvjiy.supabase.co`
   - `SUPABASE_ANON_KEY` should start with: `eyJhbGciOiJIUzI1NiIs...`
   - No extra spaces or line breaks

2. **Check Supabase project status:**
   - Go to: https://supabase.com/dashboard/project/oqspnszwjxzyvwqjvjiy
   - Verify project is active (not paused)

3. **Test connection string:**
   ```bash
   curl -X POST https://oqspnszwjxzyvwqjvjiy.supabase.co/rest/v1/rpc/ping \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json"
   ```

4. **Redeploy after fixing:**
   - Update environment variables in Netlify
   - Trigger new deploy

---

## 🚨 ISSUE: "Function Execution Timeout"

### Symptoms
- API calls take forever
- Eventually returns 500 error
- Netlify logs show timeout

### Solution
1. **Check function timeout setting:**
   - Go to: Site Settings → Functions
   - Timeout should be: 10 seconds (default)
   - For paid plans: Can increase to 26 seconds

2. **Optimize slow queries:**
   - Check Supabase query performance
   - Add database indexes if needed

3. **Check for infinite loops:**
   - Review recent code changes
   - Check backend logs

---

## 🚨 ISSUE: "Environment Variable Not Updating"

### Symptoms
- Changed environment variable in Netlify
- App still uses old value
- Build succeeds but app behaves wrong

### Solution
1. **Clear build cache:**
   - Deploys → Options → Clear cache and retry deploy

2. **Force rebuild:**
   - Deploys → Trigger deploy → Clear cache and deploy site

3. **Verify variable scope:**
   - Environment Variables → Click variable
   - Ensure "All scopes" or "Production" is selected

---

## 🚨 ISSUE: "CORS Error"

### Symptoms
- Browser console shows CORS error
- API calls fail with: "blocked by CORS policy"

### Solution
1. **Check FRONTEND_URL:**
   - Should be: `https://tapse.netlify.app`
   - Must match your actual Netlify URL

2. **Verify backend CORS config:**
   - File: `backend/hono.ts`
   - Should have CORS middleware configured

3. **Test from correct domain:**
   - Don't test from `localhost` in production
   - Use actual Netlify URL

---

## 🚨 ISSUE: "Blank Page After Deploy"

### Symptoms
- Site loads but shows blank page
- No errors in Netlify logs
- Browser console may show errors

### Solution
1. **Check browser console:**
   - Open DevTools (F12)
   - Look for JavaScript errors
   - Fix errors in code

2. **Verify static files:**
   - Build should create `dist` folder
   - Check Netlify deploy log for "dist" publish

3. **Check index.html:**
   - Should exist in `dist` folder after build
   - Contains Expo web bundle

4. **Verify redirects:**
   ```toml
   [[redirects]]
   from = "/*"
   to = "/index.html"
   status = 200
   ```

---

## ✅ VERIFICATION CHECKLIST

Use this to verify everything works:

```bash
# 1. Site loads
curl -I https://tapse.netlify.app
# Should return: 200 OK

# 2. Health check
curl https://tapse.netlify.app/api/health
# Should return: {"status":"ok","timestamp":"..."}

# 3. Supabase test
curl https://tapse.netlify.app/api/test
# Should return: Success message

# 4. Browser test
# Open: https://tapse.netlify.app
# Should see: Your app interface
```

---

## 📞 STILL STUCK?

### Check These First
1. ✅ Site is enabled (not disabled)
2. ✅ All 10 environment variables added
3. ✅ Latest code pushed to GitHub
4. ✅ Build completed successfully
5. ✅ No errors in deploy logs

### Review Documentation
- `DEPLOYMENT_FINAL_SUMMARY.md` - Complete guide
- `PROGRAMMER_QUICK_START.md` - Quick reference
- `START_DEPLOYMENT_HERE.md` - Original deployment docs

### Netlify Resources
- **Netlify Docs:** https://docs.netlify.com/
- **Netlify Support:** https://answers.netlify.com/
- **Deploy Logs:** Netlify Dashboard → Deploys → Click latest deploy

---

## 🎯 QUICK FIXES

### Reset Everything
```bash
# 1. Clear cache
Netlify Dashboard → Deploys → Clear cache and retry

# 2. Delete and re-add environment variables
Site Settings → Environment Variables → Delete all → Re-add

# 3. Force redeploy
git commit --allow-empty -m "Force redeploy"
git push
```

### Start Fresh
```bash
# 1. Delete site in Netlify
# 2. Create new site
# 3. Connect GitHub repo
# 4. Add environment variables
# 5. Deploy
```

---

**REMEMBER:**

Most issues are caused by:
1. Missing environment variables (60%)
2. Site being disabled (20%)
3. Build cache issues (10%)
4. Wrong configuration (10%)

Always check these first! 🔍
