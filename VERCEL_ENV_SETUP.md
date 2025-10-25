# 🔐 Vercel Environment Variables Setup

## ✅ What You Need to Do in Vercel Dashboard

### 🔵 Backend Project (Node.js API)

**Project:** `kurdish-cuisine-backend` (or whatever you named it)

Go to: **Settings → Environment Variables**

Add these variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `SUPABASE_URL` | `https://opsqnzswjxzvywqjqvjy.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your anon key) | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your service role key) | Production, Preview, Development |
| `DATABASE_URL` | `postgresql://Farman12Tapse@db.opsqnzswjxzvywqjqvjy.supabase.co:5432/postgres` | Production, Preview, Development |
| `FRONTEND_URL` | `https://rork-kurdish-cuisine-cashier-system.vercel.app` | Production |
| `FRONTEND_URL` | `http://localhost:8081` | Development |
| `NODE_ENV` | `production` | Production |

**Important Backend Settings:**
- **Root Directory:** `backend`
- **Build Command:** `npm install` (or leave default)
- **Install Command:** `npm install`
- **Output Directory:** (leave empty)
- **Node.js Version:** 20.x

---

### 🟢 Frontend Project (Expo/React Native Web)

**Project:** `rork-kurdish-cuisine-cashier-system` (your main app)

Go to: **Settings → Environment Variables**

Add these variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `EXPO_PUBLIC_RORK_API_BASE_URL` | `https://kurdish-cuisine-backend.vercel.app` (your backend URL) | Production, Preview |
| `EXPO_PUBLIC_RORK_API_BASE_URL` | `http://localhost:3000` | Development |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://opsqnzswjxzvywqjqvjy.supabase.co` | Production, Preview, Development |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your anon key) | Production, Preview, Development |

**Optional (if using AI features):**
| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `EXPO_PUBLIC_OPENAI_API_KEY` | `sk-xxxxx` | Production, Preview, Development |
| `EXPO_PUBLIC_AI_API_URL` | `https://api.openai.com/v1/chat/completions` | Production, Preview, Development |

---

## 🚀 Deployment Steps

### Step 1: Deploy Backend First
```bash
cd backend
git add .
git commit -m "Backend ready for Vercel"
git push
```

In Vercel:
1. Import your repository
2. Select `backend` folder as root directory
3. Add all environment variables listed above
4. Deploy
5. **Copy the deployment URL** (e.g., `https://kurdish-cuisine-backend.vercel.app`)

### Step 2: Update Frontend with Backend URL
In Vercel Frontend project settings:
1. Go to Environment Variables
2. Update `EXPO_PUBLIC_RORK_API_BASE_URL` with your backend URL
3. Click "Save"

### Step 3: Redeploy Frontend
```bash
git add .
git commit -m "Updated backend URL"
git push
```

Vercel will auto-deploy.

### Step 4: Update Backend CORS
In Vercel Backend project:
1. Go to Environment Variables
2. Update `FRONTEND_URL` with your frontend URL (e.g., `https://rork-kurdish-cuisine-cashier-system.vercel.app`)
3. Redeploy backend

---

## 🧪 Testing Your Setup

### Test Backend Health
```bash
curl https://your-backend.vercel.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-23T..."
}
```

### Test tRPC Endpoint
```bash
curl -X POST https://your-backend.vercel.app/api/trpc/menu.getAll \
  -H "Content-Type: application/json" \
  -d '{"json": null}'
```

Should return menu items from Supabase.

### Test Frontend
1. Open your frontend URL
2. Check browser console - should see no CORS errors
3. Menu should load from backend API
4. Check Network tab - requests should go to your backend URL

---

## ⚠️ Common Issues

### Issue: "CORS error"
**Fix:** Make sure `FRONTEND_URL` in backend matches your actual frontend domain.

### Issue: "No base url found"
**Fix:** Ensure `EXPO_PUBLIC_RORK_API_BASE_URL` is set in frontend Vercel settings.

### Issue: Backend returns 500
**Fix:** Check Vercel function logs for errors. Usually missing Supabase credentials.

### Issue: "Supabase connection failed"
**Fix:** Verify all three Supabase keys are correct and match your Supabase dashboard.

---

## ✅ Checklist

Backend on Vercel:
- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `DATABASE_URL` set (optional but recommended)
- [ ] `FRONTEND_URL` set to production frontend URL
- [ ] Root directory = `backend`
- [ ] Deployment successful
- [ ] `/api/health` returns OK

Frontend on Vercel:
- [ ] `EXPO_PUBLIC_RORK_API_BASE_URL` points to backend URL
- [ ] `EXPO_PUBLIC_SUPABASE_URL` set
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] Deployment successful
- [ ] App loads without errors
- [ ] Data fetches from backend API

---

## 📝 Notes

- **Never commit `.env` files to Git** - they contain sensitive keys
- **Use different keys for development/production** if possible
- **Supabase Service Role Key** gives full database access - only use on backend
- **Environment variables starting with `EXPO_PUBLIC_`** are exposed to the client
- **Redeploy** after changing environment variables for changes to take effect

---

**🎉 Once all checkboxes are complete, your system is production-ready!**
