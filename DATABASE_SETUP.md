# Database Setup Guide

## Supabase Database Schema

Run these SQL commands in your Supabase SQL Editor to set up the database:

```sql
-- Create menu_items table
CREATE TABLE menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  name_kurdish TEXT NOT NULL,
  name_arabic TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT NOT NULL,
  description_kurdish TEXT NOT NULL,
  description_arabic TEXT NOT NULL,
  image TEXT,
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tables table
CREATE TABLE tables (
  number INTEGER PRIMARY KEY,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'needs-cleaning')),
  capacity INTEGER NOT NULL,
  current_order_id UUID,
  reserved_for TEXT,
  last_cleaned TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number INTEGER NOT NULL REFERENCES tables(number),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'preparing', 'ready', 'served', 'paid')),
  waiter_name TEXT,
  total DECIMAL(10, 2) NOT NULL,
  split_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES menu_items(id),
  quantity INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_activity table
CREATE TABLE staff_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_orders_table_number ON orders(table_number);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_menu_items_category ON menu_items(category);
CREATE INDEX idx_menu_items_available ON menu_items(available);
CREATE INDEX idx_tables_status ON tables(status);
CREATE INDEX idx_staff_activity_timestamp ON staff_activity(timestamp DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_activity ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (for customer menu viewing)
CREATE POLICY "Allow public read access to menu_items" ON menu_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access to tables" ON tables
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to orders" ON orders
  FOR SELECT USING (true);

CREATE POLICY "Allow public update to orders" ON orders
  FOR UPDATE USING (true);

CREATE POLICY "Allow public insert to order_items" ON order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to order_items" ON order_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert to staff_activity" ON staff_activity
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access to staff_activity" ON staff_activity
  FOR SELECT USING (true);

CREATE POLICY "Allow public update to tables" ON tables
  FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON menu_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial tables (12 tables with different capacities)
INSERT INTO tables (number, status, capacity) VALUES
  (1, 'available', 2),
  (2, 'available', 2),
  (3, 'available', 2),
  (4, 'available', 2),
  (5, 'available', 4),
  (6, 'available', 4),
  (7, 'available', 4),
  (8, 'available', 4),
  (9, 'available', 6),
  (10, 'available', 6),
  (11, 'available', 6),
  (12, 'available', 6);
```

## Environment Variables

1. Go to your Supabase project dashboard
2. Go to Settings > API
3. Copy your:
   - Project URL (EXPO_PUBLIC_SUPABASE_URL)
   - anon/public key (EXPO_PUBLIC_SUPABASE_ANON_KEY)
4. Create a `.env` file in your project root and add these values:

```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_RORK_API_BASE_URL=your-api-url-here
```

## Inserting Menu Items

You can insert your real menu items using the Supabase dashboard or by running SQL like:

```sql
INSERT INTO menu_items (
  name, name_kurdish, name_arabic, category, price,
  description, description_kurdish, description_arabic, image, available
) VALUES (
  'Chicken Kebab',
  'کباب مەرگ',
  'كباب الدجاج',
  'kebabs',
  15.99,
  'Grilled chicken skewers with traditional Kurdish spices',
  'کەوابی مەرگ بە بۆنخۆشییە کوردییەکان',
  'أسياخ دجاج مشوية بالتوابل الكردية التقليدية',
  'https://example.com/image.jpg',
  true
);
```

Repeat for all your menu items across categories:
- appetizers
- soups
- salads
- kebabs
- rice-dishes
- stews
- seafood
- breads
- desserts
- drinks
- shisha
- hot-drinks

## Real-time Updates (Optional)

Enable real-time subscriptions in Supabase for live order updates:

1. Go to Database > Replication
2. Enable replication for tables: orders, order_items, tables
3. This allows staff to see live updates without refreshing
