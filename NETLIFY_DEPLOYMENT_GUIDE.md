# Netlify Deployment Guide - Kurdish Cuisine Cashier System

This guide will walk you through deploying your restaurant management system to Netlify.

## 🚀 Prerequisites

Before starting, ensure you have:
- A [Netlify account](https://app.netlify.com/signup) (free tier works)
- Your [Supabase](https://supabase.com) project URL and anon key
- Git repository with your code (GitHub, GitLab, or Bitbucket)

---

## 📋 Step-by-Step Deployment

### Step 1: Prepare Your Project

1. **Add build script to package.json**

Open `package.json` and add these scripts:

```json
"scripts": {
  "build": "expo export -p web",
  "build:web": "expo export -p web"
}
```

2. **Create Netlify configuration file**

Create a file named `netlify.toml` in your project root with this content:

```toml
[build]
  command = "npm run build"
  publish = "dist"
  
[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  force = false
```

3. **Update .gitignore** (if needed)

Make sure your `.gitignore` includes:
```
dist/
.expo/
node_modules/
.env
.env.local
```

---

### Step 2: Push Code to Git Repository

If you haven't already:

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit for Netlify deployment"

# Add remote (replace with your repository URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to main branch
git push -u origin main
```

---

### Step 3: Deploy to Netlify

#### Option A: Deploy via Netlify Dashboard (Recommended)

1. **Go to Netlify**
   - Visit [https://app.netlify.com](https://app.netlify.com)
   - Log in or create an account

2. **Import Project**
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Authorize Netlify to access your repositories
   - Select your restaurant system repository

3. **Configure Build Settings**
   - **Branch to deploy**: `main` (or your default branch)
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - Click "Show advanced" to add environment variables

4. **Add Environment Variables**
   Click "Add environment variable" for each:
   
   ```
   EXPO_PUBLIC_SUPABASE_URL = your_supabase_project_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
   EXPO_PUBLIC_RORK_API_BASE_URL = your_backend_url (see backend setup below)
   ```

5. **Deploy**
   - Click "Deploy site"
   - Wait for the build to complete (usually 2-5 minutes)
   - Your site will be live at: `https://random-name-123456.netlify.app`

#### Option B: Deploy via Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize your site
netlify init

# Follow the prompts:
# - Create & configure a new site
# - Choose your team
# - Site name: kurdish-cuisine-cashier (or your preferred name)
# - Build command: npm run build
# - Publish directory: dist

# Deploy
netlify deploy --prod
```

---

### Step 4: Configure Custom Domain (Optional)

1. Go to your site in Netlify dashboard
2. Click "Domain settings"
3. Click "Add custom domain"
4. Enter your domain (e.g., `restaurant.yourdomain.com`)
5. Follow Netlify's instructions to configure DNS:
   - Add a CNAME record pointing to your Netlify subdomain
   - Or use Netlify DNS for easier setup

---

### Step 5: Backend Deployment

Your backend needs to be hosted separately. Options:

#### Option 1: Deploy Backend to Render (Recommended)

1. Go to [render.com](https://render.com)
2. Create a new "Web Service"
3. Connect your Git repository
4. Configure:
   - **Name**: kurdish-cuisine-backend
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `bun run start` or `node index.ts`
   - **Environment**: Add your backend `.env` variables
5. Deploy and copy the URL (e.g., `https://kurdish-cuisine-backend.onrender.com`)
6. Update `EXPO_PUBLIC_RORK_API_BASE_URL` in Netlify to this URL

#### Option 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Create new project from GitHub repo
3. Configure:
   - Select the `backend` directory
   - Add environment variables from `backend/.env`
4. Deploy and get the URL
5. Update Netlify environment variable

#### Option 3: Deploy Backend to Fly.io

1. Install Fly CLI: `curl -L https://fly.io/install.sh | sh`
2. Login: `fly auth login`
3. Navigate to backend: `cd backend`
4. Initialize: `fly launch --name kurdish-cuisine-backend`
5. Deploy: `fly deploy`
6. Set secrets: `fly secrets set SUPABASE_URL=xxx SUPABASE_KEY=xxx`

---

### Step 6: Update Environment Variables in Netlify

After backend is deployed:

1. Go to Netlify dashboard → Your site → Site settings → Environment variables
2. Update `EXPO_PUBLIC_RORK_API_BASE_URL` with your backend URL
3. Example: `https://kurdish-cuisine-backend.onrender.com`
4. Click "Rebuild site" to apply changes

---

### Step 7: Enable HTTPS and Set Up Redirects

Netlify automatically provides HTTPS. To ensure it works:

1. Go to Site settings → Domain management
2. Check "Force HTTPS" is enabled
3. Your site is now secure! 🔒

---

## 🧪 Testing Your Deployment

1. **Open your Netlify URL**
   - Check if the landing page loads
   - Try different routes (menu, admin, cashier)

2. **Test menu functionality**
   - Navigate to menu page
   - Check if items load from Supabase

3. **Test backend connection**
   - Try creating an order
   - Check kitchen screen updates
   - Verify data persistence

4. **Test on mobile**
   - Open the URL on your phone
   - Check responsive design
   - Test touch interactions

---

## 🔧 Continuous Deployment

Netlify automatically deploys when you push to your Git repository:

```bash
# Make changes to your code
git add .
git commit -m "Update menu design"
git push origin main

# Netlify automatically builds and deploys! ✨
```

Monitor builds at: `https://app.netlify.com/sites/YOUR-SITE/deploys`

---

## 📊 Post-Deployment Checklist

- [ ] Site loads at Netlify URL
- [ ] Backend API is accessible
- [ ] Menu items load from database
- [ ] Can create orders
- [ ] Kitchen screen updates
- [ ] Service requests work
- [ ] Analytics loads data
- [ ] QR codes generate correctly
- [ ] Mobile responsive
- [ ] All routes work (no 404s)

---

## 🐛 Troubleshooting

### Issue: "Page not found" on refresh

**Solution**: Check `netlify.toml` has the redirect rule (see Step 1)

### Issue: "Failed to fetch" or API errors

**Solution**: 
1. Check `EXPO_PUBLIC_RORK_API_BASE_URL` is correct
2. Ensure backend is running
3. Check backend CORS settings allow your Netlify domain

### Issue: Environment variables not working

**Solution**: 
1. All Expo public variables must start with `EXPO_PUBLIC_`
2. Rebuild site after changing environment variables
3. Clear cache: Site settings → Build & deploy → Clear cache and retry deploy

### Issue: Build fails

**Solution**:
```bash
# Test build locally first
npm run build

# Check for errors
# Fix any TypeScript errors
# Ensure all dependencies are in package.json
```

### Issue: Backend connection fails

**Solution**: Add backend URL to Supabase allowed origins:
1. Go to Supabase dashboard
2. Settings → API
3. Add your Netlify URL to allowed origins

---

## 📞 Support

If you encounter issues:
1. Check Netlify build logs: Site → Deploys → [Latest deploy]
2. Check browser console for errors
3. Verify all environment variables are set
4. Ensure backend is running and accessible

---

## 🎉 Your Site is Live!

Your restaurant management system is now deployed and accessible worldwide!

**Next Steps:**
- Share the URL with your staff
- Generate QR codes for tables
- Train staff on the system
- Monitor analytics
- Collect feedback

---

## 🔄 Updating Your Site

To update your live site:

```bash
# Make changes
# Test locally: npm start

# Commit and push
git add .
git commit -m "Your update message"
git push

# Netlify auto-deploys in ~2 minutes!
```

---

## 💰 Cost Breakdown

**Netlify:**
- Free tier: 100GB bandwidth/month, 300 build minutes
- Sufficient for most restaurants
- Upgrade if needed: $19/month

**Backend Hosting (Render/Railway):**
- Free tier available
- Paid: ~$7-10/month

**Supabase:**
- Free tier: 500MB database, 2GB bandwidth
- Paid: Starts at $25/month

**Total:** Can start completely free! 🎉

---

## 📝 Important Notes

1. **Database**: Your Supabase database contains all your data
2. **Backups**: Supabase handles automated backups
3. **Scaling**: Both Netlify and backend hosts auto-scale
4. **Performance**: Your app is served via CDN (fast globally)
5. **Updates**: Zero-downtime deployments

---

## 🌟 Optimization Tips

1. **Custom Domain**: Use your restaurant's domain
2. **Analytics**: Enable Netlify Analytics for insights
3. **Forms**: Use Netlify Forms for contact/feedback
4. **Functions**: Consider Netlify Functions for serverless backend
5. **Edge**: Use Netlify Edge for better performance

---

## 🔗 Useful Links

- [Netlify Documentation](https://docs.netlify.com)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [Supabase Documentation](https://supabase.com/docs)
- [Your Netlify Dashboard](https://app.netlify.com)

---

**Deployment Date**: 2025-10-26
**System Version**: 1.0.0
**Platform**: Tapse - Kurdish Cuisine Cashier System
