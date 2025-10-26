# Complete Netlify Deployment Guide for Kurdish Cuisine System

## 🚨 IMPORTANT: Your App Architecture

Your app consists of **TWO parts**:
1. **Frontend (Expo/React Native Web)** - The UI that users see
2. **Backend (Hono + tRPC)** - The API server that handles data

Both parts need to be deployed for your app to work properly.

## The "Snapshot Not Found" Issue

This error occurs on Rork because the deployment snapshot is missing. This is a Rork platform issue, not your code.

---

## ✅ Solution: Deploy to Netlify (Frontend + Backend)

### Step 1: Deploy Backend First

Your backend needs to run on a Node.js server. **Netlify can host both!**

#### Option A: Use Netlify Functions (Recommended)

1. Create a new folder: `netlify/functions/`
2. Create file: `netlify/functions/api.ts`

```typescript
import { serve } from '@hono/node-server';
import app from '../../backend/hono';

export default async (req: Request) => {
  return await app.fetch(req);
};

export const config = {
  path: "/api/*"
};
```

3. Update `netlify.toml`:

```toml
[build]
  command = "npx expo export -p web"
  publish = "dist"
  functions = "netlify/functions"
  
[build.environment]
  NODE_VERSION = "20"
  NPM_FLAGS = "--legacy-peer-deps"
  EXPO_NO_DOTENV = "1"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  node_bundler = "esbuild"
  external_node_modules = ["@supabase/supabase-js"]
```

#### Option B: Use a Separate Backend Host (Simpler)

Deploy your backend to **Render.com** (free tier available):

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repo
4. Configure:
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Environment**: Node
5. Add all environment variables from `backend/.env`
6. Deploy

Once deployed, you'll get a URL like: `https://your-app.onrender.com`

7. Update your `.env` file:
```
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-app.onrender.com
```

---

### Step 2: Deploy Frontend to Netlify

#### A. Via Netlify Dashboard (Easiest)

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Connect to your Git repository
4. Configure build settings:
   - **Build command**: `npx expo export -p web`
   - **Publish directory**: `dist`
   - **Node version**: 20

5. Add Environment Variables (click "Site settings" → "Environment variables"):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend-url.com
   ```

6. Click "Deploy site"

#### B. Via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

---

### Step 3: Update Environment Variables

After deploying both backend and frontend, update these:

**.env (Frontend)**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend.onrender.com
```

**backend/.env (Backend)**
```bash
SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
FRONTEND_URL=https://your-site.netlify.app
NODE_ENV=production
```

---

### Step 4: Test Your Deployment

1. Visit your Netlify URL: `https://your-site.netlify.app`
2. Check that all pages load:
   - Menu page
   - Cashier page  
   - Kitchen page
   - Waiter page
   - Admin panel
   - Analytics

3. Test data flow:
   - Create an order
   - Check if it appears in Kitchen view
   - Update order status
   - Verify changes sync across tabs

---

## 🔧 Troubleshooting

### Issue: "Failed to fetch" or CORS errors
**Solution**: Update backend CORS settings in `backend/hono.ts`:

```typescript
app.use("*", cors({
  origin: [
    "https://your-site.netlify.app",
    "http://localhost:8081",
    "http://localhost:3000",
  ],
  credentials: true,
}));
```

### Issue: Environment variables not working
**Solution**: Make sure all frontend env vars start with `EXPO_PUBLIC_`

### Issue: Backend not responding
**Solution**: Check backend logs on Render.com dashboard

### Issue: Build fails on Netlify
**Solution**: 
1. Clear cache and retry
2. Check Node version matches (20)
3. Use `--legacy-peer-deps` flag

---

## 📱 Why Two Deployments?

Your app uses:
- **React Native Web** for the frontend (static HTML/JS)
- **tRPC + Hono** for the backend (requires Node.js server)

Netlify can host both, but they need separate configurations:
- Frontend → Static site
- Backend → Serverless function OR separate service

---

## ✨ Alternative: All-in-One Deployment

If you want everything in one place, consider:

1. **Vercel** - Better support for full-stack apps
2. **Railway.app** - Simple deployment for Expo + Node.js
3. **Fly.io** - Container-based deployment

---

## 📝 Quick Deploy Checklist

- [ ] Backend deployed (Render/Netlify Functions)
- [ ] Backend URL obtained
- [ ] Frontend environment variables updated
- [ ] Frontend deployed to Netlify
- [ ] CORS configured on backend
- [ ] All pages load correctly
- [ ] Data sync works between views
- [ ] Mobile responsive
- [ ] QR codes generated for tables

---

## 🆘 Need Help?

If you're still seeing "snapshot not found", that's a Rork platform issue. Contact Rork support to restore the snapshot or migrate your deployment completely to Netlify using this guide.

Your app is **ready to deploy** - the code is fine, you just need the right hosting setup!
