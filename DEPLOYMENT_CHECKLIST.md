# ✅ Vercel Deployment Checklist

Complete checklist for deploying the Kurdish Cuisine Backend to Vercel Edge Runtime.

---

## 📦 Prerequisites

- [ ] Vercel account created
- [ ] GitHub repository ready
- [ ] Supabase project set up with database tables
- [ ] Node.js 20.x installed locally (for testing)

---

## 🔧 Backend Preparation

### 1. Install Dependencies
```bash
cd backend
npm install superjson
```
- [ ] `superjson` installed successfully
- [ ] No npm errors

### 2. Update package.json
Edit `backend/package.json` and ensure this script exists:
```json
"vercel-build": "echo 'Edge runtime build'"
```
- [ ] Script added to package.json

### 3. Verify Files Created
- [ ] `backend/api/index.ts` exists (Vercel entry point)
- [ ] `backend/vercel.json` updated with correct routes
- [ ] `backend/tsconfig.json` configured correctly

### 4. Test Locally (Optional but Recommended)
```bash
cd backend
npm run dev
```
- [ ] Backend starts without errors on port 3000
- [ ] Can access `http://localhost:3000/api/health`
- [ ] Returns `{"status":"ok","timestamp":"..."}`

### 5. Run Automated Tests (Optional)
```bash
cd backend
chmod +x test-deployment.sh
./test-deployment.sh
```
- [ ] All tests pass
- [ ] Health check works
- [ ] Root endpoint works
- [ ] CORS configured
- [ ] tRPC endpoint accessible

---

## 🚀 Vercel Deployment

### Option A: Deploy via Vercel CLI

```bash
cd backend
npx vercel
```

Follow prompts:
- [ ] Link to existing project or create new
- [ ] Confirm scope/team
- [ ] Deployment successful
- [ ] Note the deployed URL

### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure project:
   - [ ] **Root Directory:** Set to `backend`
   - [ ] **Framework Preset:** Select "Other"
   - [ ] **Build Command:** Leave empty or `npm run vercel-build`
   - [ ] **Install Command:** `npm install`
   - [ ] **Output Directory:** Leave empty
   - [ ] **Node.js Version:** 20.x
5. Click "Deploy"
6. [ ] Deployment successful
7. [ ] Note the deployed URL (e.g., `https://your-backend.vercel.app`)

---

## 🔐 Environment Variables

### In Vercel Dashboard

Go to: Project Settings → Environment Variables

Add these variables for **Production**, **Preview**, and **Development**:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
FRONTEND_URL=https://your-frontend.vercel.app
```

- [ ] `SUPABASE_URL` added
- [ ] `SUPABASE_ANON_KEY` added
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added
- [ ] `FRONTEND_URL` added (add after frontend deployment)
- [ ] Environment variables saved

### Redeploy After Adding ENV
- [ ] Trigger redeploy from Vercel Dashboard
- [ ] Deployment successful

---

## 🧪 Post-Deployment Testing

### Test Backend Endpoints

Replace `YOUR_BACKEND_URL` with your actual Vercel backend URL.

#### 1. Health Check
```bash
curl https://YOUR_BACKEND_URL/api/health
```
Expected: `{"status":"ok","timestamp":"..."}`
- [ ] Returns 200 status
- [ ] JSON response with "ok" status

#### 2. Root Endpoint
```bash
curl https://YOUR_BACKEND_URL/
```
Expected: `✅ Kurdish Cuisine API is running on Vercel Edge Runtime`
- [ ] Returns 200 status
- [ ] Welcome message displays

#### 3. tRPC Endpoint (via browser)
Open: `https://YOUR_BACKEND_URL/api/trpc/example.hi`
- [ ] Page loads (may show error - that's OK, means endpoint exists)
- [ ] Not a 404 error

#### 4. Automated Test Script
```bash
cd backend
./test-deployment.sh https://YOUR_BACKEND_URL
```
- [ ] All tests pass

---

## 🎨 Frontend Configuration

### Update Frontend Environment Variables

#### Local Development
Edit root `.env`:
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=https://YOUR_BACKEND_URL
```
- [ ] Variable updated
- [ ] Expo restarted

#### Vercel Frontend (if deploying frontend to Vercel)
In Frontend Project Settings → Environment Variables:
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=https://YOUR_BACKEND_URL
```
- [ ] Variable added to Vercel
- [ ] Frontend redeployed

---

## 🔄 Backend CORS Update (after frontend deployment)

Once frontend is deployed, update backend CORS:

### Update Environment Variable
In Backend Vercel Settings → Environment Variables:
- [ ] Update `FRONTEND_URL` with actual frontend URL
- [ ] Redeploy backend

### Verify CORS in Code (if needed)
Check `backend/api/index.ts`:
```typescript
app.use('*', cors({
  origin: ['http://localhost:8081', process.env.FRONTEND_URL || '*'],
  credentials: true,
}));
```
- [ ] Frontend URL included in CORS origins
- [ ] Deployed if changed

---

## ✅ Integration Testing

### Test Frontend → Backend Communication

1. Open your frontend app (locally or on Vercel)
2. Open browser DevTools → Network tab
3. Interact with the app (load menu, create order, etc.)

Check:
- [ ] API calls go to `https://YOUR_BACKEND_URL/api/trpc/*`
- [ ] Requests return 200 status codes
- [ ] No CORS errors in console
- [ ] Data loads correctly
- [ ] Menu items display
- [ ] Orders can be created
- [ ] Tables load correctly

---

## 📊 Monitoring & Verification

### Vercel Dashboard

- [ ] Check "Deployments" tab - deployment is live
- [ ] Check "Functions" tab - edge functions showing activity
- [ ] Check "Analytics" - requests being tracked
- [ ] Review "Runtime Logs" - no errors

### Supabase Dashboard

- [ ] Check "Table Editor" - data appears when app is used
- [ ] Check "API" tab - service role key matches
- [ ] Review "Logs" - queries are executing

---

## 🐛 Troubleshooting

If you encounter issues, check:

### Backend Not Responding
- [ ] Verified deployment succeeded in Vercel
- [ ] Checked Vercel function logs for errors
- [ ] Confirmed environment variables are set
- [ ] URL is correct (no typos)

### CORS Errors
- [ ] `FRONTEND_URL` environment variable set
- [ ] Backend redeployed after adding frontend URL
- [ ] CORS origins in code include frontend domain

### Database Errors
- [ ] Supabase credentials are correct
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is set (not just anon key)
- [ ] Database tables exist
- [ ] RLS policies allow service role access

### tRPC Errors
- [ ] `superjson` is installed
- [ ] Frontend tRPC client configured correctly
- [ ] API routes match in both frontend and backend

---

## 📚 Reference Documentation

Detailed guides available:
- **`backend/DEPLOYMENT_SUMMARY.md`** - What was created
- **`backend/VERCEL_DEPLOYMENT.md`** - Detailed deployment guide
- **`backend/SETUP_INSTRUCTIONS.md`** - Local setup
- **`ENV_SETUP_GUIDE.md`** - Environment variables
- **`VERCEL_QUICK_START.md`** - Fast deployment

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Backend health check returns `{"status":"ok"}`
✅ Backend root returns welcome message
✅ Frontend connects to backend without errors
✅ API calls in Network tab show 200 status
✅ No CORS errors in browser console
✅ Data loads from Supabase correctly
✅ Can create, read, update menu items
✅ Can manage orders and tables
✅ Vercel logs show no errors

---

## 🚀 You're Done!

**Congratulations!** Your Kurdish Cuisine Cashier System backend is now:
- Live on Vercel Edge Runtime
- Connected to Supabase
- Accessible via tRPC
- Production-ready and scalable

**Next Steps:**
- Deploy frontend to Vercel
- Set up custom domain (optional)
- Configure monitoring/alerts
- Share with your team! 🎊
