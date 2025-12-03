# Kurdish Cuisine Cashier System — Technical Orientation

_Last updated: December 2025_

## 1. What this product is
A full-service restaurant operating system tailored for Kurdish fine-dining venues. It unifies QR code ordering, cashier operations, kitchen fulfillment, staff coordination, analytics, and administrative setup into a single Expo / React Native application that also runs on the web via React Native Web.

## 2. Who it serves
| Persona | Primary Goals |
| --- | --- |
| **Dining guests** (QR flow) | Browse localized menu, place orders, summon staff, and track progress from their table using QR codes.
| **Cashiers & hosts** | Manage live orders, take staff-side orders, assign tables, record payments.
| **Kitchen team** | View optimized make-lines, mark dishes as preparing/ready, get audible alerts for status shifts.
| **Managers / owners** | Track revenue, table turnover, ratings, staffing, and configure menu content.

## 3. Core experience map
```
Guest QR ➜ menu.getAll ➜ orders.create ➜ orders stream ➜ kitchen / cashier views
                                     │
                                     └─ notifications.publish ➜ staff tablets
```
- **CustomerOrderScreen (`app/customer-order.tsx`)**: Premium guest UI with animated Kurdish carpet theme, multi-language text, add-to-cart micro interactions, and tRPC-backed menu/ratings queries.
- **POS & Cashier flows (`app/(tabs)/cashier.tsx`, `app/cashier/history.tsx`)**: Table-level ticketing, payments, and audit history using Restaurant/Table contexts.
- **Kitchen & Operations (`app/(tabs)/kitchen.tsx`, `app/order-tracking.tsx`)**: Queue optimization driven by `RestaurantContext.optimizeKitchenQueue` with real-time Supabase subscriptions.
- **Admin / Menu management (`app/menu-management.tsx`, `components/admin/*`)**: Image uploader, category tooling, QR generator.
- **Analytics & Reports (`app/(tabs)/analytics.tsx`, `app/(tabs)/reports.tsx`)**: Pulls aggregated stats via `ratings.getAllStats`, `orders.getRevenueSummary`, etc.

## 4. Architecture snapshot
| Layer | Details |
| --- | --- |
| **UI** | Expo Router + React Native, strict TypeScript, StyleSheet-only styling, lucide-react-native icons, expo-linear-gradient + expo-glass-effect for visuals.
| **State** | React Query for server data, `@nkzw/create-context-hook` providers for domain state (Notifications, Restaurant, Tables, Language, Auth, Offline, Realtime).
| **Backend** | Supabase edge functions + tRPC router (`lib/trpcClient.ts`). All reads/writes flow through routers like `menu.getAll`, `orders.create`, `tables.updateStatus`, `ratings.getAllStats`.
| **Realtime** | Supabase realtime channels consumed inside `RealtimeContext`, fanned out to Restaurant/Notification providers.
| **Deployment** | Expo (native), Expo Router web build, Netlify/Vercel scripts, Railway/Supabase for backend.

## 5. Key modules & their contracts
### Customer Menu / QR ordering
- **Data**: `trpc.menu.getAll` (full menu), `trpc.ratings.getAllStats` (per-item aggregates).
- **Ordering**: `trpc.orders.create` mutation. Cart lives in local state; totals computed locally before submission.
- **Guest assistance**: `NotificationContext.publish({ tableNumber, type })` hits `notifications.publish` tRPC route; Supabase realtime pushes to staff devices.

### Restaurant / Staff console
- **`RestaurantContext`**
  - Keeps `orders` array synced via `trpc.orders.getAll` + realtime.
  - Provides `submitOrder`, `updateOrderStatus`, `getAIRecommendations`, `optimizeKitchenQueue`.
  - Emits lightweight web audio cues (new/ready/paid) without native modules.
- **`TableContext`**
  - Hydrates from `trpc.tables.getAll` every 5s.
  - Methods: `updateTableStatus`, `assignOrderToTable`, `clearTable`, `reserveTable`.
- **`NotificationContext`**
  - Lists/publishes/clears table notifications, normalizing Supabase row shapes.
  - Subscribes to realtime `INSERT`/`DELETE` events, keeps queries in sync via `trpc.useUtils()`.

### Analytics & Insights
- Aggregations exposed through dedicated tRPC procedures (`ratings.getAllStats`, `orders.getRevenueSummary`, `employees.getShiftStats`, etc.).
- Client uses React Query object API with `staleTime` tuning for dashboards.

## 6. Data flow & realtime
1. **Reads**: Always via `trpc.<namespace>.<procedure>.useQuery`. No REST fetches remain.
2. **Writes**: `useMutation` hooks with optimistic UI in contexts (tables/orders) and refetch fallbacks.
3. **Realtime**: `RealtimeContext` subscribes to Supabase channels, forwarding payloads to contexts (orders, notifications) which reconcile local state + trigger React Query invalidations.
4. **Caching**: React Query caches per procedure key; contexts memoize derivations like `availableTables` or `cartTotal`.

## 7. Environment configuration
| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase project + anon key for client SDK and edge functions.
| `EXPO_PUBLIC_SUPABASE_FUNCTIONS_URL` | Direct edge-function base (tRPC proxy).
| `EXPO_PUBLIC_TRPC_URL` | HTTPS URL that `trpcClient` targets; defaults to Supabase function URL.
| `EXPO_PUBLIC_RORK_API_BASE_URL` | Rork platform services (AI, automations).
| `FRONTEND_URL` | Used by server functions for redirects/origin checks.
| `SUPABASE_ANON_KEY`, `NODE_ENV` | Legacy scripts / backend.

## 8. Development workflow
1. `bun install` then `bun start` (native) or `bun run start-web` (web preview).
2. Providers mounted in `app/_layout.tsx`: React Query ➜ contexts ➜ `RootLayoutNav`.
3. All screens include `testID`s and verbose `console.log` traces (keep this pattern when extending).
4. Use Animated API / PanResponder for motion; avoid Reanimated unless absolutely required.
5. Error handling: All screens show retry states with friendly copy; propagate TS-safe errors (see customer order loader).

## 9. Testing & quality
- Unit tests housed in `__tests__` (Jest). Run via `bun test`.
- Type safety enforced with `bunx tsc --noEmit` (run before shipping).
- Linting via Expo Router’s ESLint config.
- Manual QA checklist captured in `/TESTING_QUICK_START.md` and `/ACTION_PLAN.md`.

## 10. Extending the system
- **New data models**: Add procedures to Supabase tRPC router (`supabase/functions/tapse-backend/trpc/app-router.ts`) and import via `trpc` client.
- **Persisted UI state**: Prefer provider + AsyncStorage inside context using `@nkzw/create-context-hook`.
- **Design system**: Follow `Colors` constants, glass gradients, micro-interaction patterns already present in `components/qr` and `components/pos-ui`.
- **AI features**: Use `components/AIRecommendations.tsx` + Rork toolkit skill if expanding AI assistants.

## 11. Quick glossary
- **Table notification**: Staff alert triggered from guest UI (`assist`, `bill`, `notify`).
- **Ready notification**: Kitchen-to-waiter popup triggered when `orders.updateStatus` transitions to `ready`.
- **Customer history**: Stored via `trpc.customerHistory.save` for loyalty/analytics.
- **Glass View**: `expo-glass-effect` drop-in used on high-touch surfaces (bottom CTA bars).

---
Need more? Check `README_FOR_YOU.md` for product pitch, `DEPLOYMENT_*` docs for ops runbooks, and `/supabase/functions/tapse-backend` for backend logic.
