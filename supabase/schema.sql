-- Restaurant POS schema for single-location deployment
-- Enum definitions
create type order_status as enum ('pending', 'confirmed', 'preparing', 'ready', 'served', 'closed');
create type kitchen_status as enum ('new', 'in_progress', 'done');
create type payment_status as enum ('unpaid', 'paid', 'refunded');
create type table_status as enum ('available', 'occupied', 'dirty');

-- Staff profiles (Supabase Auth users are linked through user_id)
create table public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('admin','cashier','chef','waiter')),
  created_at timestamptz not null default now()
);

-- Dining tables
create table public.tables (
  id bigserial primary key,
  label text not null unique,
  seats integer not null default 2,
  status table_status not null default 'available',
  qr_slug text not null unique,
  updated_at timestamptz not null default now()
);

-- Menu categories
create table public.menu_categories (
  id bigserial primary key,
  name text not null,
  description text,
  position integer not null default 0
);

-- Menu items
create table public.menu_items (
  id bigserial primary key,
  category_id bigint references public.menu_categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(10,2) not null,
  is_available boolean not null default true,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Orders
create table public.orders (
  id bigserial primary key,
  table_id bigint references public.tables(id) on delete set null,
  customer_name text,
  status order_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  total numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Order items
create table public.order_items (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  menu_item_id bigint not null references public.menu_items(id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(10,2) not null,
  status kitchen_status not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payments
create table public.payments (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  amount numeric(10,2) not null,
  status payment_status not null default 'unpaid',
  method text not null default 'cash',
  transaction_reference text,
  created_at timestamptz not null default now()
);

-- Order timeline for audits
create table public.order_events (
  id bigserial primary key,
  order_id bigint not null references public.orders(id) on delete cascade,
  event text not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.staff_profiles(id)
);

-- Views to simplify POS queries
create view public.kitchen_queue as
select oi.id, o.id as order_id, t.label as table_label, oi.status, oi.notes, mi.name as item_name, oi.quantity,
       o.created_at as order_created_at, oi.created_at as item_created_at
from public.order_items oi
join public.orders o on oi.order_id = o.id
left join public.tables t on o.table_id = t.id
join public.menu_items mi on oi.menu_item_id = mi.id
where o.status not in ('closed')
order by o.created_at asc;

-- Basic RLS placeholders (configure policies per environment)
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.tables enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_categories enable row level security;
alter table public.payments enable row level security;
alter table public.order_events enable row level security;

-- Development policies (replace for production)
create policy "Allow all access for development" on public.orders for all using (true) with check (true);
create policy "Allow all access for development" on public.order_items for all using (true) with check (true);
create policy "Allow all access for development" on public.tables for all using (true) with check (true);
create policy "Allow all access for development" on public.menu_items for all using (true) with check (true);
create policy "Allow all access for development" on public.menu_categories for all using (true) with check (true);
create policy "Allow all access for development" on public.payments for all using (true) with check (true);
create policy "Allow all access for development" on public.order_events for all using (true) with check (true);

-- Helpful seed data
insert into public.menu_categories (name, description, position) values
('Starters', 'Light bites to begin', 1),
('Mains', 'Hearty main dishes', 2),
('Drinks', 'Hot and cold beverages', 3);

insert into public.menu_items (category_id, name, description, price) values
(1, 'Hummus Plate', 'Chickpeas, tahini, olive oil, and pita bread', 6.50),
(2, 'Grilled Chicken', 'Charcoal grilled chicken with herbs', 14.00),
(2, 'Veggie Wrap', 'Grilled vegetables wrapped in flatbread', 10.00),
(3, 'Mint Tea', 'Fresh mint steeped tea', 3.00);

insert into public.tables (label, seats, qr_slug) values
('T1', 2, 'table-t1'),
('T2', 4, 'table-t2'),
('T3', 4, 'table-t3');
