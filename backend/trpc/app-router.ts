import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import menuGetAllRoute from "./routes/menu/getAll/route";
import menuCreateRoute from "./routes/menu/create/route";
import menuUpdateRoute from "./routes/menu/update/route";
import menuDeleteRoute from "./routes/menu/delete/route";
import { linkIngredientsProcedure } from "./routes/menu/linkIngredients/route";
import { getMenuIngredientsProcedure } from "./routes/menu/getIngredients/route";
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
import { createRatingProcedure } from "./routes/ratings/create/route";
import { getRatingsByMenuItemProcedure } from "./routes/ratings/getByMenuItem/route";
import { getAllRatingsStatsProcedure } from "./routes/ratings/getAllStats/route";
import { reportsSummaryProcedure } from "./routes/reports/summary/route";
import { reportsComparisonProcedure } from "./routes/reports/comparison/route";
import { getAllEmployeesProcedure } from "./routes/employees/getAll/route";
import { createEmployeeProcedure } from "./routes/employees/create/route";
import { updateEmployeeProcedure } from "./routes/employees/update/route";
import { deleteEmployeeProcedure } from "./routes/employees/delete/route";
import { clockInProcedure } from "./routes/employees/clockIn/route";
import { clockOutProcedure } from "./routes/employees/clockOut/route";
import { getClockRecordsProcedure } from "./routes/employees/getClockRecords/route";
import { getShiftsProcedure } from "./routes/employees/getShifts/route";
import { createShiftProcedure } from "./routes/employees/createShift/route";
import { getEmployeeMetricsProcedure } from "./routes/employees/getMetrics/route";
import { getAllInventoryProcedure } from "./routes/inventory/getAll/route";
import { getLowStockProcedure } from "./routes/inventory/getLowStock/route";
import { createInventoryProcedure } from "./routes/inventory/create/route";
import { updateInventoryProcedure } from "./routes/inventory/update/route";
import { adjustStockProcedure } from "./routes/inventory/adjustStock/route";
import { getStockMovementsProcedure } from "./routes/inventory/getMovements/route";
import { getAllSuppliersProcedure } from "./routes/suppliers/getAll/route";
import { createSupplierProcedure } from "./routes/suppliers/create/route";

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
