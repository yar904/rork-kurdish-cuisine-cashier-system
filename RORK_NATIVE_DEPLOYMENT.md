# 🚀 Rork Native Deployment Guide
## Kurdish Cuisine Cashier System

---

## ✅ Deployment Configuration Complete

Your project is now configured for **Rork Native Hosting** with:
- ✅ Backend server root: `backend/`
- ✅ Entry point: `backend/hono.ts`
- ✅ Runtime: Bun
- ✅ Database: Supabase
- ✅ Frontend: Expo Web

---

## 📋 Deployment Steps

### 1️⃣ Backend Configuration

**Server Root Directory:**
```
backend/
```

**Start Command:**
```bash
bun run start
```

**Development Command:**
```bash
bun run dev
```

**Build Command:**
```bash
echo 'No build step needed for Bun runtime'
```

---

### 2️⃣ Environment Variables (Auto-Injected by Rork)

Add these to your **Rork Project Settings → Environment Variables**:

```bash
# Backend Environment Variables
NODE_ENV=production
SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4
DATABASE_URL=postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres
FRONTEND_URL=https://kurdish-cuisine-cashier-system.rork.app
PORT=3000

# Frontend Environment Variables (for Expo)
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
EXPO_PUBLIC_RORK_API_BASE_URL=https://kurdish-cuisine-cashier-system.rork.app
```

---

### 3️⃣ API Endpoints

After deployment, your backend will be available at:

**Base URL:**
```
https://kurdish-cuisine-cashier-system.rork.app
```

**Health Check:**
```
GET https://kurdish-cuisine-cashier-system.rork.app/api/health
```
Expected Response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-25T12:00:00.000Z",
  "environment": "production"
}
```

**Supabase Connection Test:**
```
GET https://kurdish-cuisine-cashier-system.rork.app/api/test
```
Expected Response:
```json
{
  "message": "🔥 Rork backend is live and connected to Supabase!",
  "supabaseConnected": true,
  "sample": [...]
}
```

**tRPC Endpoint:**
```
POST https://kurdish-cuisine-cashier-system.rork.app/trpc
```

---

### 4️⃣ Testing Deployment

**From Terminal:**
```bash
# Health check
curl https://kurdish-cuisine-cashier-system.rork.app/api/health

# Supabase connection test
curl https://kurdish-cuisine-cashier-system.rork.app/api/test
```

**From Browser:**
Open: https://kurdish-cuisine-cashier-system.rork.app/api/health

---

### 5️⃣ Local Testing

Before deployment, test locally:

```bash
# Navigate to backend
cd backend

# Install dependencies
bun install

# Run development server
bun run dev
```

Then visit:
- http://localhost:3000/api/health
- http://localhost:3000/api/test

---

## 🔧 Project Structure

```
backend/
├── hono.ts              # Main server entry point (tRPC + health checks)
├── index.ts             # Legacy health check server (can be removed)
├── .env                 # Backend environment variables
├── package.json         # Backend dependencies
└── trpc/
    ├── app-router.ts    # tRPC router
    └── routes/          # API routes

app/                     # Frontend (Expo)
lib/
├── trpc.ts              # tRPC client configuration
└── supabase.ts          # Supabase client

.env                     # Frontend environment variables
```

---

## 📝 Notes

1. **Backend runs on `backend/hono.ts`** - This includes:
   - tRPC server (`/trpc/*`)
   - Health check (`/api/health`)
   - Supabase test (`/api/test`)
   - Root status (`/`)

2. **Environment variables are auto-injected** by Rork from project settings

3. **CORS is configured** for:
   - Production: `https://kurdish-cuisine-cashier-system.rork.app`
   - Local dev: `http://localhost:8081`
   - Expo: `exp://` protocol

4. **No build step required** - Bun runs TypeScript natively

---

## ✅ Deployment Checklist

- [ ] Backend folder set as server root
- [ ] Environment variables added to Rork project settings
- [ ] Start command: `bun run start`
- [ ] Health endpoint returns OK
- [ ] Supabase connection test passes
- [ ] Frontend connected to API via `EXPO_PUBLIC_RORK_API_BASE_URL`
- [ ] tRPC client configured correctly

---

## 🎉 Deployment Complete!

Your Kurdish Cuisine Cashier System is now running on **Rork Native Hosting** with:
- ⚡ Bun runtime for fast performance
- 🗄️ Supabase for database
- 🔌 tRPC for type-safe APIs
- 📱 Expo for cross-platform mobile app

**Test your deployment:**
```bash
curl https://kurdish-cuisine-cashier-system.rork.app/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`
