# 🏗️ Deployment Architecture Guide

## 📊 Current Problem vs Solution

### ❌ Current (Broken)

```
┌──────────────────────────────┐
│   Kurdish Cuisine App        │
│   kurdish-cuisine-...rork.app│
├──────────────────────────────┤
│   Frontend + Backend         │
│   All on Rork                │
│                              │
│   ⚠️ SNAPSHOT NOT FOUND ⚠️   │
└──────────────────────────────┘
```

**Problem**: Rork can't find deployment snapshot

---

### ✅ Solution (Working)

```
┌─────────────────────┐
│   Frontend Only     │
│   Rork/Netlify      │
│   HTML, JS, CSS     │
└──────────┬──────────┘
           │
           │ API Calls (HTTPS)
           │
           ↓
┌─────────────────────┐
│   Backend Server    │
│   Render/Railway    │
│   Node.js + Hono    │
└──────────┬──────────┘
           │
           │ SQL Queries
           │
           ↓
┌─────────────────────┐
│   Database          │
│   Supabase          │
│   PostgreSQL        │
└─────────────────────┘
```

**Solution**: Separate frontend and backend hosting

---

## 🎯 Architecture Components

### 1️⃣ Frontend (User Interface)

**What it is**:
- React Native Web (Expo)
- All your UI components
- Menu, cashier, kitchen, waiter screens

**What it does**:
- Displays data to users
- Captures user input
- Makes API calls to backend

**Built with**:
```bash
npx expo export -p web
# Creates: dist/ folder with HTML/JS/CSS
```

**Where to host**:
- ✅ **Netlify** (Recommended): Free unlimited, fast CDN
- ✅ **Rork** (If working): Quick preview, integrated editor
- ✅ **Vercel**: Great for React apps
- ✅ **Cloudflare Pages**: Best free tier

**No backend code runs here** - just static files!

---

### 2️⃣ Backend (API Server)

**What it is**:
- Node.js server using Hono framework
- tRPC API routes
- Business logic

**What it does**:
- Process orders
- Manage tables
- Handle payments
- Query database
- Authentication

**Runs on**:
```bash
cd backend
npm install
npm start
# Starts server on port 3000
```

**Where to host**:
- ✅ **Render.com** (Recommended): Free tier, easy setup
- ✅ **Railway.app**: Best performance, $10/mo
- ✅ **Fly.io**: Great for multiple regions
- ❌ **NOT Netlify static hosting**

**Needs Node.js runtime** - can't be static files!

---

### 3️⃣ Database (Data Storage)

**What it is**:
- PostgreSQL database
- Already on Supabase

**What it does**:
- Store menu items
- Save orders
- Track customers
- Manage inventory

**Where it is**:
- ✅ **Already hosted on Supabase**
- ✅ No changes needed
- ✅ Just keep using it

---

## 🔄 Data Flow

### Customer Orders Food

```
1. User clicks "Add to Cart"
   ↓
2. Frontend sends API request
   POST https://backend.onrender.com/api/trpc/orders.create
   ↓
3. Backend validates and processes
   ↓
4. Backend saves to Supabase
   INSERT INTO orders (...)
   ↓
5. Backend returns success
   ↓
6. Frontend updates UI
   ✅ Order added!
```

### Kitchen Updates Order Status

```
1. Chef clicks "Mark Ready"
   ↓
2. Frontend sends API request
   POST https://backend.onrender.com/api/trpc/orders.updateStatus
   ↓
3. Backend updates database
   UPDATE orders SET status = 'ready'
   ↓
4. Backend broadcasts change
   ↓
5. All screens update in real-time
   ✅ Waiter sees "Ready to serve"
```

---

## 🌐 Network Architecture

### Simple Setup (Recommended)

```
┌─────────────────────────────┐
│         Internet            │
└────────┬──────────┬─────────┘
         │          │
    Frontend     Backend
         │          │
    ┌────▼────┐ ┌──▼────┐
    │ Netlify │ │Render │
    │ (Static)│ │(Node) │
    └────┬────┘ └──┬────┘
         │         │
         └────┬────┘
              │
         ┌────▼────┐
         │Supabase │
         │(Postgres)
         └─────────┘
```

**Pros**:
- ✅ Simple to set up
- ✅ Easy to maintain
- ✅ Can scale each part independently
- ✅ Free tier available

**Cons**:
- ⚠️ Backend can sleep (free tier)
- ⚠️ Extra network hop

---

### Advanced Setup (Production)

```
┌──────────────────────────────┐
│      Cloudflare CDN          │
│    (Static Assets Cache)     │
└──────────┬───────────────────┘
           │
     ┌─────▼─────┐
     │ Load      │
     │ Balancer  │
     └─────┬─────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼────┐   ┌───▼────┐
│Backend │   │Backend │
│Server 1│   │Server 2│
└───┬────┘   └───┬────┘
    │            │
    └──────┬─────┘
           │
    ┌──────▼──────┐
    │  Database   │
    │  (Primary)  │
    └──────┬──────┘
           │
    ┌──────▼──────┐
    │  Database   │
    │  (Replica)  │
    └─────────────┘
```

**For later when you scale!**

---

## 🔐 Security Architecture

### Environment Variables

**Frontend** (Expo)
```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_RORK_API_BASE_URL=https://backend.onrender.com
```
- ✅ Public keys only
- ✅ Can be exposed in browser
- ✅ Limited permissions

**Backend** (Node.js)
```
SUPABASE_PROJECT_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  ⚠️ SECRET!
DATABASE_URL=postgresql://...      ⚠️ SECRET!
NODE_ENV=production
```
- ⚠️ Contains secrets
- ⚠️ Never exposed to frontend
- ⚠️ Full database permissions

### CORS (Cross-Origin Security)

Your backend already allows:
```typescript
✅ .rork.app
✅ .netlify.app
✅ .onrender.com
✅ .railway.app
✅ .vercel.app
✅ localhost (development)
```

Blocks all other origins for security.

---

## 📊 Deployment Comparison

### Option 1: Render + Netlify

```
Frontend (Netlify)
├─ Free unlimited hosting
├─ Global CDN
├─ Auto HTTPS
├─ Build: 5 min
└─ Uptime: 99.99%

Backend (Render Free)
├─ Free tier
├─ Sleeps after 15 min
├─ Wake time: 30 seconds
├─ Build: 3 min
└─ Uptime: 99% (with sleep)

Total Cost: $0/month
Best For: Testing, development
```

---

### Option 2: Render Pro + Netlify

```
Frontend (Netlify)
├─ Free unlimited hosting
├─ Global CDN
├─ Auto HTTPS
├─ Build: 5 min
└─ Uptime: 99.99%

Backend (Render Pro)
├─ $7/month
├─ Always on (no sleep!)
├─ Better performance
├─ Build: 3 min
└─ Uptime: 99.9%

Total Cost: $7/month
Best For: Production, real users
```

---

### Option 3: Railway (All-in-One)

```
Frontend + Backend (Railway)
├─ $10/month
├─ Always on
├─ Best performance
├─ Single dashboard
├─ Database included
├─ Build: 7 min
└─ Uptime: 99.99%

Total Cost: $10/month
Best For: Serious production
```

---

## 🚀 Deployment Steps

### Phase 1: Backend (Critical!)

```bash
# 1. Choose hosting platform
   Render.com (recommended)

# 2. Connect repository
   GitHub → Select repo

# 3. Configure
   Root: backend
   Build: npm install && npm install -g tsx
   Start: npx tsx index.ts

# 4. Add environment variables
   Copy from backend/.env

# 5. Deploy
   Wait 2-3 minutes

# 6. Get URL
   https://your-app.onrender.com
```

---

### Phase 2: Frontend

#### Option A: Stay on Rork

```bash
# 1. Update .env
   EXPO_PUBLIC_RORK_API_BASE_URL=https://backend-url

# 2. Save
   Rork auto-rebuilds

# 3. Done!
   App should work
```

#### Option B: Move to Netlify

```bash
# 1. Go to Netlify
   app.netlify.com

# 2. Import project
   New site → Import from Git

# 3. Configure build
   Build: npx expo export -p web
   Publish: dist

# 4. Add environment variables
   All EXPO_PUBLIC_* variables

# 5. Deploy
   Wait 2-3 minutes

# 6. Done!
   Get URL: https://your-site.netlify.app
```

---

## 🧪 Testing Architecture

### Backend Tests

```bash
# Health check
curl https://backend.onrender.com/api/health
# Expected: {"status":"ok"}

# Supabase connection
curl https://backend.onrender.com/api/test
# Expected: {"supabaseConnected":true}

# tRPC endpoint
curl https://backend.onrender.com/api/trpc
# Expected: tRPC metadata
```

### Frontend Tests

```bash
# 1. Open in browser
https://your-site.netlify.app

# 2. Open DevTools (F12)
# 3. Check Console - no errors
# 4. Check Network tab - API calls succeed
# 5. Test creating an order
# 6. Verify it appears in kitchen view
```

### Integration Tests

```bash
# End-to-end flow:
1. Create order in Cashier ✅
2. See order in Kitchen ✅
3. Update status ✅
4. Status reflects everywhere ✅
5. Refresh page - data persists ✅
```

---

## 📈 Scaling Strategy

### Today (Just Deployed)
```
1 Frontend server (Netlify)
1 Backend server (Render)
1 Database (Supabase)

Cost: $0-7/month
Handles: ~100 concurrent users
```

### Growth Phase
```
1 Frontend (CDN cached)
2 Backend servers (Load balanced)
1 Database + read replica

Cost: ~$30/month
Handles: ~1,000 concurrent users
```

### At Scale
```
Multiple regions
Auto-scaling backends
Database cluster
Redis caching

Cost: $200+/month
Handles: 10,000+ concurrent users
```

**Start small, scale when needed!**

---

## ✅ Architecture Checklist

**Before Deployment**:
- [ ] Backend code tested locally
- [ ] Frontend builds without errors
- [ ] Environment variables prepared
- [ ] Database tables created
- [ ] CORS configured

**After Backend Deployment**:
- [ ] Health endpoint works
- [ ] Supabase connection verified
- [ ] tRPC endpoint accessible
- [ ] No errors in logs
- [ ] URL noted for frontend

**After Frontend Deployment**:
- [ ] Site loads
- [ ] No console errors
- [ ] API calls succeed
- [ ] All pages work
- [ ] Data persists

**Final Verification**:
- [ ] Create order → works
- [ ] Update status → works
- [ ] Data syncs across views
- [ ] Works on mobile
- [ ] Works on desktop

---

## 🎯 Summary

**Your App Architecture**:
```
Static Frontend (Netlify/Rork)
    ↕ HTTPS API calls
Dynamic Backend (Render/Railway)
    ↕ SQL queries
Database (Supabase)
```

**Why This Works**:
- ✅ Frontend serves fast (CDN)
- ✅ Backend processes securely
- ✅ Database stores reliably
- ✅ Each part scales independently
- ✅ Easy to maintain

**Next Step**:
Open `START_HERE.md` and follow deployment instructions!

🚀 **Your app is ready to go live!**
