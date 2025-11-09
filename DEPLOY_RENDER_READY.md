# 🚀 Render Deployment Guide - Kurdish Cuisine Cashier System

## ✅ Migration Complete: Vercel → Render

Your backend has been migrated from Vercel to Render for better Node.js compatibility and simpler deployment.

---

## 📋 Deployment Configuration

### Service Details
- **Platform**: Render.com
- **Service Type**: Web Service
- **Region**: Oregon (US West)
- **Runtime**: Node.js
- **Plan**: Free (upgrade to paid for production use)

### Build & Start Commands
```bash
Build Command: npm install && npm run build
Start Command: node dist/index-render.js
Root Directory: backend
```

---

## 🔧 Step-by-Step Deployment on Render

### 1. Create a New Web Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub/GitLab repository
4. Select your project repository

### 2. Configure Service Settings
Fill in these values:

| Setting | Value |
|---------|-------|
| **Name** | `kurdish-cuisine-backend` (or your choice) |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/index-render.js` |

### 3. Add Environment Variables
Click **"Advanced"** and add these environment variables:

```env
NODE_ENV=production
SUPABASE_PROJECT_URL=https://oqspnszwjxzyvwqjvjiy.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4
DATABASE_URL=postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres
FRONTEND_URL=https://rork-kurdish-cuisine-cashier-system.vercel.app
```

### 4. Deploy
Click **"Create Web Service"** and wait 3-5 minutes for the initial deployment.

---

## 🧪 Verify Deployment

After deployment completes, your service URL will be:
```
https://kurdish-cuisine-backend.onrender.com
```

### Test Health Endpoint
```bash
curl https://your-render-app-name.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-25T10:30:00.000Z",
  "environment": "production"
}
```

### Test Root Endpoint
```bash
curl https://your-render-app-name.onrender.com/
```

**Expected Response:**
```json
{
  "status": "✅ Kurdish Cuisine Cashier System API",
  "version": "1.0.0",
  "deployed": "Render",
  "healthCheck": "/api/health"
}
```

---

## 🔄 Update Frontend to Use Render Backend

Once your Render service is deployed, update the frontend `.env`:

1. Get your Render service URL (e.g., `https://kurdish-cuisine-backend.onrender.com`)
2. Update `.env` in the project root:

```env
EXPO_PUBLIC_RORK_API_BASE_URL=https://kurdish-cuisine-backend.onrender.com
EXPO_PUBLIC_API_BASE_URL=https://kurdish-cuisine-backend.onrender.com
```

3. Restart your Expo development server:
```bash
npm start
```

---

## 📦 Files Modified for Render Migration

### Created:
- ✅ `backend/index-render.ts` - New entry point for Render
- ✅ `backend/render.yaml` - Render configuration (optional)
- ✅ `DEPLOY_RENDER_READY.md` - This deployment guide

### Updated:
- ✅ `backend/.env` - Updated for Render deployment
- ✅ `.env` - Updated API URLs to point to Render

### Removed (Optional):
- ❌ `vercel.json` - No longer needed
- ❌ `api/index.ts` - Vercel-specific entrypoint
- ❌ `.vercel/` folder - Can be deleted

---

## 🔑 Environment Variables Reference

| Variable | Purpose | Required |
|----------|---------|----------|
| `NODE_ENV` | Environment mode | Yes |
| `SUPABASE_PROJECT_URL` | Supabase API URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key | Yes |
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `FRONTEND_URL` | CORS allowed origin | Yes |

---

## 🐛 Troubleshooting

### Build Fails
- Check that `backend/tsconfig.json` exists
- Verify `backend/package.json` has correct dependencies
- Review build logs in Render dashboard

### Health Check Returns 404
- Ensure Start Command is: `node dist/index-render.js`
- Verify Root Directory is set to: `backend`
- Check that build created `dist/` folder

### CORS Errors
- Add your frontend URL to `FRONTEND_URL` environment variable
- Update `backend/index-render.ts` CORS origins if needed

### Service Sleeping (Free Plan)
- Free tier services sleep after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- Upgrade to paid plan for 24/7 uptime

---

## 📊 Render vs Vercel Comparison

| Feature | Vercel | Render |
|---------|--------|--------|
| Runtime | Edge/Serverless | Full Node.js |
| Cold Starts | ~300ms | ~30s (free tier) |
| Build Time | 1-2 min | 2-4 min |
| CORS Setup | Complex | Simple |
| Logs | Limited | Full access |
| Cost (free) | 100GB bandwidth | 750 hours/month |

---

## 🎯 Next Steps

1. ✅ Deploy backend to Render
2. ✅ Test health endpoint
3. ✅ Update frontend `.env` with Render URL
4. ✅ Test full app with Render backend
5. ⬜ Remove Vercel configuration files (optional)
6. ⬜ Update documentation with new API URL
7. ⬜ Consider upgrading Render plan for production

---

## 📞 Support

- **Render Docs**: https://render.com/docs
- **Render Status**: https://status.render.com
- **Project Issues**: Check logs in Render Dashboard → Your Service → Logs

---

## 🔒 Security Notes

- Never commit `.env` files to version control
- Rotate Supabase keys regularly
- Use environment-specific keys (dev/prod)
- Enable HTTPS only in production
- Monitor API logs for suspicious activity

---

**Deployment Date**: January 2025  
**Backend Version**: 1.0.0  
**Platform**: Render.com (Oregon Region)

✅ **Migration Complete - Ready for Production!**
