import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// 🧩 Initialize Hono app
const app = new Hono();

// 🧠 Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// 🩺 Health check route
app.get('/', (c) => c.json({ status: '🟢 Backend running successfully' }));

// 🧾 MENU ROUTE — get all menu items
app.get('/menu', async (c) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// 🛒 CREATE ORDER — add a new order
app.post('/orders', async (c) => {
  const body = await c.req.json();
  const { table_id, total, status } = body;

  const { data, error } = await supabase
    .from('orders')
    .insert([{ table_id, total, status }])
    .select()
    .single();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// 📦 ADD ORDER ITEMS — add items for an order
app.post('/order-items', async (c) => {
  const body = await c.req.json();
  const { order_id, menu_item_id, quantity, price } = body;

  const { data, error } = await supabase
    .from('order_items')
    .insert([{ order_id, menu_item_id, quantity, price }])
    .select();

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// 📜 GET ALL ORDERS — fetch orders with items + table info
app.get('/orders', async (c) => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*), tables(table_number)')
    .order('created_at', { ascending: false });

  if (error) return c.json({ error: error.message }, 500);
  return c.json(data);
});

// 🚀 Start local server
serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 3000,
});

console.log('🟢 Backend running on http://localhost:3000');