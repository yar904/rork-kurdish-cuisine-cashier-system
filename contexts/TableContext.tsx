import React, { createContext, useContext, useState } from 'react';
import { trpc } from '@/lib/trpcClient';

export type TableInfo = {
  id: number;
  label: string;
  seats: number;
  status: 'available' | 'occupied' | 'dirty';
};

type TableContextValue = {
  table: TableInfo | null;
  setTableBySlug: (slug: string) => Promise<void>;
  clearTable: () => void;
};

const TableContext = createContext<TableContextValue | undefined>(undefined);

export const TableProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [table, setTable] = useState<TableInfo | null>(null);

  const setTableBySlug = async (slug: string) => {
    const result = await trpc.tables.bySlug.query({ qrSlug: slug });
    setTable(result as TableInfo);
  };

  const clearTable = () => setTable(null);

  return <TableContext.Provider value={{ table, setTableBySlug, clearTable }}>{children}</TableContext.Provider>;
};

export const useTable = () => {
  const ctx = useContext(TableContext);
  if (!ctx) throw new Error('useTable must be used within TableProvider');
  return ctx;
};
