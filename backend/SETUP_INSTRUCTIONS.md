# 🛠️ Backend Setup Instructions

## Quick Setup

Run these commands to prepare your backend for Vercel deployment:

```bash
# Navigate to backend directory
cd backend

# Install the missing required package
npm install superjson

# Test locally (optional)
npm run dev
```

---

## Package.json Updates Needed

Add this script to your `backend/package.json`:

```json
"scripts": {
  "dev": "tsx watch --env-file=.env index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "vercel-build": "echo 'Edge runtime build'"
}
```

The `vercel-build` script is a placeholder since Edge Runtime doesn't require a build step.

---

## What Was Created

### 1. `/backend/api/index.ts`
- Entry point for Vercel Edge Runtime
- Configured with Hono + tRPC
- Includes CORS for your frontend
- Handles GET, POST, PUT, DELETE, PATCH requests
- Routes:
  - `GET /api/health` → Health check
  - `GET /` → Welcome message
  - `POST /api/trpc/*` → All your tRPC routes

### 2. `/backend/vercel.json`
- Updated to route all requests through `/api/index.ts`
- Configured for Vercel deployment

### 3. `/backend/VERCEL_DEPLOYMENT.md`
- Complete deployment guide
- Environment variables checklist
- Testing instructions
- Troubleshooting tips

---

## Local Testing

After installing `superjson`, test the API locally:

```bash
# In backend directory
npm run dev
```

This will start your backend on `http://localhost:3000`.

Test endpoints:
```bash
# Health check
curl http://localhost:3000/api/health

# Root
curl http://localhost:3000/
```

---

## Ready for Vercel

Once you've:
1. ✅ Installed `superjson`
2. ✅ Updated package.json scripts
3. ✅ Tested locally

You're ready to deploy to Vercel! Follow the steps in `VERCEL_DEPLOYMENT.md`.

---

## Need Help?

- Check `VERCEL_DEPLOYMENT.md` for detailed deployment steps
- Review Vercel logs if deployment fails
- Ensure all environment variables are set in Vercel dashboard
