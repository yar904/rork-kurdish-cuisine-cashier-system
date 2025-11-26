import { router, publicProcedure } from "./trpc.ts";
import { tablesRouter } from "./routers/tables.ts";
import { menuRouter } from "./routers/menu.ts";
import { ordersRouter } from "./routers/orders.ts";
import { kitchenRouter } from "./routers/kitchen.ts";
import { cashierRouter } from "./routers/cashier.ts";

export const appRouter = router({
  health: publicProcedure.query(() => ({ ok: true, timestamp: Date.now() })),
  tables: tablesRouter,
  menu: menuRouter,
  orders: ordersRouter,
  kitchen: kitchenRouter,
  cashier: cashierRouter
});

export type AppRouter = typeof appRouter;
