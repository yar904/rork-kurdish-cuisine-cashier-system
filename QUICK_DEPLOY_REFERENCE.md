# 🚀 Quick Deploy Reference

## One-Page Deployment Guide for Rork Native Hosting

---

## ⚡ TL;DR

**Server Root:** `backend`  
**Start Command:** `bun run start`  
**Entry Point:** `backend/hono.ts`  
**Base URL:** `https://kurdish-cuisine-cashier-system.rork.app`

---

## 📋 Environment Variables (Add to Rork Project Settings)

```bash
NODE_ENV=production
SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4
DATABASE_URL=postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres
FRONTEND_URL=https://kurdish-cuisine-cashier-system.rork.app
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
EXPO_PUBLIC_RORK_API_BASE_URL=https://kurdish-cuisine-cashier-system.rork.app
```

---

## 🧪 Quick Test Commands

```bash
# Health Check
curl https://kurdish-cuisine-cashier-system.rork.app/api/health

# Supabase Test
curl https://kurdish-cuisine-cashier-system.rork.app/api/test

# Root Status
curl https://kurdish-cuisine-cashier-system.rork.app/

# Run Verification Script
bash verify-deployment.sh
```

---

## 🎯 Expected Responses

### Health Check
```json
{
  "status": "ok",
  "timestamp": "2025-01-25T12:00:00.000Z",
  "environment": "production"
}
```

### Supabase Test
```json
{
  "message": "🔥 Rork backend is live and connected to Supabase!",
  "supabaseConnected": true,
  "sample": [...]
}
```

---

## 📂 Project Structure

```
backend/
├── hono.ts          ← Main entry point
├── .env             ← Backend config
├── package.json
└── trpc/
    └── app-router.ts

app/                 ← Frontend (Expo)
lib/
├── trpc.ts          ← API client
└── supabase.ts

.env                 ← Frontend config
```

---

## 🔥 Local Development

```bash
cd backend
bun install
bun run dev
```

Test at: http://localhost:3000/api/health

---

## ✅ Deployment Checklist

- [ ] Environment variables added to Rork
- [ ] Server root set to `backend`
- [ ] Start command: `bun run start`
- [ ] Health check returns 200 OK
- [ ] Supabase connection verified
- [ ] Frontend API URL updated

---

## 🆘 Troubleshooting

| Issue | Solution |
|-------|----------|
| 500 Error | Check environment variables in Rork |
| CORS Error | Verify FRONTEND_URL matches your domain |
| Database Error | Confirm Supabase credentials |
| Connection Timeout | Check backend server status in Rork dashboard |

---

## 📞 Support Resources

- 📖 Full Guide: `DEPLOYMENT_COMPLETE.md`
- 🔧 Detailed Setup: `RORK_NATIVE_DEPLOYMENT.md`
- ✅ Verification: `verify-deployment.sh`

---

**Status:** 🟢 Ready for Production  
**Last Updated:** 2025-01-25  
**Platform:** Rork Native Hosting
