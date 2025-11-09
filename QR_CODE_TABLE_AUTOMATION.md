# Automated Table Detection via QR Codes

## How It Works

### For Customers:
1. **Scan QR Code** - Each table has a unique QR code that customers scan
2. **Auto-Detect Table** - The app automatically detects which table they're at from the QR code URL
3. **No Manual Selection** - Customers never see a table selection screen
4. **Start Ordering** - They can immediately start browsing the menu and placing orders

### For Restaurant/Admin:
**Each table's QR code should contain the table number in the URL like this:**
```
https://your-restaurant-app.com/menu?table=1
https://your-restaurant-app.com/menu?table=2
https://your-restaurant-app.com/menu?table=3
...and so on
```

## Benefits

✅ **No Manual Errors** - Customers can't select the wrong table by mistake
✅ **Faster Service** - Customers skip the table selection step entirely  
✅ **Accurate Tracking** - Admin dashboard always knows which table placed which order
✅ **Better UX** - Seamless experience from QR scan to menu browsing

## How to Generate QR Codes

You can generate QR codes for each table using the admin panel:
1. Go to **Admin → Table QR Codes**
2. Each table will show its QR code automatically
3. Print and place QR codes on each table

## Fallback
If a customer somehow accesses the menu without scanning a QR code (e.g., by typing the URL manually):
- They can manually select their table by tapping the table badge in the top-right corner
- When submitting an order, they'll be prompted to select a table if one isn't already set

## Technical Implementation
- Table number is passed as URL parameter: `?table=X`
- App automatically detects and saves the table number on page load
- No table selection modal appears when table is auto-detected
- Console logs show: `"Auto-detected table X from QR code scan"`
