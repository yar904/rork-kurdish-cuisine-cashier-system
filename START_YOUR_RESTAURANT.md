# 🍽️ Quick Start Guide - Get Your Restaurant System Running

## What's Happening?
Your restaurant cashier system has a configuration issue with `expo-audio` that's preventing it from starting. Here's how to fix it in 2 minutes:

## 🚀 Quick Fix (Run These Commands)

```bash
# Step 1: Run the fix script
chmod +x fix-expo.sh
./fix-expo.sh

# Step 2: Start your app
bun start
```

That's it! Your app should now start successfully.

---

## 📱 What You'll See After Starting

Once `bun start` runs successfully, you'll see:
- A **QR code** in your terminal - scan this with the Expo Go app on your phone
- A **Metro bundler** running (this serves your app)
- Options to press:
  - `w` - open in web browser
  - `a` - open Android emulator (if installed)
  - `i` - open iOS simulator (if on Mac)

## 🌐 Using Your Restaurant System

### For Restaurant Staff (Mobile/Tablet):
1. Install **Expo Go** app on your device:
   - iOS: App Store
   - Android: Google Play Store
2. Open Expo Go and scan the QR code
3. Your restaurant system will load!

### For Testing on Computer (Web):
1. After `bun start`, press `w` to open in browser
2. You'll see your restaurant interface

---

## 🏪 Your Restaurant System Features

Your system includes:

### 👨‍💼 **Admin Panel** (`/admin`)
- Menu management
- Employee management
- Inventory tracking
- Reports & analytics

### 💰 **Cashier Interface** (`/cashier`)
- Process orders
- Handle payments
- Print receipts

### 🍕 **Kitchen Display** (`/kitchen`)
- View incoming orders
- Update order status
- Track cooking times

### 🧑‍🍳 **Waiter Interface** (`/waiter`)
- Table management
- Take orders
- Send to kitchen

### 📊 **Analytics** (`/analytics`)
- Real-time sales data
- Popular items
- Performance metrics

### 🧾 **Reports** (`/reports`)
- Daily/weekly/monthly reports
- Sales summaries
- Inventory reports

---

## 🔧 What Was Fixed?

The issue was:
- `expo-audio` plugin was configured in `app.json` but not properly installed
- Your app doesn't actually use audio features
- Removed the unused plugin to prevent the error

---

## 🆘 Troubleshooting

### If you still see errors after running fix-expo.sh:

```bash
# Clean everything and start fresh
rm -rf node_modules
npm cache clean --force
npm install
npx expo start --clear
```

### Backend Not Connected?
Your backend needs to be running separately. To start both frontend and backend:

```bash
npm run dev
```

This starts:
- Frontend: Expo app (port 8081)
- Backend: Hono server (port 3000)

---

## 📝 Environment Setup

Make sure your `.env` file has these variables:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EXPO_PUBLIC_RORK_API_BASE_URL=http://localhost:3000
```

---

## 🎯 Next Steps After App Starts

1. **Test all interfaces**: Cashier, Kitchen, Waiter, Admin
2. **Add your menu items**: Use the Admin panel
3. **Set up employees**: Create employee accounts
4. **Configure printers**: If using receipt printers
5. **Train your staff**: Show them the different interfaces

---

## 💡 Pro Tips

- **Use tablets** for best experience (iPads or Android tablets)
- **Stable WiFi** is essential for real-time updates
- **Backup regularly** - your data is in Supabase
- **Test everything** before opening hours

---

## 📞 Need Help?

If something doesn't work:
1. Check the terminal for error messages
2. Verify `.env` file is set up correctly
3. Make sure Supabase is configured
4. Ensure backend is running (if using backend features)

---

**Ready to serve customers! 🎉**
