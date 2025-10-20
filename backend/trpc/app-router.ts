import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import menuGetAllRoute from "./routes/menu/getAll/route";
import tablesGetAllRoute from "./routes/tables/getAll/route";
import tablesUpdateStatusRoute from "./routes/tables/updateStatus/route";
import ordersCreateRoute from "./routes/orders/create/route";
import ordersGetAllRoute from "./routes/orders/getAll/route";
import ordersUpdateStatusRoute from "./routes/orders/updateStatus/route";
import { createServiceRequestProcedure } from "./routes/service-requests/create/route";
import { getAllServiceRequestsProcedure } from "./routes/service-requests/getAll/route";
import { updateServiceRequestStatusProcedure } from "./routes/service-requests/updateStatus/route";
import { saveCustomerOrderHistoryProcedure } from "./routes/customer-history/save/route";
import { getCustomerOrderHistoryProcedure } from "./routes/customer-history/getByTable/route";

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
  serviceRequests: createTRPCRouter({
    create: createServiceRequestProcedure,
    getAll: getAllServiceRequestsProcedure,
    updateStatus: updateServiceRequestStatusProcedure,
  }),
  customerHistory: createTRPCRouter({
    save: saveCustomerOrderHistoryProcedure,
    getByTable: getCustomerOrderHistoryProcedure,
  }),
});

export type AppRouter = typeof appRouter;
