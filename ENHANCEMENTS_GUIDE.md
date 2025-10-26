# Restaurant System Enhancements Guide

This guide provides implementation details for the new features added to your Tapse Restaurant Management System.

## ✅ Completed Features

### 1. Push Notifications (PWA)
**Status: Implemented**

**What was added:**
- Service Worker with push notification support (`public/service-worker.js`)
- Notification Context for managing permissions (`contexts/NotificationContext.tsx`)
- Integrated with Restaurant Context for automatic notifications
- Notifications for: New orders, Order ready, Service requests

**How to use:**
```typescript
import { useNotifications } from '@/contexts/NotificationContext';

// In your component
const { requestPermission, notifyNewOrder, notifyOrderReady } = useNotifications();

// Request permission (call once on app init or settings page)
await requestPermission();

// Notifications are automatically sent when:
// - New order is submitted (notifyNewOrder)
// - Order status changes to 'ready' (notifyOrderReady)
// - Service request is created (add manually)
```

**To test:**
1. Open app in browser (HTTPS required for push notifications)
2. Grant notification permission when prompted
3. Submit an order → notification appears
4. Change order to ready in kitchen → notification appears

---

### 2. Menu Translation UI
**Status: Implemented**

**What was added:**
- `LanguageSwitcher` component (`components/LanguageSwitcher.tsx`)
- Added translations for language selector in `constants/i18n.ts`
- Beautiful modal with language flags and native names
- Support for English, Kurdish, Arabic

**How to use:**
```typescript
import LanguageSwitcher from '@/components/LanguageSwitcher';

function MyComponent() {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  
  return (
    <>
      <TouchableOpacity onPress={() => setShowLanguageMenu(true)}>
        <Globe size={24} />
      </TouchableOpacity>
      
      <LanguageSwitcher 
        visible={showLanguageMenu} 
        onClose={() => setShowLanguageMenu(false)} 
      />
    </>
  );
}
```

**Already integrated in:**
- Menu screen (already has Globe icon)
- Just connect the icon to show the LanguageSwitcher component

---

## 🚧 Features To Implement

### 3. Employee Management System

**Database Schema Needed:**
Add to `types/database.ts`:

```typescript
employees: {
  Row: {
    id: string;
    name: string;
    role: 'kitchen' | 'waiter' | 'cashier' | 'manager';
    phone: string | null;
    email: string | null;
    created_at: string;
  };
};

employee_shifts: {
  Row: {
    id: string;
    employee_id: string;
    shift_start: string;
    shift_end: string | null;
    clock_in: string | null;
    clock_out: string | null;
    status: 'scheduled' | 'active' | 'completed' | 'missed';
    created_at: string;
  };
};

employee_performance: {
  Row: {
    id: string;
    employee_id: string;
    date: string;
    orders_handled: number;
    avg_service_time: number | null;
    customer_ratings: number | null;
    created_at: string;
  };
};
```

**Backend Routes Needed:**
Create these tRPC procedures:

```typescript
// backend/trpc/routes/employees/getAll/route.ts
export const getAllEmployeesProcedure = protectedProcedure.query(async ({ ctx }) => {
  const { data } = await ctx.supabase.from('employees').select('*').order('name');
  return { employees: data || [] };
});

// backend/trpc/routes/employees/clockIn/route.ts
export const clockInProcedure = protectedProcedure
  .input(z.object({ employeeId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Create new shift record with clock_in timestamp
    const { data, error } = await ctx.supabase
      .from('employee_shifts')
      .insert({
        employee_id: input.employeeId,
        clock_in: new Date().toISOString(),
        status: 'active',
      })
      .select()
      .single();
    
    if (error) throw new Error('Failed to clock in');
    return { shift: data };
  });

// backend/trpc/routes/employees/clockOut/route.ts
export const clockOutProcedure = protectedProcedure
  .input(z.object({ shiftId: z.string() }))
  .mutation(async ({ ctx, input }) => {
    // Update shift record with clock_out timestamp
    const { data, error } = await ctx.supabase
      .from('employee_shifts')
      .update({
        clock_out: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', input.shiftId)
      .select()
      .single();
    
    if (error) throw new Error('Failed to clock out');
    return { shift: data };
  });
```

**UI Component Needed:**
Create `app/employee-management.tsx`:
- List of employees with roles
- Clock in/out buttons
- Shift schedule view
- Performance metrics dashboard
- Add new employee form

---

### 4. Inventory Management System

**Database Schema Needed:**
```typescript
inventory_items: {
  Row: {
    id: string;
    name: string;
    name_kurdish: string;
    name_arabic: string;
    category: string;
    unit: string; // kg, liter, piece, etc.
    current_stock: number;
    min_stock_level: number;
    max_stock_level: number;
    cost_per_unit: number;
    supplier_id: string | null;
    last_restocked: string | null;
    created_at: string;
    updated_at: string;
  };
};

suppliers: {
  Row: {
    id: string;
    name: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    created_at: string;
  };
};

menu_item_ingredients: {
  Row: {
    id: string;
    menu_item_id: string;
    inventory_item_id: string;
    quantity_needed: number; // Amount used per menu item
    created_at: string;
  };
};

stock_transactions: {
  Row: {
    id: string;
    inventory_item_id: string;
    type: 'purchase' | 'usage' | 'adjustment' | 'waste';
    quantity: number;
    notes: string | null;
    created_by: string;
    created_at: string;
  };
};
```

**Features:**
1. **Stock Tracking**: Real-time inventory levels
2. **Low Stock Alerts**: Automatic notifications when items below min level
3. **Auto-deduct**: When order is placed, deduct ingredients automatically
4. **Supplier Management**: Track suppliers and purchase history
5. **Usage Reports**: See ingredient consumption over time

**Implementation Steps:**
1. Add database tables to Supabase
2. Create backend tRPC routes for CRUD operations
3. Link menu items to ingredients (menu_item_ingredients table)
4. Modify order creation to auto-deduct stock
5. Create inventory management UI
6. Add low stock alert system

---

### 5. QR Code Self-Ordering System

**Already Partially Implemented!**
Your system already supports table-based ordering via URL params: `/menu?table=5`

**What to add:**

**1. QR Code Generator** (Add to Admin panel):
```typescript
import QRCode from 'react-qr-code';

function TableQRGenerator({ tableNumber }: { tableNumber: number }) {
  const baseUrl = Platform.OS === 'web' 
    ? window.location.origin 
    : 'https://your-domain.com';
  const qrValue = `${baseUrl}/menu?table=${tableNumber}`;
  
  return (
    <View>
      <QRCode value={qrValue} size={256} />
      <Text>Table {tableNumber}</Text>
    </View>
  );
}
```

**2. Install QR Code Library:**
```bash
bun add react-qr-code
```

**3. Add to Admin Panel:**
- Button to generate QR codes for all tables
- Print/Download functionality
- Display QR code next to each table in table management

**4. Customer Flow (Already Working!):**
1. Customer scans QR code → Opens `/menu?table=5`
2. System auto-selects table 5
3. Customer browses menu, adds items to cart
4. Customer submits order
5. Order goes to kitchen with table number
6. Customer can track order status
7. Customer can request waiter/bill

**Benefits:**
- ✅ Reduces waiter workload
- ✅ Faster order placement
- ✅ Better order accuracy (no miscommunication)
- ✅ Contactless ordering (COVID-safe)
- ✅ Multilingual support (already have 3 languages)

---

## Priority Implementation Order

Based on impact and complexity:

1. **QR Code System** (Easiest, High Impact)
   - Just add QR generator to admin panel
   - Rest already works!

2. **Employee Management** (Medium complexity, High value)
   - Improves operations
   - Better staff tracking
   - Performance insights

3. **Inventory Management** (Most complex, High value)
   - Prevents stockouts
   - Reduces waste
   - Better cost control
   - Requires most database work

---

## Database Migration Script

Run this in your Supabase SQL editor to add all tables:

\`\`\`sql
-- Employees
CREATE TABLE employees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('kitchen', 'waiter', 'cashier', 'manager')),
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Shifts
CREATE TABLE employee_shifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  shift_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  shift_end TIMESTAMPTZ,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'active', 'completed', 'missed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee Performance
CREATE TABLE employee_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  orders_handled INTEGER DEFAULT 0,
  avg_service_time REAL,
  customer_ratings REAL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Inventory Items
CREATE TABLE inventory_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_kurdish TEXT NOT NULL,
  name_arabic TEXT NOT NULL,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  current_stock REAL NOT NULL DEFAULT 0,
  min_stock_level REAL NOT NULL DEFAULT 0,
  max_stock_level REAL NOT NULL DEFAULT 100,
  cost_per_unit REAL NOT NULL DEFAULT 0,
  supplier_id UUID REFERENCES suppliers(id),
  last_restocked TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Menu Item Ingredients (linking table)
CREATE TABLE menu_item_ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  menu_item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  quantity_needed REAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, inventory_item_id)
);

-- Stock Transactions
CREATE TABLE stock_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'adjustment', 'waste')),
  quantity REAL NOT NULL,
  notes TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE INDEX idx_employee_shifts_date ON employee_shifts(shift_start);
CREATE INDEX idx_employee_performance_employee ON employee_performance(employee_id);
CREATE INDEX idx_stock_transactions_item ON stock_transactions(inventory_item_id);
CREATE INDEX idx_menu_item_ingredients_menu ON menu_item_ingredients(menu_item_id);
\`\`\`

---

## Next Steps

1. Run the database migration script in Supabase
2. Start with QR Code implementation (easiest wins)
3. Then implement Employee Management
4. Finally tackle Inventory Management

Each feature is independent and can be implemented separately!

---

## Need Help?

Each feature has been designed to integrate seamlessly with your existing system. The database schema is normalized and follows best practices. All backend routes use tRPC for type safety.

Good luck with the implementation! 🚀
