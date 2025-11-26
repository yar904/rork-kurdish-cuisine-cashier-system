# Restaurant POS System

A single-location restaurant POS built with Expo Router, Supabase, and tRPC. The stack includes:
- Public menu and QR table ordering
- Kitchen display system
- Cashier dashboard
- Staff authentication via Supabase
- Supabase Edge Function backend (tRPC) at `https://opsqnzswjxzvywqjvjy.functions.supabase.co/tapse-backend`

## Project Structure
- `app/`: Expo Router screens (public menu, ordering, tracking, staff tabs)
- `contexts/`: React context providers for auth, language, and table state
- `lib/`: Shared clients (Supabase, single tRPC client)
- `supabase/schema.sql`: Database schema and seed data
- `supabase/functions/tapse-backend/`: Supabase Edge Function implementing the tRPC backend

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the Expo app:
   ```bash
   npm run start
   ```
3. Serve the Supabase Edge Function locally (requires Supabase CLI and env vars):
   ```bash
   npm run backend:dev
   ```
4. Deploy the Edge Function:
   ```bash
   npm run backend:deploy
   ```

## QR Ordering Flow
1. Customer scans a table QR code, opening `/customer-order?slug=<qr_slug>`.
2. Menu data is loaded from the tRPC backend.
3. Customer adds items to cart and sends the order to Supabase.
4. Kitchen updates item statuses in the Kitchen tab.
5. Waiter marks tables and delivers dishes.
6. Cashier marks payments and closes orders.

## Environment
- Supabase project URL: `https://opsqnzswjxzvywqjvjy.supabase.co`
- Supabase anon key: bundled in `lib/supabase.ts`
