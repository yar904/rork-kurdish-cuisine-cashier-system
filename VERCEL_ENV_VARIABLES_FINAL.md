# 🎯 VERCEL ENVIRONMENT VARIABLES - FINAL CONFIGURATION

## ✅ Issue Resolved
Changed `SUPABASE_URL` → `SUPABASE_PROJECT_URL` to fix the lowercase secret conflict error.

---

## 📋 Copy these EXACT variables to Vercel Dashboard

Go to: **Vercel Dashboard → Settings → Environment Variables**

### **1. NODE_ENV**
```
production
```
Apply to: ✅ Production ✅ Preview ✅ Development

---

### **2. SUPABASE_PROJECT_URL** ⚠️ (RENAMED FROM SUPABASE_URL)
```
https://oqspnszwjxzyvwqjvjiy.supabase.co
```
Apply to: ✅ Production ✅ Preview ✅ Development

---

### **3. SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
```
Apply to: ✅ Production ✅ Preview ✅ Development

---

### **4. SUPABASE_SERVICE_ROLE_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkxMzkyNSwiZXhwIjoyMDc2NDg5OTI1fQ.ssIEnxorttkyClGoMPas7DagfpkJmtCMLmJKi2xIXr4
```
Apply to: ✅ Production ✅ Preview ✅ Development

---

### **5. DATABASE_URL**
```
postgresql://Farman12Tapse@db.oqspnszwjxzyvwqjvjiy.supabase.co:5432/postgres
```
Apply to: ✅ Production ✅ Preview ✅ Development

---

### **6. FRONTEND_URL**
```
https://rork-kurdish-cuisine-cashier-system.vercel.app
```
Apply to: ✅ Production ✅ Preview ✅ Development

---

### **7. EXPO_PUBLIC_SUPABASE_URL**
```
https://oqspnszwjxzyvwqjvjiy.supabase.co
```
Apply to: ✅ Production ✅ Preview ✅ Development

---

### **8. EXPO_PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wc3FuenN3anh6dnl3cWpxdmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MTM5MjUsImV4cCI6MjA3NjQ4OTkyNX0.j3GfMt1dypvBQvLzvyREclMcEJRQ1_hzq81blOmwW_k
```
Apply to: ✅ Production ✅ Preview ✅ Development

---

### **9. EXPO_PUBLIC_API_BASE_URL**
```
https://rork-kurdish-cuisine-cashier-system.vercel.app
```
Apply to: ✅ Production ✅ Preview ✅ Development

---

### **10. EXPO_PUBLIC_RORK_API_BASE_URL**
```
https://rork-kurdish-cuisine-cashier-system.vercel.app
```
Apply to: ✅ Production ✅ Preview ✅ Development

---

## ⚠️ CRITICAL: Remove Old Variables

If you have these OLD variables in Vercel, **DELETE THEM**:
- ❌ `SUPABASE_URL` (uppercase)
- ❌ `supabase_url` (lowercase)

Keep only the NEW variable:
- ✅ `SUPABASE_PROJECT_URL`

---

## 🚀 Deployment Steps

1. **Add all variables above** to Vercel → Settings → Environment Variables
2. **Apply to all environments**: Production, Preview, Development
3. **Delete any old SUPABASE_URL variables** (both uppercase and lowercase)
4. **Redeploy** with:
   ```bash
   vercel --prod --force
   ```
5. **Verify API health**:
   ```bash
   curl https://rork-kurdish-cuisine-cashier-system.vercel.app/api/health
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-01-XX..."
   }
   ```

---

## ✅ What Was Changed in Code

### Files Updated:
1. ✅ `backend/.env` - Renamed `SUPABASE_URL` → `SUPABASE_PROJECT_URL`
2. ✅ `.env` - Added fix comment
3. ✅ `backend/index.ts` - Changed `process.env.SUPABASE_URL` → `process.env.SUPABASE_PROJECT_URL`
4. ✅ `test-env-config.js` - Updated validation to check `SUPABASE_PROJECT_URL`

### Files NOT Changed (no impact):
- `lib/supabase.ts` - Uses `EXPO_PUBLIC_SUPABASE_URL` (unchanged)
- `backend/api/index.ts` - Doesn't use Supabase directly
- All tRPC routes - Don't reference SUPABASE_URL

---

## 🧪 Final Test Checklist

- [ ] All 10 environment variables added to Vercel
- [ ] Applied to Production, Preview, and Development
- [ ] Old `SUPABASE_URL` variables deleted
- [ ] Redeployed with `vercel --prod --force`
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] No "Secret does not exist" errors in deployment logs

---

**🎉 Your deployment should now work without the secret conflict error!**
