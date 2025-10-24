# 🚀 Vercel Deployment Guide - Kurdish Cuisine Backend

## ✅ Backend Structure

```
backend/
  ├── api/
  │   └── index.ts          # Vercel Edge Runtime entry point
  ├── trpc/
  │   ├── app-router.ts     # All tRPC routes
  │   ├── create-context.ts # tRPC context
  │   └── routes/           # Individual route handlers
  ├── vercel.json           # Vercel configuration
  ├── package.json          # Dependencies
  └── tsconfig.json         # TypeScript config
```

---

## 📦 Required Packages

The following packages need to be installed in the `backend` directory:

```bash
cd backend
npm install superjson
```

**Note:** `hono/vercel` adapter is built into Hono v4.5.0+, so no additional package needed.

---

## ⚙️ Vercel Project Settings

### 1. **Root Directory**
Set to: `backend`

### 2. **Build Settings**
- **Build Command:** `npm run vercel-build` (or leave empty for Edge Runtime)
- **Install Command:** `npm install`
- **Output Directory:** (leave empty)

### 3. **Node.js Version**
- Select: `20.x`

### 4. **Framework Preset**
- Select: `Other`

---

## 🔐 Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

**Important:** Make sure to add these for **Production**, **Preview**, and **Development** environments.

---

## 🧪 Testing After Deployment

Once deployed, test these endpoints:

### Health Check
```bash
curl https://your-backend.vercel.app/api/health
# Expected: {"status":"ok","timestamp":"2025-10-24T..."}
```

### Root Route
```bash
curl https://your-backend.vercel.app/
# Expected: ✅ Kurdish Cuisine API is running on Vercel Edge Runtime
```

### tRPC Route (Example)
```bash
curl https://your-backend.vercel.app/api/trpc/example.hi
# Should return tRPC response
```

---

## 📡 Frontend Integration

Update your frontend `.env` file:

```bash
EXPO_PUBLIC_API_URL=https://your-backend.vercel.app/api
```

Your tRPC client will automatically connect to `/api/trpc/*` routes.

---

## 🐛 Common Issues & Fixes

### Issue: "Module not found: superjson"
**Fix:** Run `cd backend && npm install superjson`

### Issue: "Routes not working"
**Fix:** Verify `vercel.json` routes point to `/api/index.ts`

### Issue: "CORS errors"
**Fix:** Add your frontend URL to the CORS origins in `backend/api/index.ts`

### Issue: "Edge Runtime errors"
**Fix:** Check that you're not using Node.js-specific APIs (like `fs`, `path`, etc.)

---

## 🔄 Deployment Workflow

1. Push code to GitHub
2. Vercel auto-deploys on push to `main` branch
3. Check deployment logs in Vercel Dashboard
4. Test `/api/health` endpoint
5. Verify tRPC routes work
6. Update frontend ENV with new backend URL

---

## 📊 Monitoring

- **Logs:** Vercel Dashboard → Deployments → View Function Logs
- **Analytics:** Vercel Dashboard → Analytics
- **Errors:** Check Vercel Runtime Logs for edge function errors

---

## ✅ Deployment Checklist

- [ ] `superjson` installed in backend
- [ ] Environment variables added to Vercel
- [ ] Root Directory set to `backend`
- [ ] Build succeeds without errors
- [ ] `/api/health` returns `{"status":"ok"}`
- [ ] Root `/` returns success message
- [ ] tRPC routes accessible at `/api/trpc/*`
- [ ] Frontend ENV updated with backend URL
- [ ] CORS configured for frontend domain

---

**🎉 Your backend is now production-ready on Vercel Edge Runtime!**
