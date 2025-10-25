# 🚀 DEPLOY NOW - Render Deployment Checklist

## ✅ Pre-Deployment Verification

### Files Ready
- [x] `backend/index-render.ts` created ✅
- [x] `backend/render.yaml` created ✅
- [x] `backend/.env` updated ✅
- [x] `.env` updated (needs your Render URL) ⚠️
- [x] Vercel files removed ✅
- [x] Documentation created ✅

---

## 🎯 DEPLOYMENT STEPS

### Step 1: Commit Changes (Optional, if using Git)
```bash
git add .
git commit -m "Migrate backend from Vercel to Render"
git push origin main
```

### Step 2: Create Render Account
1. Go to https://render.com/
2. Sign up or log in with GitHub
3. Verify your email

### Step 3: Create New Web Service
1. Click **"New +"** in top right
2. Select **"Web Service"**
3. Choose your repository or select "Public Git Repository"
4. If using public repo, enter: `[YOUR_REPO_URL]`

### Step 4: Configure Service

#### Basic Settings
```
Name: kurdish-cuisine-backend
Region: Oregon (US West)
Branch: main
Root Directory: backend
Runtime: Node
```

#### Build & Deploy Settings
```
Build Command: npm install && npm run build
Start Command: node dist/index-render.js
```

### Step 5: Add Environment Variables

Click **"Advanced"** then **"Add Environment Variable"** for each:

```env
NODE_ENV=production
```
```env
SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
```
```env
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
```
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4
```
```env
DATABASE_URL=postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres
```
```env
FRONTEND_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
```

### Step 6: Deploy!
1. Click **"Create Web Service"**
2. Wait 3-5 minutes for initial build
3. Watch the logs for any errors

### Step 7: Get Your URL
After deployment completes, your service URL will be:
```
https://kurdish-cuisine-backend.onrender.com
```
(or your custom name if different)

**Copy this URL - you'll need it for the next steps!**

---

## 🧪 TESTING YOUR DEPLOYMENT

### Test 1: Health Check
```bash
curl https://your-render-app-name.onrender.com/api/health
```

**Expected Output:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-25T10:30:00.000Z",
  "environment": "production"
}
```

### Test 2: Root Endpoint
```bash
curl https://your-render-app-name.onrender.com/
```

**Expected Output:**
```json
{
  "status": "✅ Kurdish Cuisine Cashier System API",
  "version": "1.0.0",
  "deployed": "Render",
  "healthCheck": "/api/health"
}
```

### Test 3: tRPC Endpoint
```bash
curl https://your-render-app-name.onrender.com/api/trpc/example.hi
```

---

## 🔄 UPDATE FRONTEND

### Update .env File
Replace `your-render-app-name` with your actual Render service URL:

```env
EXPO_PUBLIC_RORK_API_BASE_URL=https://kurdish-cuisine-backend.onrender.com
EXPO_PUBLIC_API_BASE_URL=https://kurdish-cuisine-backend.onrender.com
```

### Restart Development Server
```bash
# Stop current server (Ctrl+C)
# Then restart:
npm start
```

---

## ✅ POST-DEPLOYMENT CHECKLIST

- [ ] Service deployed successfully
- [ ] Health endpoint returns 200 OK
- [ ] Root endpoint returns correct JSON
- [ ] No errors in Render logs
- [ ] Frontend .env updated with Render URL
- [ ] Development server restarted
- [ ] Test API calls from frontend work
- [ ] Test tRPC queries work
- [ ] Verify Supabase connection works

---

## 🐛 TROUBLESHOOTING

### Build Fails
**Error**: "Cannot find module 'typescript'"
**Fix**: Ensure `typescript` is in `devDependencies` in `backend/package.json`

**Error**: "tsc: command not found"
**Fix**: Check build command is exactly: `npm install && npm run build`

### Start Fails
**Error**: "Cannot find module './dist/index-render.js'"
**Fix**: Verify start command is exactly: `node dist/index-render.js`

### 404 on /api/health
**Fix**: Check Root Directory is set to `backend` not empty

### Environment Variable Issues
**Fix**: Go to Render Dashboard → Your Service → Environment → Re-add variables

### Service Sleeping
**Info**: Free tier services sleep after 15 minutes of inactivity
**Impact**: First request takes 30-60 seconds to wake up
**Fix**: Upgrade to paid plan ($7/month) for always-on service

---

## 📊 RENDER DASHBOARD

### Important Links
- **Dashboard**: https://dashboard.render.com/
- **Your Service**: https://dashboard.render.com/web/[service-id]
- **Logs**: Dashboard → Your Service → Logs
- **Settings**: Dashboard → Your Service → Settings
- **Environment**: Dashboard → Your Service → Environment

### Monitoring
- Check logs for errors
- Monitor response times
- Watch for sleep/wake cycles (free tier)
- Review build times

---

## 💡 PRO TIPS

### 1. Set Up Auto-Deploy
Render automatically deploys when you push to your main branch.
To disable: Dashboard → Your Service → Settings → Auto-Deploy

### 2. Custom Domain (Optional)
1. Go to Dashboard → Your Service → Settings
2. Click "Add Custom Domain"
3. Enter your domain
4. Add CNAME record to your DNS

### 3. Enable Notifications
Dashboard → Account Settings → Notifications
- Email alerts for deploy failures
- Slack integration available

### 4. Monitor Costs
Dashboard → Billing
- Free tier: 750 hours/month
- Monitor usage
- Upgrade when ready

---

## 🎓 NEXT STEPS AFTER DEPLOYMENT

### Immediate
1. Test all API endpoints
2. Verify tRPC routes work
3. Check Supabase queries work
4. Test from mobile app

### Short-term
1. Monitor logs for errors
2. Track response times
3. Optimize cold starts (if needed)
4. Set up alerting

### Long-term
1. Consider upgrading to paid plan
2. Set up custom domain
3. Implement health check monitoring
4. Add performance tracking

---

## 📞 SUPPORT

### Render Support
- **Docs**: https://render.com/docs
- **Status**: https://status.render.com
- **Community**: https://community.render.com

### Project Issues
- Check logs: Render Dashboard → Your Service → Logs
- Review env vars: Dashboard → Your Service → Environment
- Check build: Dashboard → Your Service → Events

---

## 🎉 SUCCESS CRITERIA

Your deployment is successful when:
- ✅ Health endpoint returns 200 OK
- ✅ tRPC endpoints are accessible
- ✅ Supabase queries work
- ✅ Frontend can connect to backend
- ✅ No errors in logs
- ✅ Response times < 2 seconds

---

## 📝 SUMMARY

**What You Did:**
1. Created Render-compatible backend entry point
2. Configured build and start commands
3. Set up environment variables
4. Deployed to Render
5. Updated frontend to use Render URL

**What You Got:**
- ✅ Full Node.js runtime
- ✅ Simple deployment process
- ✅ Better logging and debugging
- ✅ Reliable environment variables
- ✅ Production-ready API

**Cost:**
- Free tier: Perfect for testing
- Paid: $7/month for always-on production

---

**Deployment Platform**: Render.com  
**Region**: Oregon (US West)  
**Status**: ✅ Ready to Deploy  
**Expected Time**: 5-10 minutes  

🚀 **You're ready to deploy! Follow the steps above and you'll be live in minutes!**

---

## 🔖 QUICK REFERENCE CARD

```
═══════════════════════════════════════════════
  RENDER DEPLOYMENT - QUICK REFERENCE
═══════════════════════════════════════════════

SERVICE NAME:     kurdish-cuisine-backend
REGION:           Oregon (US West)
ROOT DIRECTORY:   backend
BUILD COMMAND:    npm install && npm run build
START COMMAND:    node dist/index-render.js

ENVIRONMENT VARIABLES:
  NODE_ENV=production
  SUPABASE_PROJECT_URL=[see RENDER_QUICK_START.txt]
  SUPABASE_ANON_KEY=[see RENDER_QUICK_START.txt]
  SUPABASE_SERVICE_ROLE_KEY=[see RENDER_QUICK_START.txt]
  DATABASE_URL=[see RENDER_QUICK_START.txt]
  FRONTEND_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app

TEST ENDPOINTS:
  Health: /api/health
  Root:   /
  tRPC:   /api/trpc/*

EXPECTED DEPLOY TIME: 3-5 minutes
═══════════════════════════════════════════════
```

**Good luck with your deployment! 🎉**
