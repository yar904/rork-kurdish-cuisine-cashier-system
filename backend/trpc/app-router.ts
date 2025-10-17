import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import menuGetAllRoute from "./routes/menu/getAll/route";
import tablesGetAllRoute from "./routes/tables/getAll/route";
import tablesUpdateStatusRoute from "./routes/tables/updateStatus/route";
import ordersCreateRoute from "./routes/orders/create/route";
import ordersGetAllRoute from "./routes/orders/getAll/route";
import ordersUpdateStatusRoute from "./routes/orders/updateStatus/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  menu: createTRPCRouter({
    getAll: menuGetAllRoute,
  }),
  tables: createTRPCRouter({
    getAll: tablesGetAllRoute,
    updateStatus: tablesUpdateStatusRoute,
  }),
  orders: createTRPCRouter({
    create: ordersCreateRoute,
    getAll: ordersGetAllRoute,
    updateStatus: ordersUpdateStatusRoute,
  }),
});

export type AppRouter = typeof appRouter;
