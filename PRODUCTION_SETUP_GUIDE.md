# Production Setup Guide

This guide will help you prepare and deploy your restaurant management system to production.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Environment Configuration](#environment-configuration)
4. [Testing Before Production](#testing-before-production)
5. [Deployment Options](#deployment-options)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

Before deploying to production, ensure you have:

- ✅ A Supabase account (or ready to create one)
- ✅ Your restaurant's social media links
- ✅ QR code printer/generator for table codes
- ✅ Staff passwords defined
- ✅ Menu items finalized and tested
- ✅ Receipt printer configured (if using physical receipts)

---

## Database Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose your organization
4. Set project name (e.g., "restaurant-management")
5. Generate a strong database password (save it securely!)
6. Choose the region closest to your restaurant
7. Wait for project to be provisioned (~2 minutes)

### 2. Setup Database Tables

Open the SQL Editor in your Supabase dashboard and run the SQL from `DATABASE_SETUP.md`:

```sql
-- See DATABASE_SETUP.md for complete SQL schema
```

### 3. Get Your Credentials

From your Supabase project settings:
- **Project URL**: `Settings > API > Project URL`
- **Anon Key**: `Settings > API > Project API keys > anon public`
- **Service Role Key**: `Settings > API > Project API keys > service_role` (keep secure!)

---

## Environment Configuration

### 1. Update `.env` File

Create/update your `.env` file with production values:

```bash
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Toolkit (for AI features)
EXPO_PUBLIC_TOOLKIT_URL=https://toolkit.rork.com

# Staff Passwords (change these!)
EXPO_PUBLIC_STAFF_PASSWORD=kitchen2024
EXPO_PUBLIC_MANAGER_PASSWORD=manager2024
EXPO_PUBLIC_ADMIN_PASSWORD=admin2024

# Currency
EXPO_PUBLIC_CURRENCY_SYMBOL=IQD
EXPO_PUBLIC_CURRENCY_CODE=IQD
```

### 2. Security Best Practices

⚠️ **IMPORTANT**: Before going to production:

1. **Change All Passwords**: Update the default passwords in `.env`
2. **Keep Service Role Key Secret**: Never expose it in client-side code
3. **Enable Row Level Security**: Ensure RLS is enabled on all tables
4. **Backup Your .env**: Store it securely (password manager, not in git)

---

## Testing Before Production

### 1. Test All User Flows

- ✅ Customer Menu Browsing (all 3 languages)
- ✅ Order Placement
- ✅ Staff Login (Kitchen, Cashier, Waiter, Analytics)
- ✅ Manager Login (Reports, QR Codes, Table Management)
- ✅ Admin Login (All features)
- ✅ Order Status Updates
- ✅ Kitchen Order Processing
- ✅ Payment Processing
- ✅ Report Generation

### 2. Test on Multiple Devices

- ✅ iOS Phone
- ✅ Android Phone
- ✅ Tablet (iPad/Android)
- ✅ Web Browser (Desktop)
- ✅ Different screen sizes

### 3. Test Edge Cases

- ✅ Slow internet connection
- ✅ Offline mode (graceful handling)
- ✅ Multiple simultaneous orders
- ✅ Long menu item names
- ✅ Special characters in orders
- ✅ Peak load (multiple tables)

---

## Deployment Options

### Option A: Deploy Backend to Production Server

Your backend is currently in `backend/hono.ts`. You have several options:

#### 1. **Vercel (Recommended - Easy)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Configuration:
- Framework Preset: Other
- Build Command: `npm run build` or leave empty
- Output Directory: leave empty
- Install Command: `bun install`

#### 2. **Railway (Easy, Good Performance)**

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect your GitHub repo
4. Railway will auto-detect and deploy
5. Add environment variables in Railway dashboard
6. Deploy!

#### 3. **Fly.io (More Control)**

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch
fly launch

# Deploy
fly deploy
```

#### 4. **Your Own Server (VPS)**

If you have a VPS (DigitalOcean, AWS, etc.):

```bash
# On your server
git clone your-repo
cd your-repo
bun install
bun run backend/hono.ts
```

Use PM2 for process management:
```bash
npm i -g pm2
pm2 start "bun run backend/hono.ts" --name restaurant-api
pm2 startup
pm2 save
```

### Option B: Mobile App Distribution

#### For Staff/Internal Use Only:

**Expo Go (Development/Testing)**
- Share QR code with staff
- They scan with Expo Go app
- Good for testing, not recommended for production

**Expo Updates (Better for Production)**
```bash
# Build and publish update
npx expo publish
```

#### For Public Distribution:

You'll need to submit to app stores. While I can't help with submission, here's the overview:

1. **iOS App Store**
   - Requires Apple Developer Account ($99/year)
   - Build with EAS Build
   - Submit via App Store Connect

2. **Android Play Store**
   - Requires Google Play Developer Account ($25 one-time)
   - Build with EAS Build
   - Submit via Google Play Console

3. **Web Deployment**
   ```bash
   # Build for web
   npx expo export -p web

   # Deploy to Vercel/Netlify/etc
   ```

---

## Post-Deployment Checklist

### Immediately After Deployment

- [ ] Test all staff login credentials
- [ ] Verify database connectivity
- [ ] Test order flow end-to-end
- [ ] Confirm receipt printing works
- [ ] Verify QR codes link to correct tables
- [ ] Test on actual devices staff will use
- [ ] Check all 3 languages (Kurdish, Arabic, English)

### Configure Your Restaurant

1. **Upload Menu Items**
   - Go to Admin > Menu Management
   - Add/edit items with prices and images
   - Assign to correct categories

2. **Setup Tables**
   - Go to Admin > Table Management
   - Generate QR codes for each table
   - Print and laminate QR codes
   - Place on tables

3. **Staff Training**
   - Train kitchen staff on Kitchen view
   - Train waiters on Waiter view
   - Train cashiers on Cashier view
   - Train manager on Reports and Admin views

4. **Social Media Links**
   - Update landing page with your actual social media URLs
   - Test that links open correctly

---

## Monitoring & Maintenance

### Daily Tasks

- Check Supabase dashboard for errors
- Review daily reports
- Monitor order completion times
- Check customer feedback/ratings

### Weekly Tasks

- Review weekly revenue reports
- Analyze popular menu items
- Check printer supplies
- Backup database (Supabase does this automatically, but verify)

### Monthly Tasks

- Review and update menu prices
- Analyze customer patterns
- Update seasonal menu items
- Check for app updates

### Database Backups

Supabase automatically backs up your database, but you can also:

```sql
-- Manual backup
pg_dump -h db.your-project.supabase.co -U postgres your_db > backup.sql
```

### Monitoring Tools

1. **Supabase Dashboard**
   - Monitor API usage
   - Check for errors
   - View real-time data

2. **Set up Alerts**
   - Database connection failures
   - High error rates
   - Slow queries

---

## Getting Help

If you encounter issues:

1. **Check Logs**
   - Supabase Dashboard > Logs
   - Browser Console (F12)
   - Server logs (if self-hosted)

2. **Common Issues**
   - **"Invalid API Key"**: Check .env file
   - **CORS errors**: Configure Supabase allowed origins
   - **Login fails**: Verify passwords in .env
   - **Orders not appearing**: Check database connection
   - **QR codes not working**: Verify base URL

3. **Documentation**
   - Supabase Docs: https://supabase.com/docs
   - Expo Docs: https://docs.expo.dev
   - React Native Docs: https://reactnative.dev

---

## Quick Start Checklist

Use this as your deployment day checklist:

```
Pre-Launch (1 week before):
[ ] Database setup complete
[ ] All menu items added
[ ] Staff accounts created and tested
[ ] QR codes printed and laminated
[ ] Staff trained on system
[ ] Test orders completed successfully

Launch Day:
[ ] Deploy backend to production server
[ ] Update .env with production values
[ ] Verify all environment variables
[ ] Place QR codes on tables
[ ] Test first real order end-to-end
[ ] Monitor for issues

Post-Launch (First Week):
[ ] Daily check of orders and reports
[ ] Gather staff feedback
[ ] Fix any bugs found
[ ] Optimize based on usage patterns
```

---

## Security Reminders

🔒 **Critical Security Checklist:**

- [ ] Changed default passwords
- [ ] `.env` file not committed to git
- [ ] Service role key kept secure
- [ ] HTTPS enabled on all endpoints
- [ ] Row Level Security enabled on Supabase
- [ ] Regular security updates
- [ ] Staff password policy enforced

---

## Cost Estimates

### Monthly Costs (Approximate)

1. **Supabase**
   - Free tier: $0 (up to 500MB database, 2GB bandwidth)
   - Pro: $25/month (8GB database, 50GB bandwidth)

2. **Hosting**
   - Vercel: $0 (hobby) or $20/month (pro)
   - Railway: ~$5-20/month depending on usage
   - Fly.io: ~$5-15/month

3. **Expo**
   - Development: Free
   - EAS Build (if needed): $29/month

**Total Estimated Cost**: $0-75/month depending on your choices

---

## Next Steps

1. Choose your deployment platform
2. Set up production database
3. Configure environment variables
4. Deploy backend
5. Test thoroughly
6. Train staff
7. Go live!

Good luck with your production deployment! 🚀
