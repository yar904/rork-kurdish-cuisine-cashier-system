import { createTRPCRouter } from "./create-context.js";
import hiRoute from "./routes/example/hi/route.js";
import menuGetAllRoute from "./routes/menu/getAll/route.js";
import menuCreateRoute from "./routes/menu/create/route.js";
import menuUpdateRoute from "./routes/menu/update/route.js";
import menuDeleteRoute from "./routes/menu/delete/route.js";
import { linkIngredientsProcedure } from "./routes/menu/linkIngredients/route.js";
import { getMenuIngredientsProcedure } from "./routes/menu/getIngredients/route.js";
import tablesGetAllRoute from "./routes/tables/getAll/route.js";
import tablesUpdateStatusRoute from "./routes/tables/updateStatus/route.js";
import ordersCreateRoute from "./routes/orders/create/route.js";
import ordersGetAllRoute from "./routes/orders/getAll/route.js";
import ordersUpdateStatusRoute from "./routes/orders/updateStatus/route.js";
import { createServiceRequestProcedure } from "./routes/service-requests/create/route.js";
import { getAllServiceRequestsProcedure } from "./routes/service-requests/getAll/route.js";
import { updateServiceRequestStatusProcedure } from "./routes/service-requests/updateStatus/route.js";
import { saveCustomerOrderHistoryProcedure } from "./routes/customer-history/save/route.js";
import { getCustomerOrderHistoryProcedure } from "./routes/customer-history/getByTable/route.js";
import { createRatingProcedure } from "./routes/ratings/create/route.js";
import { getRatingsByMenuItemProcedure } from "./routes/ratings/getByMenuItem/route.js";
import { getAllRatingsStatsProcedure } from "./routes/ratings/getAllStats/route.js";
import { reportsSummaryProcedure } from "./routes/reports/summary/route.js";
import { reportsComparisonProcedure } from "./routes/reports/comparison/route.js";
import { getAllEmployeesProcedure } from "./routes/employees/getAll/route.js";
import { createEmployeeProcedure } from "./routes/employees/create/route.js";
import { updateEmployeeProcedure } from "./routes/employees/update/route.js";
import { deleteEmployeeProcedure } from "./routes/employees/delete/route.js";
import { clockInProcedure } from "./routes/employees/clockIn/route.js";
import { clockOutProcedure } from "./routes/employees/clockOut/route.js";
import { getClockRecordsProcedure } from "./routes/employees/getClockRecords/route.js";
import { getShiftsProcedure } from "./routes/employees/getShifts/route.js";
import { createShiftProcedure } from "./routes/employees/createShift/route.js";
import { getEmployeeMetricsProcedure } from "./routes/employees/getMetrics/route.js";
import { getAllInventoryProcedure } from "./routes/inventory/getAll/route.js";
import { getLowStockProcedure } from "./routes/inventory/getLowStock/route.js";
import { createInventoryProcedure } from "./routes/inventory/create/route.js";
import { updateInventoryProcedure } from "./routes/inventory/update/route.js";
import { adjustStockProcedure } from "./routes/inventory/adjustStock/route.js";
import { getStockMovementsProcedure } from "./routes/inventory/getMovements/route.js";
import { getAllSuppliersProcedure } from "./routes/suppliers/getAll/route.js";
import { createSupplierProcedure } from "./routes/suppliers/create/route.js";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  menu: createTRPCRouter({
    getAll: menuGetAllRoute,
    create: menuCreateRoute,
    update: menuUpdateRoute,
    delete: menuDeleteRoute,
    linkIngredients: linkIngredientsProcedure,
    getIngredients: getMenuIngredientsProcedure,
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
  ratings: createTRPCRouter({
    create: createRatingProcedure,
    getByMenuItem: getRatingsByMenuItemProcedure,
    getAllStats: getAllRatingsStatsProcedure,
  }),
  reports: createTRPCRouter({
    summary: reportsSummaryProcedure,
    comparison: reportsComparisonProcedure,
  }),
  employees: createTRPCRouter({
    getAll: getAllEmployeesProcedure,
    create: createEmployeeProcedure,
    update: updateEmployeeProcedure,
    delete: deleteEmployeeProcedure,
    clockIn: clockInProcedure,
    clockOut: clockOutProcedure,
    getClockRecords: getClockRecordsProcedure,
    getShifts: getShiftsProcedure,
    createShift: createShiftProcedure,
    getMetrics: getEmployeeMetricsProcedure,
  }),
  inventory: createTRPCRouter({
    getAll: getAllInventoryProcedure,
    getLowStock: getLowStockProcedure,
    create: createInventoryProcedure,
    update: updateInventoryProcedure,
    adjustStock: adjustStockProcedure,
    getMovements: getStockMovementsProcedure,
  }),
  suppliers: createTRPCRouter({
    getAll: getAllSuppliersProcedure,
    create: createSupplierProcedure,
  }),
});

export type AppRouter = typeof appRouter;
