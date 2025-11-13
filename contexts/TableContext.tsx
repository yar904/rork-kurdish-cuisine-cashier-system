import { useState, useCallback, useMemo, useEffect } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Table, TableStatus } from '@/types/restaurant';
import { trpc } from '@/lib/trpc';

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
  
  const tablesQuery = trpc.tables.getAll.useQuery(undefined, {
    refetchInterval: 5000,
  });

  useEffect(() => {
    if (tablesQuery.data && tablesQuery.data.length > 0) {
      const mappedTables = tablesQuery.data.map(t => ({
        number: t.table_number,
        status: t.status as TableStatus,
        capacity: t.capacity,
        lastCleaned: new Date(t.last_cleaned),
        currentOrderId: t.current_order_id || undefined,
      }));
      setTables(mappedTables);
    }
  }, [tablesQuery.data]);
  
  const updateTableMutation = trpc.tables.updateStatus.useMutation();

  const updateTableStatus = useCallback(async (tableNumber: number, status: TableStatus) => {
    setTables(prev => prev.map(table =>
      table.number === tableNumber
        ? { ...table, status, lastCleaned: status === 'available' ? new Date() : table.lastCleaned }
        : table
    ));
    
    try {
      await updateTableMutation.mutateAsync({
        tableNumber,
        status,
      });
      console.log(`Table ${tableNumber} status updated to ${status} in database`);
      await tablesQuery.refetch();
    } catch (error) {
      console.error('Error updating table status:', error);
      setTables(prev => prev.map(table =>
        table.number === tableNumber
          ? { ...table, status: tables.find(t => t.number === tableNumber)?.status || status }
          : table
      ));
    }
  }, [updateTableMutation, tablesQuery]);

  const assignOrderToTable = useCallback(async (tableNumber: number, orderId: string) => {
    setTables(prev => prev.map(table =>
      table.number === tableNumber
        ? { ...table, currentOrderId: orderId, status: 'occupied' as TableStatus }
        : table
    ));
    
    try {
      await updateTableMutation.mutateAsync({
        tableNumber,
        status: 'occupied',
        currentOrderId: orderId,
      });
      console.log(`Order ${orderId} assigned to table ${tableNumber}`);
    } catch (error) {
      console.error('Error assigning order to table:', error);
    }
  }, [updateTableMutation]);

  const clearTable = useCallback(async (tableNumber: number) => {
    setTables(prev => prev.map(table =>
      table.number === tableNumber
        ? { ...table, currentOrderId: undefined, status: 'needs-cleaning' as TableStatus, reservedFor: undefined }
        : table
    ));
    
    try {
      await updateTableMutation.mutateAsync({
        tableNumber,
        status: 'needs-cleaning',
      });
      console.log(`Table ${tableNumber} cleared`);
    } catch (error) {
      console.error('Error clearing table:', error);
    }
  }, [updateTableMutation]);

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
    isLoading: tablesQuery.isLoading,
    isError: tablesQuery.isError,
    refetch: tablesQuery.refetch,
  }), [tables, updateTableStatus, assignOrderToTable, clearTable, reserveTable, getTableByNumber, getAvailableTables, getOccupiedTables, tablesQuery.isLoading, tablesQuery.isError, tablesQuery.refetch]);
});
