# 🔐 Environment Variables Setup Guide

## Overview

This guide helps you configure environment variables for both local development and production deployment.

---

## 📁 Local Development Setup

### 1. Root `.env` (Frontend)

Update your root `.env` file:

```bash
# Backend API URL (for tRPC)
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000

# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Features (Optional)
EXPO_PUBLIC_OPENAI_API_KEY=sk-xxxx
EXPO_PUBLIC_AI_API_URL=https://api.openai.com/v1/chat/completions
```

### 2. `backend/.env` (Backend)

Create or update `backend/.env`:

```bash
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server
PORT=3000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:8081
```

---

## 🚀 Production Setup

### Vercel Backend Environment Variables

In your Vercel Backend project settings, add:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=https://your-frontend-domain.vercel.app
NODE_ENV=production
```

### Vercel Frontend Environment Variables

In your Vercel Frontend project settings, add:

```bash
# Point to your deployed backend
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-backend.vercel.app

# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# AI Features (if using)
EXPO_PUBLIC_OPENAI_API_KEY=sk-xxxx
EXPO_PUBLIC_AI_API_URL=https://api.openai.com/v1/chat/completions
```

---

## 🔄 How It Works

### Frontend → Backend Communication

1. **Frontend** uses `EXPO_PUBLIC_RORK_API_BASE_URL` to connect to backend
2. **tRPC Client** automatically appends `/api/trpc` to the base URL
3. **Backend** receives requests at `/api/trpc/*` routes
4. **Backend** responds with data from Supabase

### Example Flow:
```
Frontend: EXPO_PUBLIC_RORK_API_BASE_URL=https://backend.vercel.app
↓
tRPC constructs: https://backend.vercel.app/api/trpc/menu.getAll
↓
Backend receives: POST /api/trpc/menu.getAll
↓
Backend queries Supabase using SUPABASE_SERVICE_ROLE_KEY
↓
Backend returns data to frontend
```

---

## ✅ Verification Checklist

### Local Development
- [ ] Root `.env` has `EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000`
- [ ] `backend/.env` has all Supabase credentials
- [ ] `backend/.env` has `FRONTEND_URL=http://localhost:8081`
- [ ] Run `npm run start:fullstack` - both servers start
- [ ] Open `http://localhost:8081` - app loads without errors
- [ ] Check Network tab - API calls go to `localhost:3000/api/trpc/*`

### Production
- [ ] Vercel Backend has all environment variables set
- [ ] Vercel Frontend has `EXPO_PUBLIC_RORK_API_BASE_URL` pointing to backend URL
- [ ] Both projects deployed successfully
- [ ] Frontend can fetch data from backend
- [ ] CORS configured correctly (no CORS errors in console)
- [ ] Health check works: `curl https://backend.vercel.app/api/health`

---

## 🐛 Common Issues

### Issue: "No base url found"
**Cause:** Missing `EXPO_PUBLIC_RORK_API_BASE_URL` in frontend ENV
**Fix:** Add the variable to root `.env` and restart Expo

### Issue: "Network request failed"
**Cause:** Backend not running or wrong URL
**Fix:** 
- Check backend is running: `curl http://localhost:3000/api/health`
- Verify `EXPO_PUBLIC_RORK_API_BASE_URL` matches backend URL

### Issue: "CORS error"
**Cause:** Frontend domain not allowed in backend CORS config
**Fix:** Add frontend URL to `FRONTEND_URL` in backend ENV and update CORS origins in `backend/api/index.ts`

### Issue: "Supabase error: Invalid API key"
**Cause:** Wrong Supabase keys or missing keys
**Fix:** Double-check keys in Supabase Dashboard → Project Settings → API

---

## 📋 Quick Setup Commands

```bash
# Setup backend
cd backend
npm install superjson
cp ../.env .env  # Copy and modify as needed

# Test backend locally
npm run dev
# Should see: "Backend running on http://localhost:3000"

# In another terminal, test health
curl http://localhost:3000/api/health
# Should return: {"status":"ok","timestamp":"..."}

# Test frontend
cd ..
npm run start
# Open http://localhost:8081
```

---

## 🎯 Production Deployment Flow

1. **Deploy Backend First:**
   - Push backend to GitHub
   - Connect to Vercel
   - Set environment variables
   - Deploy and note the URL (e.g., `https://backend.vercel.app`)

2. **Update Frontend ENV:**
   - Set `EXPO_PUBLIC_RORK_API_BASE_URL=https://backend.vercel.app`
   - Add to Vercel Frontend project settings

3. **Deploy Frontend:**
   - Push frontend to GitHub (or same repo)
   - Connect to Vercel
   - Deploy

4. **Update Backend CORS:**
   - Add frontend URL to `FRONTEND_URL` in Vercel Backend settings
   - Redeploy backend

5. **Test Everything:**
   - Open frontend app
   - Check Network tab for successful API calls
   - Verify data loads from Supabase

---

**✅ You're all set! Your Kurdish Cuisine system is now production-ready.**
