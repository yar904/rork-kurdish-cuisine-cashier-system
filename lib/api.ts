import { trpcClient } from "@/lib/trpcClient";

// Menu
export const apiMenu = {
  getAll: () => trpcClient.menu.getAll.query(),
  create: (data: any) => trpcClient.menu.create.mutate(data),
  update: (data: any) => trpcClient.menu.update.mutate(data),
  delete: (id: string) => trpcClient.menu.delete.mutate({ id }),
};

// Orders
export const apiOrders = {
  create: (data: any) => trpcClient.orders.create.mutate(data),
  getAll: () => trpcClient.orders.getAll.query(),
  updateStatus: (data: any) => trpcClient.orders.updateStatus.mutate(data),
};

// Tables
export const apiTables = {
  getAll: () => trpcClient.tables.getAll.query(),
  updateStatus: (data: any) => trpcClient.tables.updateStatus.mutate(data),
};

// Ratings
export const apiRatings = {
  create: (data: any) => trpcClient.ratings.create.mutate(data),
  getByMenuItem: (id: string) =>
    trpcClient.ratings.getByMenuItem.query({ menuItemId: id }),
  getAllStats: () => trpcClient.ratings.getAllStats.query(),
};

// Notifications
export const apiNotifications = {
  publish: (data: any) => trpcClient.notifications.publish.mutate(data),
  list: () => trpcClient.notifications.list.query(),
  clear: (data: any) => trpcClient.notifications.clear.mutate(data),
};

// Employees
export const apiEmployees = {
  getAll: () => trpcClient.employees.getAll.query(),
  create: (data: any) => trpcClient.employees.create.mutate(data),
  update: (data: any) => trpcClient.employees.update.mutate(data),
  delete: (id: string) => trpcClient.employees.delete.mutate({ id }),
  clockIn: (data: any) => trpcClient.employees.clockIn.mutate(data),
  clockOut: (data: any) => trpcClient.employees.clockOut.mutate(data),
  getClockRecords: (data: any) =>
    trpcClient.employees.getClockRecords.query(data),
  getShifts: () => trpcClient.employees.getShifts.query(),
  createShift: (data: any) => trpcClient.employees.createShift.mutate(data),
  getMetrics: (data: any) => trpcClient.employees.getMetrics.query(data),
};

// Inventory
export const apiInventory = {
  getAll: () => trpcClient.inventory.getAll.query(),
  getLowStock: () => trpcClient.inventory.getLowStock.query(),
  create: (data: any) => trpcClient.inventory.create.mutate(data),
  update: (data: any) => trpcClient.inventory.update.mutate(data),
  adjustStock: (data: any) => trpcClient.inventory.adjustStock.mutate(data),
  getMovements: (data: any) => trpcClient.inventory.getMovements.query(data),
};

// Suppliers
export const apiSuppliers = {
  getAll: () => trpcClient.suppliers.getAll.query(),
  create: (data: any) => trpcClient.suppliers.create.mutate(data),
};

// Customer History
export const apiHistory = {
  save: (data: any) => trpcClient.customerHistory.save.mutate(data),
  getByTable: (id: string) =>
    trpcClient.customerHistory.getByTable.query({ tableId: id }),
};

// Reports
export const apiReports = {
  summary: (data: any) => trpcClient.reports.summary.query(data),
  comparison: (data: any) => trpcClient.reports.comparison.query(data),
  financial: (data: any) => trpcClient.reports.financial.query(data),
  employeePerformance: (data: any) =>
    trpcClient.reports.employeePerformance.query(data),
};
