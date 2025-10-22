# 🚀 Production Launch Checklist

## ✅ What's Already Done (Built by Rork)

### Core Application Features
- [x] Multi-language support (Kurdish, Arabic, English)
- [x] Customer menu browsing with categories
- [x] Table-based ordering system
- [x] QR code table access
- [x] Order management (Kitchen, Cashier, Waiter views)
- [x] Table management system
- [x] Staff authentication (Staff, Manager, Admin roles)
- [x] Real-time order updates
- [x] Order tracking for customers
- [x] Voice ordering capability
- [x] AI-powered recommendations
- [x] AI chatbot for customer assistance
- [x] Predictive analytics
- [x] Reports & analytics dashboard
- [x] Service request system
- [x] Customer history tracking
- [x] Rating & feedback system
- [x] Menu management interface (Admin only)
- [x] Receipt printing support
- [x] Currency support (IQD)
- [x] Tablet & web responsive design
- [x] Dark/elegant restaurant theme

### Technical Infrastructure
- [x] Backend API (Hono + tRPC)
- [x] Database schema (Supabase)
- [x] Real-time subscriptions
- [x] Authentication system
- [x] API routes for all operations
- [x] Error handling & logging
- [x] Type-safe TypeScript implementation
- [x] React Native Web compatibility
- [x] Cross-platform support (iOS, Android, Web)

---

## 📋 What You Need To Do Manually

### 1. Database Setup (30 minutes)

#### Step 1.1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up / Log in
3. Click **"New Project"**
4. Fill in:
   - **Project Name**: `kurdish-cuisine-restaurant` (or your choice)
   - **Database Password**: Generate a strong password (SAVE IT!)
   - **Region**: Choose closest to Iraq (e.g., Frankfurt, Germany)
5. Wait ~2 minutes for provisioning
6. ✅ **Note down**: Project URL and Password

#### Step 1.2: Run Database SQL
1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy ALL SQL from `DATABASE_SETUP.md` (lines 9-209)
4. Paste and click **"Run"**
5. ✅ Confirm: You should see tables, orders, menu_items, etc. in **Database > Tables**

#### Step 1.3: Get API Keys
1. Go to **Settings > API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)
3. ✅ **Save these** - you'll need them next

---

### 2. Environment Configuration (10 minutes)

#### Step 2.1: Update .env File
1. Open `.env` file in your project root
2. Replace with your actual values:

```bash
# Supabase Configuration (from Step 1.3)
EXPO_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Backend URL (leave as-is for now, will update after deployment)
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:8081

# AI Features (already configured - leave as-is)
EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com

# 🔒 IMPORTANT: Change These Passwords!
EXPO_PUBLIC_STAFF_PASSWORD=YOUR_STAFF_PASSWORD_HERE
EXPO_PUBLIC_MANAGER_PASSWORD=YOUR_MANAGER_PASSWORD_HERE
EXPO_PUBLIC_ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD_HERE

# Currency (already set for Iraq - adjust if needed)
EXPO_PUBLIC_CURRENCY_SYMBOL=IQD
EXPO_PUBLIC_CURRENCY_CODE=IQD
```

3. ✅ **Save the file**
4. ⚠️ **NEVER commit .env to git** - it's already in .gitignore

---

### 3. Deploy Backend (20 minutes)

Choose ONE option below:

#### Option A: Vercel (Recommended - Easiest)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

4. Follow prompts:
   - Framework: **Other**
   - Build Command: Leave empty (press Enter)
   - Output Directory: Leave empty (press Enter)
   - Install Command: `bun install`

5. After deployment, you'll get a URL like: `https://your-project.vercel.app`

6. **Update .env**:
```bash
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-project.vercel.app
```

7. Add environment variables in Vercel Dashboard:
   - Go to your project > Settings > Environment Variables
   - Add ALL variables from your .env file
   - Redeploy if needed

✅ **Backend is live!**

#### Option B: Railway (Alternative)

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **"New Project"** > **"Deploy from GitHub repo"**
4. Connect your repository
5. Railway will auto-detect and deploy
6. Go to **Variables** tab and add all .env variables
7. Copy the deployment URL
8. Update `EXPO_PUBLIC_RORK_API_BASE_URL` in .env

✅ **Backend is live!**

---

### 4. Add Menu Items (1-2 hours)

You have 2 options:

#### Option 4A: Use Admin UI (Recommended)

1. Start your app: `bun start`
2. Open the app (scan QR code or open in browser)
3. Go to landing page > Click **"Staff"** button
4. Login as **Super Admin**:
   - Username: `admin`
   - Password: (the one you set in .env)
5. Click **"Menu Management"**
6. Click **"+ Add Menu Item"**
7. Fill in ALL fields:
   - English name, Kurdish name, Arabic name
   - Descriptions in all 3 languages
   - Category, Price, Image URL (optional)
   - Mark as "Available"
8. Click **"Save"**
9. Repeat for ALL your menu items

**Categories available**:
- Appetizers (مەزە / مقبلات)
- Soups (شۆربا / شوربة)
- Salads (زەڵاتە / سلطة)
- Kebabs (کەواب / كباب)
- Rice Dishes (برنج / أرز)
- Stews (ڕەوی / يخنة)
- Seafood (خواردنی دەریا / مأكولات بحرية)
- Breads (نان / خبز)
- Desserts (شیرینی / حلويات)
- Drinks (خواردنەوە / مشروبات)
- Shisha (نارگیل / شيشة)
- Hot Drinks (خواردنەوەی گەرم / مشروبات ساخنة)

#### Option 4B: Direct SQL Insert (Faster for bulk)

1. Go to Supabase > **SQL Editor**
2. Use this template for EACH item:

```sql
INSERT INTO menu_items (
  name, name_kurdish, name_arabic, 
  category, price,
  description, description_kurdish, description_arabic,
  image, available
) VALUES (
  'Tikka Kebab',
  'کەوابی تیکا',
  'كباب التيكا',
  'kebabs',
  25000,
  'Tender grilled chicken with Kurdish spices',
  'مەرگی برژاو بە بۆنخۆشییە کوردییەکان',
  'دجاج مشوي طري بالتوابل الكردية',
  'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800',
  true
);
```

3. Repeat for all items
4. Click **"Run"** after each insert

✅ **Menu is populated!**

---

### 5. Setup Tables & QR Codes (30 minutes)

#### Step 5.1: Verify Tables
Tables are already created (1-12) in the database. Verify:
1. Go to Supabase > **Database > Tables > tables**
2. You should see 12 tables with capacities

#### Step 5.2: Generate QR Codes

**Option A: Use Online QR Generator**
1. Go to [qr-code-generator.com](https://www.qr-code-generator.com/)
2. For **Table 1**, create QR code for:
   ```
   https://your-app-url.com/?table=1
   ```
3. Repeat for tables 2-12
4. Download all QR codes
5. Print them on quality paper or plastic cards
6. Laminate them
7. Place on each table

**Option B: Batch Generate (Recommended)**
Use a QR code batch generator:
1. Create a spreadsheet with URLs:
   ```
   Table 1: https://your-app-url.com/?table=1
   Table 2: https://your-app-url.com/?table=2
   ...
   Table 12: https://your-app-url.com/?table=12
   ```
2. Use [qr-code-generator.com](https://www.qr-code-generator.com/) batch feature
3. Print, laminate, and distribute

✅ **QR codes ready!**

---

### 6. Test Everything (30 minutes)

#### Step 6.1: Test Customer Flow
1. Scan Table QR code (or visit URL with ?table=1)
2. Browse menu in all 3 languages
3. Add items to cart
4. Place order
5. Track order status
6. ✅ **Confirm**: Order appears in Kitchen view

#### Step 6.2: Test Kitchen Flow
1. Login as Staff (Kitchen role)
2. See incoming orders
3. Mark order as "Preparing"
4. Mark as "Ready"
5. ✅ **Confirm**: Status updates in real-time

#### Step 6.3: Test Waiter Flow
1. Login as Staff (Waiter role)
2. See "Ready" orders
3. Mark as "Served"
4. Handle service requests
5. ✅ **Confirm**: All functions work

#### Step 6.4: Test Cashier Flow
1. Login as Staff (Cashier role)
2. See served orders
3. Process payment
4. Mark as "Paid"
5. Print receipt (if printer connected)
6. ✅ **Confirm**: Payment processing works

#### Step 6.5: Test Manager Flow
1. Login as Manager
2. View reports
3. Check analytics
4. Manage tables
5. Download daily reports
6. ✅ **Confirm**: All features accessible

#### Step 6.6: Test Admin Flow
1. Login as Admin
2. Access ALL features
3. Add/Edit/Delete menu items
4. View all reports
5. ✅ **Confirm**: Full system access

---

### 7. Train Your Staff (1-2 hours)

#### Kitchen Staff Training
- [ ] Show how to login
- [ ] Explain order statuses
- [ ] Practice marking orders as Preparing/Ready
- [ ] Show how to view order details
- [ ] Explain tablet/device usage

#### Waiter Staff Training
- [ ] Show how to login
- [ ] Explain how to see table assignments
- [ ] Practice marking orders as Served
- [ ] Show service request handling
- [ ] Teach customer assistance

#### Cashier Training
- [ ] Show payment processing
- [ ] Explain receipt printing
- [ ] Practice marking orders as Paid
- [ ] Show daily report access
- [ ] Teach troubleshooting

#### Manager Training
- [ ] Full system overview
- [ ] Reports and analytics
- [ ] Table management
- [ ] Staff performance monitoring
- [ ] Inventory insights

---

### 8. Go Live! (Launch Day)

#### Morning Setup (2 hours before opening)
- [ ] Place QR codes on all tables
- [ ] Turn on all staff devices (tablets/phones)
- [ ] Login all staff to their roles
- [ ] Test one full order flow
- [ ] Verify printer is working
- [ ] Check internet connection
- [ ] Have backup devices ready

#### During Service
- [ ] Monitor first few orders closely
- [ ] Be available to help staff
- [ ] Watch for any issues
- [ ] Collect feedback from staff and customers
- [ ] Take notes on improvements

#### End of Day
- [ ] Review reports
- [ ] Check all orders were processed
- [ ] Export daily report
- [ ] Backup data
- [ ] Gather staff feedback

---

## 🔒 Security Checklist

Before going live, verify:

- [ ] Changed default passwords in .env
- [ ] .env file is NOT in git (check .gitignore)
- [ ] Supabase Row Level Security is enabled
- [ ] Strong staff passwords (8+ characters)
- [ ] HTTPS enabled on backend
- [ ] API keys are not exposed in client code
- [ ] Service role key is kept secure
- [ ] Regular database backups enabled

---

## 💰 Cost Breakdown (Monthly Estimates)

### Option 1: Minimum Cost Setup
- **Supabase Free Tier**: $0
- **Vercel Hobby**: $0
- **Total**: $0/month

*Good for: Testing, small restaurant (up to 500MB database)*

### Option 2: Production Setup
- **Supabase Pro**: $25/month
- **Vercel Pro**: $20/month
- **Total**: $45/month

*Good for: Medium-sized restaurant, more bandwidth*

### Option 3: High-Traffic Setup
- **Supabase Pro**: $25/month
- **Railway**: $20/month
- **CDN for images**: $10/month
- **Total**: $55/month

*Good for: Large restaurant, high traffic*

---

## 📱 App Distribution Options

### For Staff Use Only (Internal):

**Option A: Expo Go (Easiest)**
- Staff install "Expo Go" app from App Store/Play Store
- Scan QR code when you run `bun start`
- ✅ No build process needed
- ❌ Need to keep dev server running

**Option B: Web App (Recommended)**
- Deploy frontend to Vercel/Netlify
- Staff access via browser
- Add to home screen on tablets/phones
- ✅ Always up-to-date
- ✅ No app store needed

**Option C: Internal Build**
- Build APK (Android) or IPA (iOS)
- Distribute directly to staff devices
- Requires build setup (complex)

### For Public Use (Customers):
Customers don't need the app! They:
1. Scan QR code on table
2. Opens in their web browser
3. Order directly from browser
4. No download needed! 🎉

---

## 🆘 Troubleshooting Common Issues

### "Can't connect to database"
- Check Supabase URL in .env
- Verify API keys are correct
- Check internet connection
- Ensure Supabase project is active

### "Login not working"
- Verify passwords in .env match
- Check role (staff/manager/admin)
- Ensure backend is running

### "Orders not appearing"
- Check real-time subscriptions in Supabase
- Verify table number is correct
- Check order status
- Refresh the page/app

### "QR codes not working"
- Verify URL format: `?table=1` parameter
- Check backend URL is correct
- Test URL in browser first
- Ensure internet connection

### "Menu items missing"
- Check database has menu items
- Verify items are marked as "available"
- Check category filters
- Refresh menu page

---

## 📞 Support Resources

- **Supabase Docs**: https://supabase.com/docs
- **Expo Docs**: https://docs.expo.dev
- **React Native Docs**: https://reactnative.dev
- **Hono Docs**: https://hono.dev
- **tRPC Docs**: https://trpc.io

---

## ✨ What's Next (Optional Future Enhancements)

After successful launch, consider:
- [ ] Customer loyalty program
- [ ] Online reservations
- [ ] Delivery integration
- [ ] Inventory management
- [ ] Employee scheduling
- [ ] Marketing campaigns
- [ ] Customer feedback surveys
- [ ] Multi-location support
- [ ] Advanced analytics
- [ ] Mobile apps for customers (App Store/Play Store)

---

## 🎯 Quick Start Summary

**For the impatient - minimum steps to launch:**

1. **Database**: Create Supabase project, run SQL from DATABASE_SETUP.md
2. **Config**: Update .env with Supabase URL and keys, change passwords
3. **Backend**: Deploy to Vercel (`vercel --prod`)
4. **Menu**: Login as admin, add menu items via Menu Management
5. **QR Codes**: Generate QR codes for tables, print and laminate
6. **Test**: Do one complete order flow
7. **Launch**: Place QR codes, train staff, open for business! 🚀

---

## ✅ Launch Readiness Score

Check your progress:

### Pre-Launch (Must Complete)
- [ ] Database setup complete
- [ ] Environment variables configured
- [ ] Backend deployed and live
- [ ] Menu items added (at least 10 items)
- [ ] Staff passwords changed
- [ ] QR codes printed

### Ready to Launch (Highly Recommended)
- [ ] All menu items added with images
- [ ] QR codes laminated and placed
- [ ] Staff trained on their roles
- [ ] Test orders completed successfully
- [ ] Printer configured (if using)
- [ ] Backup devices available

### Nice to Have (Optional)
- [ ] Custom domain setup
- [ ] Social media setup
- [ ] Customer feedback system tested
- [ ] Analytics dashboard reviewed
- [ ] Marketing materials prepared

**Minimum to Launch: 6/6 Pre-Launch items** ✅

---

Good luck with your restaurant launch! 🎉🍽️
