# ⚡ Vercel Deployment - Quick Start

## 🎯 Goal
Get your Kurdish Cuisine backend running on Vercel Edge Runtime with `/api/health` live.

---

## 📦 Step 1: Install Dependencies

```bash
cd backend
npm install superjson
cd ..
```

---

## 🔧 Step 2: Update Backend Package.json

Edit `backend/package.json` and add this to the scripts section:

```json
"vercel-build": "echo 'Edge runtime build'"
```

Your scripts should look like:
```json
"scripts": {
  "dev": "tsx watch --env-file=.env index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "vercel-build": "echo 'Edge runtime build'"
}
```

---

## 🚀 Step 3: Deploy to Vercel

### Option A: Deploy via Vercel CLI
```bash
cd backend
npx vercel
```

### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - **Root Directory:** `backend`
   - **Framework Preset:** Other
   - **Build Command:** Leave empty or use `npm run vercel-build`
   - **Install Command:** `npm install`
   - **Node.js Version:** 20.x
5. Click "Deploy"

---

## 🔐 Step 4: Add Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

**Save and redeploy** after adding these.

---

## ✅ Step 5: Test Your Deployment

### Test Health Endpoint
```bash
curl https://your-backend-domain.vercel.app/api/health
```

Expected response:
```json
{"status":"ok","timestamp":"2025-10-24T12:34:56.789Z"}
```

### Test Root Endpoint
```bash
curl https://your-backend-domain.vercel.app/
```

Expected response:
```
✅ Kurdish Cuisine API is running on Vercel Edge Runtime
```

### Test tRPC Route
```bash
curl https://your-backend-domain.vercel.app/api/trpc/example.hi
```

Should return a tRPC response (not an error).

---

## 🔗 Step 6: Connect Frontend

Update your root `.env` file:

```bash
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend-domain.vercel.app
```

Then redeploy your frontend (or restart Expo locally).

---

## 🎉 Done!

Your backend is now live on Vercel Edge Runtime. All your tRPC routes are accessible at:

```
https://your-backend-domain.vercel.app/api/trpc/*
```

---

## 🐛 Troubleshooting

### Deployment fails
- Check Vercel logs in the dashboard
- Verify `superjson` is installed
- Ensure `vercel.json` is correct

### Health check returns 404
- Verify deployment succeeded
- Check routes in `vercel.json`
- Ensure `/api/index.ts` exists

### CORS errors in frontend
- Add frontend URL to `FRONTEND_URL` in Vercel environment variables
- Redeploy backend

### tRPC routes not working
- Check environment variables are set
- Verify Supabase credentials are correct
- Check Vercel function logs for errors

---

## 📚 More Resources

- **Detailed Guide:** See `backend/VERCEL_DEPLOYMENT.md`
- **Environment Setup:** See `ENV_SETUP_GUIDE.md`
- **Backend Setup:** See `backend/SETUP_INSTRUCTIONS.md`

---

**Need help? Check the Vercel deployment logs or review the detailed guides above.**
