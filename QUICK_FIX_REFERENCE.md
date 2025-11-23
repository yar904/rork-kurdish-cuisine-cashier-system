# 🎯 TAPSE POS - QUICK FIX REFERENCE

## ✅ FILES MODIFIED

### Backend (Supabase Edge Function)
1. `supabase/functions/tapse-backend/index.ts` - Entry point with Deno.serve
2. `supabase/functions/tapse-backend/_shared/trpc-context.ts` - Non-blocking auth
3. `supabase/functions/tapse-backend/_shared/trpc-router.ts` - Added missing routes

### Frontend
4. `lib/trpc.ts` - Fixed authorization headers
5. `app/debug/env-check.tsx` - NEW diagnostic screen
6. `.env.example` - Updated with documentation

### Documentation
7. `TRPC_SUPABASE_FIX_COMPLETE.md` - Complete fix documentation

---

## 🚀 DEPLOY NOW

### Step 1: Deploy Supabase Edge Function
```bash
cd supabase/functions
supabase functions deploy tapse-backend
```

### Step 2: Update Environment Variables
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env and add your actual Supabase anon key
nano .env  # or use your preferred editor
```

### Step 3: Test
```bash
# In the app, navigate to:
/debug/env-check

# Should show all green checkmarks ✅
```

---

## 🔑 CRITICAL ENVIRONMENT VARIABLES

```bash
EXPO_PUBLIC_SUPABASE_ANON_KEY=<YOUR_KEY_HERE>
```

**Where to find it:**
1. Go to Supabase Dashboard
2. Project Settings → API
3. Copy "anon/public" key
4. Paste into `.env`

---

## 📋 VERIFICATION CHECKLIST

- [ ] Supabase Edge Function deployed
- [ ] `.env` file created with correct anon key
- [ ] Diagnostic screen shows ✅ for all tests
- [ ] QR ordering works (`/qr/1`)
- [ ] Kitchen dashboard shows orders
- [ ] Waiter can see tables
- [ ] Service requests work (call waiter, request bill)

---

## 🐛 QUICK TROUBLESHOOTING

### "tRPC fetch error"
→ Check `/debug/env-check` → Fix environment variables

### "Failed to fetch"
→ Deploy Supabase Edge Function: `supabase functions deploy tapse-backend`

### "Unauthorized"
→ Check anon key in `.env`

### Orders not appearing
→ Check order status filter in kitchen dashboard

---

## 📞 SUPPORT

- **Documentation:** `TRPC_SUPABASE_FIX_COMPLETE.md`
- **Diagnostic Tool:** `/debug/env-check`
- **Logs:** `supabase functions logs tapse-backend`

---

**Status:** ✅ READY TO DEPLOY  
**Time to Deploy:** ~5 minutes
