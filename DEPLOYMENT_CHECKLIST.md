# ✅ Deployment Checklist - Kurdish Cuisine System

Print this and check off as you go!

---

## 📋 Pre-Deployment

### Understand the Problem
- [ ] Read `START_HERE.md` (2 min)
- [ ] Read `DEPLOYMENT_SOLUTION.md` (3 min)
- [ ] Understand you have frontend + backend
- [ ] Know backend needs separate hosting

### Choose Your Path
- [ ] Decided on hosting platform for backend
- [ ] Decided on hosting platform for frontend
- [ ] Reviewed costs in `HOSTING_OPTIONS_COMPARISON.md`
- [ ] Prepared payment method (if using paid tier)

### Gather Information
- [ ] Have GitHub account
- [ ] Have Supabase URL and keys
- [ ] Can access `.env` file
- [ ] Can access `backend/.env` file

---

## 🔧 Backend Deployment (Critical!)

### Setup Account
- [ ] Created account on Render.com (or chosen platform)
- [ ] Connected GitHub repository
- [ ] Verified email if required

### Configure Backend
- [ ] Selected repository
- [ ] Set Root Directory: `backend`
- [ ] Set Build Command: `npm install && npm install -g tsx`
- [ ] Set Start Command: `npx tsx index.ts`
- [ ] Set Environment: Node
- [ ] Set Region (choose closest to you)

### Environment Variables
- [ ] Added `SUPABASE_PROJECT_URL`
- [ ] Added `SUPABASE_ANON_KEY`
- [ ] Added `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Added `NODE_ENV=production`
- [ ] Added `PORT=3000`
- [ ] Double-checked all values are correct

### Deploy Backend
- [ ] Clicked "Create Web Service" or "Deploy"
- [ ] Waited for build to complete (2-3 min)
- [ ] Deployment succeeded ✅
- [ ] Copied backend URL (e.g., `https://xxx.onrender.com`)

### Verify Backend
- [ ] Visit `https://your-backend.onrender.com/`
- [ ] See version info? ✅
- [ ] Visit `https://your-backend.onrender.com/api/health`
- [ ] See `{"status":"ok"}`? ✅
- [ ] Visit `https://your-backend.onrender.com/api/test`
- [ ] See `"supabaseConnected": true`? ✅
- [ ] No errors in logs? ✅

---

## 🎨 Frontend Deployment

### Option A: Update on Rork

- [ ] Opened `.env` file in Rork editor
- [ ] Updated `EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend-url`
- [ ] Saved file
- [ ] Waited for Rork to rebuild
- [ ] Verified app loads without "snapshot not found"

### Option B: Deploy to Netlify

#### Setup Netlify
- [ ] Created Netlify account
- [ ] Connected GitHub repository
- [ ] Selected repository
- [ ] Set Build Command: `npx expo export -p web`
- [ ] Set Publish Directory: `dist`
- [ ] Set Node Version: 20

#### Environment Variables
- [ ] Added `EXPO_PUBLIC_SUPABASE_URL`
- [ ] Added `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Added `EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend-url`
- [ ] Verified all values are correct

#### Deploy Frontend
- [ ] Clicked "Deploy site"
- [ ] Waited for build (2-3 min)
- [ ] Build succeeded ✅
- [ ] Got Netlify URL (e.g., `https://xxx.netlify.app`)

### Verify Frontend
- [ ] Site loads without errors ✅
- [ ] No "snapshot not found" message ✅
- [ ] Opened browser DevTools (F12)
- [ ] No errors in Console tab ✅
- [ ] Checked Network tab - API calls successful ✅

---

## 🧪 Integration Testing

### Basic Functionality
- [ ] Homepage loads
- [ ] Menu page displays items
- [ ] Images load correctly
- [ ] Can navigate between pages
- [ ] Mobile responsive works

### Cashier Flow
- [ ] Can select a table
- [ ] Can add items to cart
- [ ] Can adjust quantities
- [ ] Can remove items
- [ ] Total calculates correctly
- [ ] Can submit order
- [ ] Order submission succeeds ✅

### Kitchen Flow
- [ ] Kitchen view loads
- [ ] New orders appear
- [ ] Can change order status
- [ ] Status updates reflected immediately
- [ ] All order details visible

### Waiter Flow
- [ ] Waiter view loads
- [ ] Can see all tables
- [ ] Can see table status
- [ ] Can view orders by table
- [ ] Can mark orders as served

### Admin Flow
- [ ] Admin panel accessible
- [ ] Can view all orders
- [ ] Can view analytics
- [ ] Reports generate correctly
- [ ] Menu management works

### Data Persistence
- [ ] Created a test order
- [ ] Refreshed page
- [ ] Order still exists ✅
- [ ] All data intact ✅

### Multi-Device Testing
- [ ] Tested on desktop browser
- [ ] Tested on mobile browser
- [ ] Tested on tablet (if available)
- [ ] Layout works on all sizes ✅

---

## 🔒 Security Check

### Environment Variables
- [ ] No secrets exposed in frontend
- [ ] Only `EXPO_PUBLIC_*` vars in frontend
- [ ] Service role key only in backend
- [ ] All secrets properly configured

### CORS
- [ ] API calls work from frontend
- [ ] No CORS errors in console
- [ ] Backend accepts frontend domain

### HTTPS
- [ ] Frontend served over HTTPS ✅
- [ ] Backend served over HTTPS ✅
- [ ] No mixed content warnings

---

## 📊 Performance Check

### Backend Performance
- [ ] Health check responds < 2 seconds
- [ ] API calls respond < 3 seconds
- [ ] No timeout errors
- [ ] Logs show no errors

### Frontend Performance
- [ ] Page loads < 3 seconds
- [ ] Images load reasonably fast
- [ ] No console warnings
- [ ] Smooth interactions

### Database Performance
- [ ] Queries execute quickly
- [ ] Data loads without lag
- [ ] No connection errors

---

## 🌍 Production Readiness

### Documentation
- [ ] Saved backend URL
- [ ] Saved frontend URL
- [ ] Saved database credentials
- [ ] Documented deployment process

### Monitoring
- [ ] Can access backend logs
- [ ] Can access frontend logs
- [ ] Can access database dashboard
- [ ] Set up error alerts (optional)

### Backup Plan
- [ ] Know how to rollback frontend
- [ ] Know how to rollback backend
- [ ] Have database backup strategy
- [ ] Know support contacts

### Team Access
- [ ] Shared credentials (if team)
- [ ] Added team members to platforms
- [ ] Documented where everything is hosted
- [ ] Created handoff documentation

---

## 🎉 Launch Checklist

### Final Verification
- [ ] All pages work ✅
- [ ] All features work ✅
- [ ] No console errors ✅
- [ ] Mobile works ✅
- [ ] Desktop works ✅
- [ ] Data persists ✅

### Performance
- [ ] Fast load times ✅
- [ ] Smooth interactions ✅
- [ ] No errors ✅

### Go Live
- [ ] Updated any marketing materials
- [ ] Tested with real users
- [ ] Monitored first few orders
- [ ] Confirmed everything works ✅

---

## 🚨 If Something Goes Wrong

### Backend Issues
- [ ] Check `TROUBLESHOOTING.md` → "Backend Not Responding"
- [ ] Review backend logs
- [ ] Verify environment variables
- [ ] Check Supabase connection

### Frontend Issues
- [ ] Check `TROUBLESHOOTING.md` → "Frontend Build Failures"
- [ ] Clear browser cache
- [ ] Check console for errors
- [ ] Verify API URL is correct

### Data Issues
- [ ] Check `TROUBLESHOOTING.md` → "Data Not Syncing"
- [ ] Test Supabase connection
- [ ] Check database logs
- [ ] Verify credentials

### Still Stuck?
- [ ] Read full `TROUBLESHOOTING.md`
- [ ] Check platform status pages
- [ ] Contact platform support
- [ ] Review deployment logs

---

## 📞 Support Contacts

### Platforms
- **Render**: https://render.com/support
- **Netlify**: https://www.netlify.com/support/
- **Supabase**: https://supabase.com/docs
- **Rork**: Contact Rork support

### Documentation
- All guides in project root
- `START_HERE.md` for overview
- `TROUBLESHOOTING.md` for problems

---

## ✅ Deployment Complete!

### Post-Deployment
- [ ] Saved all URLs and credentials
- [ ] Documented any custom changes
- [ ] Shared access with team
- [ ] Set up monitoring

### Celebrate! 🎉
- [ ] Your app is live! ✅
- [ ] All features working ✅
- [ ] Users can access it ✅
- [ ] You did it! 🚀

---

## 📝 Deployment Summary

Fill this out when complete:

```
Deployment Date: _______________

Frontend:
  Platform: ________________
  URL: ____________________
  Status: ✅ / ❌

Backend:
  Platform: ________________
  URL: ____________________
  Status: ✅ / ❌

Database:
  Platform: Supabase
  URL: https://oqspnszwjxzyvwqjvjiy.supabase.co
  Status: ✅

Total Time Taken: _______ minutes

Issues Encountered: _______________
_________________________________

Final Result: ✅ SUCCESS / ❌ NEEDS WORK

Notes:
_________________________________
_________________________________
```

---

**Congratulations on deploying your Kurdish Cuisine Cashier System!** 🎉

Keep this checklist for future deployments or updates.
