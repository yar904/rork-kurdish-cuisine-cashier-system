# Restaurant System Deployment Guide

## System Overview

This is a complete restaurant management system with:
- **Public Menu** (web) - Customers scan QR codes to view menu and order
- **Staff iPad Apps** - Cashier, Waiter, Kitchen, Analytics, Admin interfaces
- **Backend** - Supabase database with real-time sync

## What You Need

### Hardware
1. **iPad devices** (3-5 recommended):
   - 1 iPad for Cashier
   - 1-2 iPads for Waiters
   - 1 iPad for Kitchen
   - 1 iPad for Manager/Admin (optional)

2. **QR Code Stands/Cards**:
   - Print QR codes for each table
   - Each QR code should link to: `https://your-domain.com/menu?table=X` (where X is table number)

### Software & Services

1. **Supabase Account** (free tier works for testing)
   - Sign up at https://supabase.com
   - Create a new project
   - Note down your Project URL and anon key

2. **Domain Name** (for public menu)
   - Register a domain (e.g., tapse-restaurant.com)
   - You'll connect this to your deployment

3. **Deployment Platform**
   - Use Vercel, Netlify, or similar for web hosting
   - Rork handles the deployment automatically

## Step-by-Step Setup

### 1. Database Setup

1. Log into your Supabase dashboard
2. Go to SQL Editor
3. Copy and run the SQL from `DATABASE_SETUP.md`
4. Verify tables are created in Table Editor
5. Insert your real menu items (replace the demo data)

### 2. Environment Configuration

Create a `.env` file in your project root:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
EXPO_PUBLIC_RORK_API_BASE_URL=https://your-deployment-url.com
```

### 3. Deploy Web App

The web deployment serves:
- Public menu for customers
- QR code landing pages
- Admin interface (accessed via tablets)

**Deployment options:**

**Option A: Vercel (Recommended)**
```bash
npm install -g vercel
vercel deploy --prod
```

**Option B: Netlify**
```bash
npm install -g netlify-cli
netlify deploy --prod
```

**Option C: Custom Server**
- Deploy to your own server with Node.js
- Ensure SSL certificate for HTTPS

### 4. Connect Your Domain

1. In your DNS provider (GoDaddy, Namecheap, etc.):
   - Add A record pointing to your deployment IP
   - Or add CNAME record pointing to your deployment URL

2. Update SSL certificate (handled automatically by Vercel/Netlify)

3. Test your domain: `https://yourdomain.com`

### 5. Generate QR Codes

For each table, generate a QR code:
- Table 1: `https://yourdomain.com/menu?table=1`
- Table 2: `https://yourdomain.com/menu?table=2`
- ... and so on

**Free QR Code Generators:**
- https://www.qr-code-generator.com/
- https://www.qrcode-monkey.com/

**Print Options:**
- Print on table tents (3-5 inches)
- Laminate for durability
- Or use acrylic stands with QR codes

### 6. Configure iPads

**For each iPad:**

1. **Update iOS**
   - Settings > General > Software Update
   - Install latest iOS version

2. **Install Safari/Browser**
   - iPads come with Safari pre-installed

3. **Open Staff Interface**
   - Navigate to: `https://yourdomain.com`
   - Log into the appropriate interface:
     - Cashier: `/cashier`
     - Waiter: `/waiter`
     - Kitchen: `/kitchen`
     - Admin: `/admin`

4. **Add to Home Screen**
   - Tap Share button
   - Select "Add to Home Screen"
   - This creates an app-like icon

5. **Configure iPad Settings**
   - Settings > Display > Auto-Lock > Never
   - Settings > Battery > Low Power Mode > Off
   - Settings > Wi-Fi > Connect to restaurant Wi-Fi

6. **Enable Guided Access (Optional - locks to one app)**
   - Settings > Accessibility > Guided Access > On
   - Set passcode
   - Triple-click home button to enable when in app

### 7. Staff Training

**Cashier Interface:**
- Take orders from walk-in customers
- Process payments
- View daily sales
- Manage table assignments

**Waiter Interface:**
- View table status
- Take orders for seated customers
- Mark orders as served
- Request table cleaning

**Kitchen Interface:**
- View incoming orders (new orders)
- Mark orders as "preparing"
- Mark orders as "ready" (notifies waiter)
- View order queue

**Admin Interface:**
- View analytics and reports
- Manage menu items (enable/disable)
- View staff activity logs
- System settings

### 8. Workflow Process

**Customer Orders via QR Code:**
1. Customer scans QR code on table
2. Menu opens in their phone browser
3. Customer selects table number (auto-filled from QR)
4. Customer browses menu by category
5. Customer adds items to cart with notes
6. Customer submits order
7. Order appears in Kitchen interface immediately
8. Waiter gets notification on their iPad

**Customer Orders via Waiter:**
1. Waiter opens Waiter interface on iPad
2. Selects table
3. Takes order from customer
4. Submits order
5. Order appears in Kitchen

**Order Flow:**
- New Order → Kitchen (mark as "Preparing")
- Preparing → Kitchen (mark as "Ready")
- Ready → Waiter (mark as "Served")
- Served → Cashier (process payment, mark as "Paid")
- Paid → Table marked as "Needs Cleaning"
- Cleaned → Table available again

## Maintenance

### Regular Tasks

**Daily:**
- Check all iPads are charged and working
- Verify Wi-Fi connection
- Test QR codes on a few tables

**Weekly:**
- Update menu items/prices in Supabase
- Review analytics reports
- Back up Supabase data (automatic in Supabase)

**Monthly:**
- Clean QR code stands
- Update iOS on iPads if needed
- Review and optimize menu based on analytics

### Troubleshooting

**Orders not showing up:**
- Check internet connection
- Verify Supabase is online (status.supabase.com)
- Check browser console for errors
- Verify environment variables are set

**QR codes not working:**
- Test QR code with phone camera
- Verify domain is accessible
- Check SSL certificate is valid
- Regenerate QR codes if needed

**iPad freezing:**
- Restart iPad
- Clear browser cache
- Close other apps
- Update iOS

## Costs Estimate

**One-time:**
- iPads: $329-$999 each (3-5 needed) = $1,000-$5,000
- QR code printing: $50-$200
- Domain name: $10-$30/year

**Monthly:**
- Supabase: Free tier (up to 500MB database, 2GB bandwidth)
  - Upgrade if needed: $25/month for Pro
- Web hosting: Free (Vercel/Netlify) or $5-20/month
- Domain renewal: $10-30/year

**Total estimated monthly cost: $0-$50** (depending on traffic and database size)

## Security Recommendations

1. **Enable Row Level Security** (already in SQL setup)
2. **Use HTTPS only** (automatic with Vercel/Netlify)
3. **Regular backups** (Supabase does this automatically)
4. **Lock iPad screens** with Guided Access
5. **Secure Wi-Fi** - Use WPA3 encryption, strong password
6. **Monitor access logs** in Supabase dashboard

## Scaling

When your restaurant grows:

1. **Add more tables:** Just generate new QR codes
2. **Add more iPads:** Simply open the staff URL
3. **Handle more traffic:** Upgrade Supabase plan
4. **Multiple locations:** Create separate Supabase projects per location

## Support

For technical issues:
- Check Supabase documentation: https://supabase.com/docs
- Check Expo documentation: https://docs.expo.dev
- Review error logs in Supabase dashboard

For menu updates:
- Go to Supabase Dashboard > Table Editor > menu_items
- Edit directly or use SQL Editor

## Success Checklist

- [ ] Supabase database created and populated
- [ ] Environment variables configured
- [ ] Web app deployed to production
- [ ] Domain connected and SSL working
- [ ] QR codes generated and printed
- [ ] iPads configured with staff interfaces
- [ ] Staff trained on all interfaces
- [ ] Test order placed successfully
- [ ] Payment flow tested
- [ ] Backups confirmed working

Your restaurant system is now live! 🎉
