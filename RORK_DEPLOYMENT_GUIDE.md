# 🚀 Rork Deployment Guide
## Kurdish Cuisine Cashier System

This project is configured to run 100% on **Rork + Supabase** with no external deployment platforms.

---

## ✅ Current Configuration

### Environment Variables

#### Root `.env` (Frontend)
```env
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_RORK_API_BASE_URL=https://kurdish-cuisine-cashier-system.rork.app
```

#### Backend `.env`
```env
NODE_ENV=production
SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres
FRONTEND_URL=https://kurdish-cuisine-cashier-system.rork.app
PORT=3000
```

---

## 🧪 Testing Locally

### 1. Start Backend
```bash
cd backend
bun install
bun run dev
```

### 2. Test Health Endpoint
```bash
curl http://localhost:3000/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-19T...",
  "environment": "development"
}
```

### 3. Test Supabase Connection
```bash
curl http://localhost:3000/api/test
```

**Expected Response:**
```
🔥 Rork backend is live and connected to Supabase!
```

### 4. Start Frontend
```bash
bun run dev
```

---

## 🌍 Production Deployment

### Backend Routes Available:
- `GET /` - Backend status
- `GET /api/health` - Health check
- `GET /api/test` - Supabase connection test
- `POST /trpc/*` - tRPC API routes

### Expected Endpoints:
- Frontend: `https://kurdish-cuisine-cashier-system.rork.app`
- Backend: `https://kurdish-cuisine-cashier-system.rork.app/api/*`
- tRPC: `https://kurdish-cuisine-cashier-system.rork.app/trpc/*`

---

## 🔧 Configuration Details

### Backend Entry Point
- **File**: `backend/index.ts`
- **Port**: 3000 (configurable via `PORT` env var)
- **Framework**: Hono with Node.js server

### Package Scripts
```json
{
  "dev": "tsx watch --env-file=.env index.ts",
  "start": "tsx index.ts",
  "build": "tsc"
}
```

### Key Dependencies
- `hono` - Web framework
- `@hono/node-server` - Node.js adapter
- `@hono/trpc-server` - tRPC integration
- `@supabase/supabase-js` - Supabase client
- `dotenv` - Environment configuration
- `tsx` - TypeScript execution

---

## 📝 Verification Checklist

After deployment, verify:

- ✅ Backend health endpoint responds: `/api/health`
- ✅ Supabase connection works: `/api/test`
- ✅ tRPC routes accessible: `/trpc/*`
- ✅ Frontend loads and connects to backend
- ✅ Database queries work from mobile app

---

## 🐛 Troubleshooting

### Backend Not Starting
1. Check `backend/.env` exists and has correct values
2. Verify `SUPABASE_PROJECT_URL` is set (not `SUPABASE_URL`)
3. Run `bun install` in backend directory

### Supabase Connection Failed
1. Verify Supabase URL is correct
2. Check service role key has proper permissions
3. Test database URL with: 
   ```bash
   psql "postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres"
   ```

### Frontend Can't Connect
1. Verify `EXPO_PUBLIC_RORK_API_BASE_URL` in root `.env`
2. Check CORS settings in `backend/index.ts`
3. Ensure backend is running and accessible

---

## 🎯 Key Changes Made

1. ✅ Removed all Vercel/Render references
2. ✅ Renamed `SUPABASE_URL` → `SUPABASE_PROJECT_URL` (avoid case conflicts)
3. ✅ Unified backend entry to `backend/index.ts`
4. ✅ Added health check and test routes
5. ✅ Configured CORS for frontend
6. ✅ Set up tRPC integration
7. ✅ Production-ready environment configuration

---

## 📦 Project Structure

```
.
├── app/                    # React Native frontend
├── backend/
│   ├── index.ts           # Main backend entry (Hono + tRPC)
│   ├── hono.ts            # Old standalone Hono (deprecated)
│   ├── trpc/              # tRPC routes and config
│   └── .env               # Backend environment variables
├── lib/                   # Shared utilities
├── components/            # React components
├── .env                   # Frontend environment variables
└── RORK_DEPLOYMENT_GUIDE.md  # This file
```

---

## 🔐 Security Notes

- Never commit `.env` files to Git
- Use `SUPABASE_SERVICE_ROLE_KEY` only in backend
- Frontend uses `SUPABASE_ANON_KEY` for client operations
- All sensitive keys are in `.env` files (ignored by Git)

---

## 📞 Support

If you encounter issues:
1. Check this guide's troubleshooting section
2. Verify all environment variables are set correctly
3. Test endpoints locally before deploying
4. Check backend logs for detailed error messages

---

**Last Updated**: January 2025  
**Platform**: Rork + Supabase  
**Status**: Production Ready ✅
