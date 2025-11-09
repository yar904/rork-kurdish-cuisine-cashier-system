# ⚡ Quick Start Guide

## Kurdish Cuisine Cashier System

---

## 🏃 Start Developing

```bash
# 1. Install dependencies
bun install

# 2. Start backend (in one terminal)
cd backend
bun install
bun run dev

# 3. Start frontend (in another terminal)
bun run dev
```

---

## 🧪 Test Backend

```bash
# Health check
curl http://localhost:3000/api/health

# Supabase connection
curl http://localhost:3000/api/test

# Or use the test script
chmod +x test-backend.sh
./test-backend.sh
```

---

## 📱 Test on Device

1. Start both backend and frontend
2. Scan QR code with Expo Go app
3. App will connect to `http://localhost:3000`

---

## 🌍 Production URLs

- **Frontend**: https://kurdish-cuisine-cashier-system.rork.app
- **Backend**: https://kurdish-cuisine-cashier-system.rork.app
- **Health Check**: https://kurdish-cuisine-cashier-system.rork.app/api/health
- **tRPC**: https://kurdish-cuisine-cashier-system.rork.app/trpc

---

## 🔐 Environment Setup

### Copy and customize:
```bash
# Root .env (frontend)
cp .env.example .env

# Backend .env
cp backend/.env.example backend/.env
```

### Current values are already set for:
- ✅ Supabase connection
- ✅ Production URLs
- ✅ Database credentials

---

## 🛠️ Common Commands

```bash
# Install dependencies
bun install

# Start development
bun run dev

# Start backend only
cd backend && bun run dev

# Build for production
bun run build

# Type check
bun run type-check

# Lint
bun run lint
```

---

## 📚 Documentation

- **Full Guide**: `RORK_DEPLOYMENT_GUIDE.md`
- **Completion Report**: `DEPLOYMENT_COMPLETE.md`
- **Database Setup**: `DATABASE_SETUP.md`
- **Platform Overview**: `PLATFORM_OVERVIEW.md`

---

## 🚨 Troubleshooting

### Backend won't start
```bash
cd backend
rm -rf node_modules
bun install
bun run dev
```

### Frontend can't connect
1. Check backend is running on port 3000
2. Verify `.env` has correct `EXPO_PUBLIC_RORK_API_BASE_URL`
3. Restart frontend: Ctrl+C and `bun run dev`

### Database errors
1. Check Supabase credentials in `backend/.env`
2. Verify database is accessible
3. Check tables exist (see `DATABASE_SETUP.md`)

---

## ✅ Everything Working?

You should see:
- ✅ Backend running on http://localhost:3000
- ✅ Frontend shows QR code
- ✅ `/api/health` returns `{"status":"ok"}`
- ✅ `/api/test` returns success message
- ✅ App loads on device/simulator

---

**Need Help?** Check `RORK_DEPLOYMENT_GUIDE.md` for detailed instructions.
