-- Add cost tracking column to menu_items table
-- This enables profit margin calculations for financial reports
-- Run this migration on your Supabase database

ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS cost DECIMAL(10, 2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN menu_items.cost IS 'Cost price of the menu item for profit margin calculations';

-- Update existing menu items with estimated cost (30% of selling price as default)
-- You should update these with actual costs later
UPDATE menu_items 
SET cost = price * 0.3 
WHERE cost = 0 OR cost IS NULL;
