# QR Code System Guide - TAPSE POS

## How Table QR Codes Work

### System Overview
Each table in your restaurant gets a unique QR code that customers can scan to order directly from their table without needing to call a waiter.

---

## QR Code Generation Process

### 1. **Tables Are Created in Database**
Tables are stored in your Supabase database with:
- **Table Number** (1, 2, 3, etc.)
- **Capacity** (how many seats)
- **Status** (available, occupied, reserved, needs-cleaning)

### 2. **Each Table Gets a Unique URL**
The format is:
```
https://your-app.com/customer-order?table=[TABLE_NUMBER]
```

Examples:
- Table 1: `https://your-app.com/customer-order?table=1`
- Table 2: `https://your-app.com/customer-order?table=2`
- Table 3: `https://your-app.com/customer-order?table=3`

### 3. **URLs Are Converted to QR Codes**
When you access the admin panel, you can:
- **Generate individual QR codes** (click on a table → "QR Code" button)
- **Generate all QR codes at once** (click "Generate All QR Codes")
- **Share QR codes** via text, email, or print

---

## How Tables Get Their QR Codes (Step by Step)

### **Method 1: From Admin Panel**

1. **Login as Admin or Manager**
   - Password: `farman12` (admin) or `manager99` (manager)

2. **Navigate to Admin Tab**
   - Bottom navigation → "Super Admin" or "Manager"

3. **View Tables**
   - You'll see a grid of all tables
   - Each table shows: number, capacity, status

4. **Generate QR for Single Table**
   - Tap on any table card
   - Tap "QR Code" button
   - System generates URL and allows you to share

5. **Generate All QR Codes at Once**
   - Scroll to "Quick Actions" section
   - Tap "Generate All QR Codes"
   - Get a list of all table URLs
   - Share or print

### **Method 2: Dedicated QR Codes Page**

1. **Navigate to Menu Management**
   - Admin tab → "QR Self-Order" card

2. **Or go directly to `/table-qr-codes` route**

3. **Each Table Shows:**
   - Table number
   - Capacity
   - Visual QR code placeholder
   - Full URL
   - Instructions for customers

4. **Share Individual QR**
   - Tap share button on any table card
   - Send via SMS, email, or print

---

## Table Order in QR System

### **Tables Are Ordered by Table Number**
- The system automatically sorts tables 1, 2, 3, 4, etc.
- This is managed in your database
- Each table has a unique `number` field

### **How to Ensure Correct Order**

1. **Database Schema**
```sql
CREATE TABLE tables (
  id SERIAL PRIMARY KEY,
  number INTEGER UNIQUE NOT NULL,  -- This controls the order
  capacity INTEGER NOT NULL,
  status TEXT DEFAULT 'available'
);
```

2. **When Displaying Tables**
```typescript
const tables = await query('SELECT * FROM tables ORDER BY number ASC');
```

3. **Tables Display In Order:**
   - Table 1 (first)
   - Table 2
   - Table 3
   - Table 4
   - ... and so on

---

## Customer Flow (How Customers Use QR Codes)

### **Step 1: Customer Scans QR Code**
- Using their phone camera
- Or QR scanner app

### **Step 2: Opens Customer Order Page**
- URL: `your-app.com/customer-order?table=X`
- System detects table number from URL

### **Step 3: Customer Views Menu**
- Full menu displayed
- Prices shown
- Categories organized

### **Step 4: Customer Adds Items**
- Tap items to add to cart
- Adjust quantities
- Add special notes

### **Step 5: Customer Submits Order**
- Review order summary
- Confirm table number
- Submit to kitchen

### **Step 6: Order Goes to Kitchen**
- Appears on Kitchen screen
- Appears on Waiter screen
- Status tracked in real-time

---

## Admin/Manager Workflow

### **On Admin Panel:**
```
1. View all tables in grid layout
2. See table status (color-coded):
   - Green = Available
   - Red = Occupied
   - Orange = Reserved
   - Blue = Needs Cleaning

3. Click table to:
   - Generate QR code
   - View active orders
   - Change status

4. Long press table to change status
```

---

## Current POS UI Pages Explained

### **1. Cashier Tab** (Blue theme)
**Purpose:** Take manual orders and process payments

**Layout:**
- Top: Header with blue background
- Left: Horizontal category tabs (Appetizers, Mains, etc.)
- Center: 2-column grid of menu items
- Right: Order summary panel
  - Shows: Table number, items, quantities, total
  - Actions: Submit order, Clear cart

**How to Use:**
1. Select category from top tabs
2. Tap menu items to add to order
3. Adjust quantities with +/- buttons
4. Select table number
5. Submit order

---

### **2. Kitchen Tab** (Green theme)
**Purpose:** View and manage orders being prepared

**Layout:**
- Vertical list of order cards
- Each card shows:
  - Order ID and time
  - Table number
  - Items list
  - Status badge
  - Action buttons

**Order Statuses:**
- New (just received)
- Preparing (being cooked)
- Ready (ready for serving)
- Delivered (customer received)

**How to Use:**
1. View incoming orders at top
2. Tap "Start Preparing" → moves to Preparing
3. Tap "Mark Ready" → moves to Ready
4. Waiter marks "Delivered"

---

### **3. Waiter Tab** (Blue theme)
**Purpose:** Table management and order tracking

**Layout:**
- Top stats: Total tables, occupied, available
- Table grid with color-coded status
- Service requests section
- Active orders section

**How to Use:**
1. View table status
2. Tap table to see details
3. Handle service requests
4. Mark orders as delivered

---

### **4. Analytics Tab** (Blue theme)
**Purpose:** Simple sales metrics

**Layout:**
- Top: 3 stat cards
  - Total Revenue
  - Total Orders
  - Average Order Value
- Middle: Top selling items list
- Bottom: Revenue by category chart

**Data Shown:**
- Real-time order data
- Top 10 items
- Category breakdown
- Order status distribution

**Simplified:** No AI predictions, just clean data

---

### **5. Reports Tab** (Blue theme)
**Purpose:** Detailed financial reports

**Layout:**
- Date range selector
- Summary cards
- Sales charts
- Category breakdown
- Export options

**Features:**
- Daily/Weekly/Monthly views
- Revenue trends
- Compare periods
- Export to CSV/PDF

---

### **6. Admin Tab** (Blue theme)
**Purpose:** System management and QR codes

**Layout:**
- Table Management section
  - Grid of all tables
  - Status indicators
  - QR generation
- Quick Actions
  - Clean all tables
  - Generate all QR codes
- Management Links
  - Menu Items
  - Employees
  - Inventory
  - Service Requests

**Simplified:** Removed password displays, focused on core functions

**How to Use:**
1. View table grid
2. Tap table → Generate QR
3. Access management pages
4. Export reports

---

## Color Scheme (Updated - Simple & Professional)

### **Bottom Tab Bar:**
- Background: `#007AFF` (iOS Blue)
- Active text: White
- Inactive text: White 60% opacity

### **Headers:**
- All pages: `#0A84FF` (Blue)
- Text: White

### **Status Colors:**
- Available: `#10B981` (Green)
- Occupied: `#EF4444` (Red)
- Reserved: `#F59E0B` (Orange)
- Needs Cleaning: `#0A84FF` (Blue)

### **UI Elements:**
- Background: `#F5F5F7` (Light gray)
- Cards: `#FFFFFF` (White)
- Text: `#1C1C1E` (Dark gray)
- Secondary text: `#8E8E93` (Medium gray)

---

## Why Items Might Not Show

### **Common Issues:**

1. **No Menu Items in Database**
   - Check if menu items exist
   - Navigate to Menu Management
   - Add items if empty

2. **Category Mismatch**
   - Ensure items have valid categories
   - Check category filter

3. **Database Connection**
   - Verify Supabase connection
   - Check `.env` configuration
   - Ensure backend is running

4. **Loading State**
   - Wait for data to load
   - Check for error messages
   - Look at browser console

---

## Testing the QR System

### **Test Locally:**

1. **Start the app**
```bash
npm start
```

2. **Login as admin** (password: farman12)

3. **Go to Admin tab**

4. **Generate QR for Table 1**

5. **Open the URL in another tab:**
```
http://localhost:8081/customer-order?table=1
```

6. **You should see:**
   - Customer ordering interface
   - Full menu
   - Add to cart functionality
   - Submit order button

7. **Submit an order**

8. **Check Kitchen tab** - order appears there

---

## Printing QR Codes

### **Option 1: Print from Browser**
1. Generate QR code URL
2. Open in browser
3. Print page

### **Option 2: Use QR Generator Service**
1. Copy table URL
2. Go to: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=[URL]`
3. Download image
4. Print

### **Option 3: Bulk Export**
1. Admin tab → "Generate All QR Codes"
2. Share list
3. Open in document
4. Print all

---

## Summary

**QR Code Order:**
- Tables are sorted by `number` field (1, 2, 3...)
- Database query uses `ORDER BY number ASC`
- Display follows this order everywhere

**Current UI Status:**
- ✅ Analytics: Simplified (no AI)
- ✅ Admin: Simplified (clean management)
- ✅ Bottom tabs: Blue with white text
- ✅ All pages: Blue headers
- ✅ Consistent spacing and colors
- ✅ Removed old credential displays

**To Generate QR Codes:**
1. Login as admin/manager
2. Go to Admin tab
3. Tap table → "QR Code"
4. Or tap "Generate All QR Codes"
5. Share or print

**Customer Experience:**
1. Scan QR → Opens order page
2. Browse menu → Add items
3. Submit → Goes to kitchen
4. Order tracked in real-time
