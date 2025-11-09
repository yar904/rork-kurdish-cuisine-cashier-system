# 🚀 Deploy to Netlify NOW - Quick Guide

## ⚡ 3-Minute Deployment

### Step 1: Go to Netlify
Visit: https://app.netlify.com

### Step 2: Click "Add new site"
- Choose "Import an existing project"
- Or click "Deploy manually" to drag & drop

### Step 3: Connect Repository (if using Git)
- Select your GitHub/GitLab repository
- Or continue to manual deploy

### Step 4: Configure Build Settings

**Build command**:
```
npx expo export -p web
```

**Publish directory**:
```
dist
```

**Build environment variables** (Add in "Environment variables" section):
```
NODE_VERSION=20
NPM_FLAGS=--legacy-peer-deps
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
EXPO_PUBLIC_RORK_API_BASE_URL=https://kurdish-cuisine-cashier-system.rork.app
NODE_ENV=production
```

### Step 5: Deploy!
Click "Deploy site" and wait 2-3 minutes

---

## 🎯 Manual Deploy (No Git Required)

If you want to deploy without connecting Git:

### 1. Build locally
```bash
npm run build
```

### 2. Install Netlify CLI
```bash
npm install -g netlify-cli
```

### 3. Login to Netlify
```bash
netlify login
```

### 4. Deploy
```bash
netlify deploy --prod --dir=dist
```

### 5. Follow prompts
- Create new site or link existing
- Confirm production deployment

**Done!** Your site is live.

---

## 🔗 After Deployment

### 1. Get your URL
Netlify will give you a URL like:
```
https://random-name-123.netlify.app
```

### 2. Change site name (optional)
- Go to Site settings → Site details
- Click "Change site name"
- Set to: `tapse` (if available)
- URL becomes: `https://tapse.netlify.app`

### 3. Add custom domain (optional)
- Go to Site settings → Domain management
- Click "Add domain"
- Follow DNS instructions

---

## ✅ Verify Deployment

Test these URLs after deployment:

1. **Homepage**: `https://your-site.netlify.app/`
2. **Menu**: `https://your-site.netlify.app/menu`
3. **Staff Login**: `https://your-site.netlify.app/staff-login`
4. **Kitchen**: `https://your-site.netlify.app/kitchen`
5. **Admin**: `https://your-site.netlify.app/admin`

All should load without 404 errors.

---

## 🚨 If Something Goes Wrong

### Build Fails

**Check**:
- Node version is set to 20
- NPM_FLAGS includes `--legacy-peer-deps`
- All env variables are added

**View build logs**:
- Deploys → Click failed deploy → View logs

### Routes Show 404

**Fix**:
- Ensure `netlify.toml` has redirect rules (it does ✅)
- Redeploy site

### Environment Variables Not Working

**Fix**:
- Must start with `EXPO_PUBLIC_` for frontend
- Add them in: Site settings → Environment variables
- Rebuild site after adding

---

## 🎉 That's It!

Your app is now live on Netlify with:
- ✅ Auto-SSL (HTTPS)
- ✅ Global CDN
- ✅ Instant cache invalidation
- ✅ Automatic deployments (if Git connected)
- ✅ Free hosting

**Backend is already running** on:
https://kurdish-cuisine-cashier-system.rork.app

**Everything works together automatically!**

---

## 📞 Need Help?

- Netlify Docs: https://docs.netlify.com
- Netlify Support: https://answers.netlify.com
- Rork Support: Contact via platform

---

**Deployment Status**: ✅ **READY**

**Time to Live**: ⏱️ **< 5 minutes**
