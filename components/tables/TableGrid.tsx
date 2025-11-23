import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '@/components/CustomText';
import { TableCard } from './TableCard';
import { CheckCircle2 } from 'lucide-react-native';

interface Table {
  table_number: number;
  status: string;
  order_total?: number | null;
  created_at?: string;
}

interface TableGridProps {
  tables: Table[];
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onTablePress: (tableNumber: number) => void;
}

export function TableGrid({ tables, isLoading, isRefreshing, onRefresh, onTablePress }: TableGridProps) {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5C0000" />
      </View>
    );
  }

  if (tables.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <CheckCircle2 size={64} color="#8E8E93" />
        <Text style={styles.emptyText}>No tables available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#5C0000" />
      }
    >
      <View style={styles.grid}>
        {tables.map((table) => (
          <TableCard
            key={table.table_number}
            tableNumber={table.table_number}
            status={table.status}
            orderTotal={table.order_total}
            timeSinceSeated={table.created_at ? new Date(table.created_at) : null}
            onPress={() => onTablePress(table.table_number)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    padding: 4,
  },
});
