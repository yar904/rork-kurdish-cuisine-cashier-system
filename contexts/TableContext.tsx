import { useState, useCallback, useMemo } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Table, TableStatus } from '@/types/restaurant';

const generateInitialTables = (): Table[] => {
  return Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    status: 'available' as TableStatus,
    capacity: i < 4 ? 2 : i < 8 ? 4 : 6,
    lastCleaned: new Date(),
  }));
};

export const [TableProvider, useTables] = createContextHook(() => {
  const [tables, setTables] = useState<Table[]>(generateInitialTables());

  const updateTableStatus = useCallback((tableNumber: number, status: TableStatus) => {
    setTables(prev => prev.map(table =>
      table.number === tableNumber
        ? { ...table, status, lastCleaned: status === 'available' ? new Date() : table.lastCleaned }
        : table
    ));
    console.log(`Table ${tableNumber} status updated to ${status}`);
  }, []);

  const assignOrderToTable = useCallback((tableNumber: number, orderId: string) => {
    setTables(prev => prev.map(table =>
      table.number === tableNumber
        ? { ...table, currentOrderId: orderId, status: 'occupied' as TableStatus }
        : table
    ));
  }, []);

  const clearTable = useCallback((tableNumber: number) => {
    setTables(prev => prev.map(table =>
      table.number === tableNumber
        ? { ...table, currentOrderId: undefined, status: 'needs-cleaning' as TableStatus, reservedFor: undefined }
        : table
    ));
  }, []);

  const reserveTable = useCallback((tableNumber: number, reservedFor: string) => {
    setTables(prev => prev.map(table =>
      table.number === tableNumber
        ? { ...table, status: 'reserved' as TableStatus, reservedFor }
        : table
    ));
  }, []);

  const getTableByNumber = useCallback((tableNumber: number) => {
    return tables.find(t => t.number === tableNumber);
  }, [tables]);

  const getAvailableTables = useMemo(() => {
    return tables.filter(t => t.status === 'available');
  }, [tables]);

  const getOccupiedTables = useMemo(() => {
    return tables.filter(t => t.status === 'occupied');
  }, [tables]);

  return useMemo(() => ({
    tables,
    updateTableStatus,
    assignOrderToTable,
    clearTable,
    reserveTable,
    getTableByNumber,
    availableTables: getAvailableTables,
    occupiedTables: getOccupiedTables,
  }), [tables, updateTableStatus, assignOrderToTable, clearTable, reserveTable, getTableByNumber, getAvailableTables, getOccupiedTables]);
});
