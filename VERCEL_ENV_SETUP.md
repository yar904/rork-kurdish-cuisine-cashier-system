# ✅ Vercel Environment Variables Setup Guide

## 🎯 Overview
This guide walks you through syncing all environment variables with Vercel for the Kurdish Cuisine Cashier System.

---

## 📋 Required Environment Variables

### **1. Backend Project (rork-kurdish-cuisine-cashier-system)**

Go to: https://vercel.com/your-username/rork-kurdish-cuisine-cashier-system/settings/environment-variables

Add these variables for **Production**, **Preview**, and **Development**:

```bash
NODE_ENV=production

# Supabase Backend (Server-side with Service Role)
SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database Connection
DATABASE_URL=postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres

# Frontend URL (for CORS)
FRONTEND_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app

# Expo Public Variables (for client-side)
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_API_BASE_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
EXPO_PUBLIC_RORK_API_BASE_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
```

---

## 🚀 Quick Setup via Vercel CLI

If you have Vercel CLI installed, you can add variables quickly:

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add NODE_ENV production
vercel env add SUPABASE_URL production
vercel env add SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production
vercel env add FRONTEND_URL production
vercel env add EXPO_PUBLIC_SUPABASE_URL production
vercel env add EXPO_PUBLIC_SUPABASE_ANON_KEY production
vercel env add EXPO_PUBLIC_API_BASE_URL production
vercel env add EXPO_PUBLIC_RORK_API_BASE_URL production
```

---

## 🔐 Security Best Practices

### ⚠️ Never commit these to Git:
- `.env`
- `backend/.env`

### ✅ Safe to commit:
- `.env.example`
- `VERCEL_ENV_SETUP.md` (this file)

### 🔒 Supabase Keys:
- **Anon Key**: Safe for client-side (included in frontend bundles)
- **Service Role Key**: 🚨 NEVER expose to client - backend only!

---

## 📱 Frontend Environment Variables

For the frontend (Expo app), these variables are automatically picked up from `.env`:

```bash
EXPO_PUBLIC_RORK_API_BASE_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
EXPO_PUBLIC_SUPABASE_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note**: All `EXPO_PUBLIC_*` variables are bundled into your client code and visible to users.

---

## 🧪 Testing Your Setup

### 1. **Test Backend Health**
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

### 2. **Test tRPC Connection**
```bash
curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/trpc/example.hi
```

### 3. **Test Supabase Connection**
Open your frontend app and check if menu items load from Supabase.

---

## 🔄 Updating Environment Variables

### Option 1: Vercel Dashboard
1. Go to your project → Settings → Environment Variables
2. Edit the variable
3. Redeploy: `vercel --prod`

### Option 2: Vercel CLI
```bash
vercel env rm VARIABLE_NAME production
vercel env add VARIABLE_NAME production
```

---

## 🌍 Environment-Specific URLs

| Environment | Backend URL | Frontend URL |
|------------|-------------|--------------|
| **Local** | http://localhost:3000 | http://localhost:8081 |
| **Production** | https://rork-kurdish-cuisine-cashier-system.vercel.app | https://rork-kurdish-cuisine-cashier-system.vercel.app |
| **Preview** | https://[branch]-rork-kurdish-cuisine.vercel.app | Same |

---

## ✅ Verification Checklist

- [ ] All environment variables added to Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is only in backend, never in frontend
- [ ] `FRONTEND_URL` matches your actual Vercel deployment URL
- [ ] `EXPO_PUBLIC_API_BASE_URL` points to backend
- [ ] Backend `/api/health` endpoint returns `{"status":"ok"}`
- [ ] Frontend can fetch data from Supabase
- [ ] tRPC routes work from frontend

---

## 🆘 Troubleshooting

### Issue: "Supabase connection failed"
**Solution**: Verify `SUPABASE_URL` and keys in Vercel dashboard match Supabase project settings.

### Issue: "CORS error when calling backend"
**Solution**: Ensure `FRONTEND_URL` is correctly set in Vercel environment variables.

### Issue: "Environment variables not updating"
**Solution**: Redeploy after changing env vars: `vercel --prod`

### Issue: "tRPC routes return 404"
**Solution**: Check `backend/vercel.json` routes configuration and ensure `/api/trpc/*` is mapped correctly.

---

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs: https://vercel.com/your-project/deployments
2. Verify environment variables are set for the correct environment (Production/Preview/Development)
3. Test locally first: `npm run start:fullstack`

---

**Last Updated**: 2025-01-15  
**Project**: Kurdish Cuisine Cashier System  
**Stack**: Expo + React Native + Hono + tRPC + Supabase + Vercel
