import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, FlatList } from 'react-native';
import { Text } from '@/components/CustomText';
import { Stack } from 'expo-router';
import { Clock, DollarSign, XCircle, RefreshCw, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';

type TimeFilter = 'today' | 'week' | 'all';

export default function CashierHistory() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<TimeFilter>('today');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const getDateFilter = () => {
    const now = new Date();
    switch (filter) {
      case 'today':
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return { fromDate: today.toISOString() };
      case 'week':
        const week = new Date();
        week.setDate(week.getDate() - 7);
        return { fromDate: week.toISOString() };
      default:
        return {};
    }
  };

  const historyQuery = trpc.orders.getPaidHistory.useQuery({
    limit: 100,
    ...getDateFilter(),
  });

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getTotalRevenue = () => {
    if (!historyQuery.data) return 0;
    return historyQuery.data.reduce((sum, order) => sum + order.total, 0);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Order History',
          headerStyle: { backgroundColor: '#5C0000' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />

      <View style={styles.content}>
        <View style={styles.filterRow}>
          {(['today', 'week', 'all'] as TimeFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
                {f === 'today' ? 'Today' : f === 'week' ? 'This Week' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {!historyQuery.isLoading && historyQuery.data && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Orders</Text>
              <Text style={styles.summaryValue}>{historyQuery.data.length}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Revenue</Text>
              <Text style={styles.summaryValue}>IQD {getTotalRevenue().toLocaleString()}</Text>
            </View>
          </View>
        )}

        {historyQuery.isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5C0000" />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        )}

        {historyQuery.error && (
          <View style={styles.errorContainer}>
            <XCircle size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Error Loading History</Text>
            <Text style={styles.errorText}>{historyQuery.error.message}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => historyQuery.refetch()}>
              <RefreshCw size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!historyQuery.isLoading && !historyQuery.error && historyQuery.data?.length === 0 && (
          <View style={styles.emptyContainer}>
            <Calendar size={64} color="#8E8E93" />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyText}>
              {filter === 'today' ? 'No orders today yet' : filter === 'week' ? 'No orders this week' : 'No order history available'}
            </Text>
          </View>
        )}

        {!historyQuery.isLoading && !historyQuery.error && historyQuery.data && historyQuery.data.length > 0 && (
          <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
            {historyQuery.data.map((order) => (
              <View key={order.id} style={styles.orderHistoryCard}>
                <View style={styles.orderHistoryHeader}>
                  <View style={styles.orderHistoryInfo}>
                    <Text style={styles.tableLabel}>Table {order.tableNumber}</Text>
                    <Text style={styles.dateText}>{formatDate(order.createdAt)} at {formatTime(order.createdAt)}</Text>
                  </View>
                  <View style={styles.orderHistoryAmount}>
                    <Text style={styles.amountLabel}>Paid</Text>
                    <Text style={styles.amountValue}>IQD {order.total.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.orderHistoryBody}>
                  <Text style={styles.itemsCountText}>{order.items.length} items</Text>
                  {order.waiterName && (
                    <Text style={styles.waiterText}>Served by {order.waiterName}</Text>
                  )}
                </View>

                <View style={styles.itemsList}>
                  {order.items.slice(0, 3).map((item: any, index: number) => (
                    <Text key={index} style={styles.itemText}>
                      • {item.quantity}x {item.menuItem?.name || 'Unknown'}
                    </Text>
                  ))}
                  {order.items.length > 3 && (
                    <Text style={styles.itemText}>+ {order.items.length - 3} more items</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EEDD',
  },
  content: {
    flex: 1,
    padding: 20,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  filterButtonActive: {
    backgroundColor: '#5C0000',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3A3A3A',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500' as const,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#F6EEDD',
    marginHorizontal: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  errorText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#5C0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  ordersList: {
    flex: 1,
  },
  orderHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  orderHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderHistoryInfo: {
    flex: 1,
    gap: 4,
  },
  tableLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#3A3A3A',
  },
  dateText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  orderHistoryAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amountLabel: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600' as const,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  orderHistoryBody: {
    gap: 4,
    marginBottom: 12,
  },
  itemsCountText: {
    fontSize: 14,
    color: '#3A3A3A',
    fontWeight: '500' as const,
  },
  waiterText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  itemsList: {
    gap: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F6EEDD',
  },
  itemText: {
    fontSize: 14,
    color: '#3A3A3A',
  },
});
