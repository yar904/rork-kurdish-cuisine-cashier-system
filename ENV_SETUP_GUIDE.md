# 🔐 Environment Setup Guide - Kurdish Cuisine Cashier System

## 📦 Quick Setup

### 1. **Copy Environment Files**

```bash
# Root project .env is already configured
# Backend .env is already configured
# Just verify they exist:
ls -la .env backend/.env
```

### 2. **Verify Supabase Connection**

Your Supabase project: https://oqspnszwjxzyvwqjvjiy.supabase.co

- ✅ Database is set up
- ✅ Tables created (menu_items, orders, order_items, tables, etc.)
- ✅ RLS policies enabled

### 3. **Update Vercel Environment Variables**

#### **Option A: Via Vercel Dashboard** (Recommended)

1. Go to: https://vercel.com/your-username/rork-kurdish-cuisine-cashier-system/settings/environment-variables

2. Add each variable below for **ALL environments** (Production, Preview, Development):

```
NODE_ENV = production
SUPABASE_URL = https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (get from Supabase)
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (get from Supabase)
DATABASE_URL = postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres
FRONTEND_URL = https://rork-kurdish-cuisine-cashier-system.vercel.app
EXPO_PUBLIC_SUPABASE_URL = https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY = (same as SUPABASE_ANON_KEY)
EXPO_PUBLIC_API_BASE_URL = https://rork-kurdish-cuisine-cashier-system.vercel.app
EXPO_PUBLIC_RORK_API_BASE_URL = https://rork-kurdish-cuisine-cashier-system.vercel.app
```

3. Click **Save**

#### **Option B: Via Vercel CLI**

```bash
vercel env pull .env.local
vercel env add NODE_ENV production
vercel env add SUPABASE_URL production
# ... (add all variables above)
```

### 4. **Deploy**

```bash
vercel --prod
```

---

## 🔍 Get Your Supabase Keys

1. Go to: https://supabase.com/dashboard/project/oqspnszwjxzyvwqjvjiy/settings/api

2. Copy:
   - **URL**: `https://oqspnszwjxzyvwqjvjiy.supabase.co`
   - **anon/public key**: Under "Project API keys" → `anon` `public`
   - **service_role key**: Under "Project API keys" → `service_role` (⚠️ Keep secret!)

3. Copy **Database URL**:
   - Go to: https://supabase.com/dashboard/project/oqspnszwjxzyvwqjvjiy/settings/database
   - Copy the connection string

---

## 🧪 Test Your Setup

### **Local Testing**

```bash
# Start both backend and frontend
npm run start:fullstack

# Or manually:
# Terminal 1
cd backend && npx tsx --env-file=.env api/index.ts

# Terminal 2
npx expo start
```

Test backend:
```bash
curl http://localhost:3000/api/health
```

### **Production Testing**

```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-15T12:00:00.000Z"
}
```

---

## 🔐 Security Notes

### **Never commit:**
- `.env`
- `backend/.env`
- Any file containing `SUPABASE_SERVICE_ROLE_KEY`

### **Safe to commit:**
- `.env.example`
- Documentation files

### **Environment Variable Rules:**
- `EXPO_PUBLIC_*` → Visible to users (bundled in frontend)
- `SUPABASE_SERVICE_ROLE_KEY` → Backend only, never expose!
- `SUPABASE_ANON_KEY` → Safe for frontend (limited permissions)

---

## 📱 Local Development Setup

### **For Development:**

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update `.env` with your values:
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Copy to backend:
```bash
cp .env backend/.env
```

4. Start dev server:
```bash
npm run start:fullstack
```

---

## ✅ Environment Variables Checklist

### **Root `.env`** (Frontend - Expo)
- [x] EXPO_PUBLIC_RORK_API_BASE_URL
- [x] EXPO_PUBLIC_SUPABASE_URL
- [x] EXPO_PUBLIC_SUPABASE_ANON_KEY
- [x] FRONTEND_URL

### **`backend/.env`** (Backend - Hono + tRPC)
- [x] NODE_ENV
- [x] SUPABASE_URL
- [x] SUPABASE_ANON_KEY
- [x] SUPABASE_SERVICE_ROLE_KEY
- [x] DATABASE_URL
- [x] FRONTEND_URL
- [x] EXPO_PUBLIC_SUPABASE_URL
- [x] EXPO_PUBLIC_SUPABASE_ANON_KEY
- [x] EXPO_PUBLIC_API_BASE_URL

### **Vercel Environment Variables**
- [x] All variables from `backend/.env`
- [x] Applied to Production environment
- [x] Applied to Preview environment
- [x] Applied to Development environment

---

## 🚨 Common Issues

### **Issue: Backend returns 500**
**Fix**: Check Vercel logs and verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly.

### **Issue: Frontend can't connect to backend**
**Fix**: Verify `EXPO_PUBLIC_RORK_API_BASE_URL` matches your Vercel URL.

### **Issue: CORS errors**
**Fix**: Ensure `FRONTEND_URL` is set in backend environment variables.

### **Issue: Database connection fails**
**Fix**: Check `DATABASE_URL` format and credentials in Supabase settings.

---

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/environment-variables)
- [Supabase Environment Variables](https://supabase.com/docs/guides/getting-started/environment-variables)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)

---

**✅ Setup Complete!** Your environment is now configured for production deployment.
