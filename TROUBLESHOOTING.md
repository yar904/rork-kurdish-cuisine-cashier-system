# 🔧 Troubleshooting Guide

## "Snapshot Not Found" Error

### Problem
Visiting `https://kurdish-cuisine-cashier-system.rork.app` shows "snapshot not found"

### Root Cause
Rork's deployment system can't find your app's snapshot/build files.

### Solutions

**Option 1: Fix on Rork** (Contact Support)
- Contact Rork support
- Request snapshot restore
- Ask them to rebuild from source

**Option 2: Deploy Backend Separately** (5 minutes - Recommended)
- Follow `QUICK_FIX_DEPLOYMENT.md`
- Deploy backend to Render.com
- Update `EXPO_PUBLIC_RORK_API_BASE_URL` in your `.env`
- Rork will host frontend, Render will host backend

**Option 3: Move to Netlify** (10 minutes)
- Follow `NETLIFY_FULL_STACK_GUIDE.md`
- Deploy backend to Render.com
- Deploy frontend to Netlify
- Leave Rork entirely

---

## Old Version Showing

### Symptoms
- Preview on laptop shows old version
- Mobile shows new version
- Changes don't appear

### Causes & Solutions

#### 1. Browser Cache
**Solution**: Hard refresh
- **Chrome/Firefox**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Safari**: `Cmd + Option + R`
- Or open in incognito/private mode

#### 2. Service Worker Cache (PWA)
**Solution**: Clear service worker
```javascript
// Open DevTools Console and run:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  location.reload();
});
```

#### 3. CDN Cache (Netlify/Rork)
**Solution**: 
- Netlify: Go to Deploys → Trigger Deploy → Clear cache and deploy
- Rork: Contact support to clear CDN cache

#### 4. Environment Variables Not Updated
**Solution**: 
- Check `.env` file has correct values
- Verify Netlify env vars match
- Rebuild after changing env vars

---

## CORS Errors

### Symptoms
```
Access to fetch at 'https://backend.com' from origin 'https://frontend.com' 
has been blocked by CORS policy
```

### Solution
Your `backend/hono.ts` already allows:
- `.rork.app`
- `.netlify.app`
- `.onrender.com`
- `.railway.app`
- `.vercel.app`

If you use a custom domain:

1. Open `backend/hono.ts`
2. Add your domain to `allowedOrigins`:
```typescript
const allowedOrigins = [
  "https://kurdish-cuisine-cashier-system.rork.app",
  "https://your-custom-domain.com",  // Add this
  "http://localhost:8081",
  "http://localhost:3000",
];
```
3. Redeploy backend

---

## Backend Not Responding

### Symptoms
- API calls timeout
- Console shows network errors
- Health check fails

### Diagnosis

1. **Check backend is running**
   ```
   Visit: https://your-backend.onrender.com/api/health
   Should return: {"status":"ok"}
   ```

2. **Check backend logs**
   - Render: Dashboard → Your service → Logs tab
   - Railway: Dashboard → Your project → Logs
   - Look for error messages

### Common Issues

#### A. Cold Start (Render Free Tier)
**Symptom**: First request takes 30+ seconds  
**Cause**: Backend sleeps after 15 minutes  
**Solution**: 
- Upgrade to Render paid plan ($7/month)
- Or use Railway (~$10/month)
- Or implement keep-alive ping

**Keep-alive solution** (add to frontend):
```typescript
// Add to app/_layout.tsx
useEffect(() => {
  // Ping backend every 10 minutes
  const interval = setInterval(() => {
    fetch(process.env.EXPO_PUBLIC_RORK_API_BASE_URL + '/api/health')
      .catch(() => {});
  }, 10 * 60 * 1000);
  return () => clearInterval(interval);
}, []);
```

#### B. Wrong Environment Variables
**Check these are set** on backend host:
```
SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NODE_ENV=production
PORT=3000
```

#### C. Build Failed
**Solution**:
- Check Render build logs
- Make sure `package.json` exists in `/backend`
- Verify Node version is 18 or higher

---

## Frontend Build Failures

### Netlify Build Errors

#### "expo: command not found"
**Solution**: Update build command
```
npx expo export -p web
```

#### "Module not found"
**Cause**: Missing dependencies  
**Solution**: Clear cache
```
npm run build -- --clear
```
Or in Netlify: Deploys → Trigger Deploy → Clear cache and deploy

#### "Environment variable not found"
**Cause**: Env vars not set in Netlify  
**Solution**: 
1. Netlify Dashboard → Site settings → Environment variables
2. Add all `EXPO_PUBLIC_*` variables
3. Redeploy

---

## Data Not Syncing

### Symptoms
- Orders don't appear in Kitchen view
- Changes don't persist
- Different views show different data

### Diagnosis

1. **Check Supabase connection**
   ```
   Visit: https://your-backend.onrender.com/api/test
   Should show: "supabaseConnected": true
   ```

2. **Check browser console** (F12)
   - Look for tRPC errors
   - Check network tab for failed requests

### Solutions

#### A. Backend Can't Connect to Supabase
**Check backend env vars include**:
```
SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

#### B. Frontend Using Wrong Backend URL
**Check `.env` file**:
```
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend.onrender.com
```

Make sure:
- No trailing slash
- HTTPS (not HTTP)
- Points to your deployed backend

#### C. Database Tables Missing
**Solution**: Run database setup
1. Go to Supabase dashboard
2. SQL Editor
3. Run scripts from `DATABASE_SETUP.md`

---

## Mobile vs Desktop Differences

### Symptoms
- Works on mobile, not desktop
- Works on desktop, not mobile
- Different versions on each

### Causes

#### 1. Cached Versions
**Solution**: Clear cache on both devices

#### 2. Different Build Outputs
**Check**: Are you using React Native (mobile) AND Expo Web (desktop)?
- If yes, make sure both are updated
- Redeploy both versions

#### 3. Platform-Specific Code
**Check** for `Platform.select()` or `Platform.OS` conditionals
- Make sure web version has proper fallbacks

---

## Build Error: "expo-router not found"

### Cause
Dependencies not installed

### Solution
```bash
npm install --legacy-peer-deps
# or
bun install
```

Then rebuild:
```bash
npx expo export -p web
```

---

## Error: "Cannot find module '@/...' "

### Cause
TypeScript path aliases not resolved in build

### Solution
1. Check `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

2. Rebuild:
```bash
npx expo export -p web --clear
```

---

## Netlify "Page Not Found" on Refresh

### Cause
SPA routing not configured

### Solution
Already fixed in `netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

If still happening:
1. Check `netlify.toml` is in root directory
2. Redeploy
3. Hard refresh browser

---

## Payment Required / API Limits

### Free Tier Limits

**Render.com**:
- ✅ Free web services
- ⚠️ Sleeps after 15 min
- ⚠️ 750 hours/month

**Netlify**:
- ✅ 100GB bandwidth/month
- ✅ Unlimited sites
- ✅ 300 build minutes/month

**Supabase**:
- ✅ 500MB database
- ✅ 2GB bandwidth
- ✅ 50MB file storage

### Exceeded Limits?

**Backend hosting**:
- Upgrade Render: $7/month
- Or Railway: ~$10/month
- Or Fly.io: ~$5/month

**Database**:
- Upgrade Supabase: $25/month
- Or self-host Postgres

---

## Quick Diagnostic Checklist

Run through this checklist:

**Backend**
- [ ] Backend URL is accessible
- [ ] `/api/health` returns OK
- [ ] `/api/test` shows Supabase connected
- [ ] Backend logs show no errors

**Frontend**
- [ ] Site loads without errors
- [ ] Console has no errors (F12)
- [ ] Network tab shows successful API calls
- [ ] Environment variables are set correctly

**Database**
- [ ] Supabase dashboard accessible
- [ ] Tables exist and have data
- [ ] API keys are valid

**Environment Variables**
- [ ] Frontend: `EXPO_PUBLIC_RORK_API_BASE_URL` is correct
- [ ] Backend: `SUPABASE_PROJECT_URL` is correct
- [ ] Backend: `SUPABASE_ANON_KEY` is set
- [ ] All values match between local and deployment

---

## Still Stuck?

### Check These Files:
1. `DEPLOYMENT_SOLUTION.md` - Overall deployment guide
2. `QUICK_FIX_DEPLOYMENT.md` - Step-by-step backend setup
3. `NETLIFY_FULL_STACK_GUIDE.md` - Complete Netlify guide
4. `HOSTING_OPTIONS_COMPARISON.md` - Compare hosting options

### Get Logs:

**Backend logs**:
```bash
# If using Render
Visit: Dashboard → Your Service → Logs

# If using Railway
Visit: Dashboard → Your Project → Logs → Backend

# If local
Check terminal output
```

**Frontend logs**:
- Open browser DevTools (F12)
- Check Console tab
- Check Network tab

**Database logs**:
- Supabase Dashboard → Logs

### Contact Support:

**Rork Issues**: Contact Rork support  
**Render Issues**: support@render.com  
**Netlify Issues**: Check Netlify Support Forum  
**Supabase Issues**: Check Supabase Discord  

---

## Common Error Messages

### "fetch failed"
- Check backend is running
- Verify CORS is configured
- Check backend URL is correct

### "ECONNREFUSED"
- Backend not running
- Wrong port number
- Firewall blocking connection

### "Network request failed"
- Backend URL incorrect
- CORS not configured
- Backend crashed

### "Unauthorized"
- API key wrong
- Supabase key expired
- Check env vars

### "Database connection failed"
- Wrong Supabase URL
- Invalid API key
- Database paused (check Supabase dashboard)

---

## Prevention Tips

✅ **Always check logs first**  
✅ **Test locally before deploying**  
✅ **Keep environment variables in sync**  
✅ **Use version control (Git)**  
✅ **Document any custom changes**  
✅ **Monitor backend uptime**  
✅ **Set up error tracking (Sentry, LogRocket)**  

---

## Need Help NOW?

**Quick fix for most issues**:

1. Deploy backend to Render → `QUICK_FIX_DEPLOYMENT.md`
2. Update `.env` with backend URL
3. Clear all caches (browser + Netlify)
4. Redeploy frontend
5. Hard refresh browser

**This fixes 90% of deployment issues!** 🚀
