import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Text } from '@/components/CustomText';
import { Stack } from 'expo-router';
import { FileText, DollarSign, Package, Table as TableIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';

type ReportTab = 'sales' | 'items' | 'operations';

type DailySalesEntry = {
  sale_date: string;
  total_sales: number;
  order_count: number;
  avg_order_value: number;
};

type GroupedSales = {
  label: string;
  total_sales: number;
  order_count: number;
  avg_order_value: number;
};

const groupDailyByWeek = (daily: DailySalesEntry[]): GroupedSales[] => {
  const grouped: Record<string, GroupedSales> = {};

  daily.forEach((day) => {
    const current = new Date(day.sale_date);
    const temp = new Date(current);
    const dayOfWeek = temp.getDay();
    const diff = temp.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    temp.setDate(diff);

    const weekStart = new Date(temp.getFullYear(), temp.getMonth(), temp.getDate());
    const yearStart = new Date(weekStart.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((weekStart.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    const label = `Week ${weekNumber}`;

    if (!grouped[label]) {
      grouped[label] = { label, total_sales: 0, order_count: 0, avg_order_value: 0 };
    }

    grouped[label].total_sales += day.total_sales;
    grouped[label].order_count += day.order_count;
  });

  return Object.values(grouped)
    .map((entry) => ({
      ...entry,
      avg_order_value: entry.order_count > 0 ? entry.total_sales / entry.order_count : 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

const groupDailyByMonth = (daily: DailySalesEntry[]): GroupedSales[] => {
  const grouped: Record<string, GroupedSales> = {};

  daily.forEach((day) => {
    const date = new Date(day.sale_date);
    const label = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;

    if (!grouped[label]) {
      grouped[label] = { label, total_sales: 0, order_count: 0, avg_order_value: 0 };
    }

    grouped[label].total_sales += day.total_sales;
    grouped[label].order_count += day.order_count;
  });

  return Object.values(grouped)
    .map((entry) => ({
      ...entry,
      avg_order_value: entry.order_count > 0 ? entry.total_sales / entry.order_count : 0,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
};

const useReportDateRange = () =>
  useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  }, []);

export default function ReportsDashboard() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ReportTab>('sales');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Reports',
          headerStyle: { backgroundColor: '#5C0000' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'sales' && styles.tabActive]}
          onPress={() => setActiveTab('sales')}
        >
          <DollarSign size={20} color={activeTab === 'sales' ? '#FFFFFF' : '#5C0000'} />
          <Text style={[styles.tabText, activeTab === 'sales' && styles.tabTextActive]}>
            Sales
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'items' && styles.tabActive]}
          onPress={() => setActiveTab('items')}
        >
          <Package size={20} color={activeTab === 'items' ? '#FFFFFF' : '#5C0000'} />
          <Text style={[styles.tabText, activeTab === 'items' && styles.tabTextActive]}>
            Items
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'operations' && styles.tabActive]}
          onPress={() => setActiveTab('operations')}
        >
          <TableIcon size={20} color={activeTab === 'operations' ? '#FFFFFF' : '#5C0000'} />
          <Text style={[styles.tabText, activeTab === 'operations' && styles.tabTextActive]}>
            Operations
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'sales' && <SalesReports />}
      {activeTab === 'items' && <ItemPerformance />}
      {activeTab === 'operations' && <OperationsOverview />}
    </View>
  );
}

function SalesReports() {
  const dateRange = useReportDateRange();

  const summaryQuery = trpc.reports.summary.useQuery(dateRange);

  const dailySales = useMemo(
    () =>
      (summaryQuery.data?.dailySales ?? []).map((day) => ({
        sale_date: day.date,
        total_sales: day.revenue,
        order_count: day.orders,
        avg_order_value: day.orders > 0 ? day.revenue / day.orders : 0,
      })),
    [summaryQuery.data?.dailySales],
  );

  const weeklySales = useMemo(() => groupDailyByWeek(dailySales), [dailySales]);
  const monthlySales = useMemo(() => groupDailyByMonth(dailySales), [dailySales]);

  if (summaryQuery.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5C0000" />
        <Text style={styles.loadingText}>Loading sales data...</Text>
      </View>
    );
  }

  const totalDailySales = dailySales.reduce((sum, day) => sum + day.total_sales, 0);
  const totalDailyOrders = dailySales.reduce((sum, day) => sum + day.order_count, 0);

  return (
    <ScrollView style={styles.content}>
      <View style={styles.summaryCards}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Revenue (30d)</Text>
          <Text style={styles.summaryValue}>${totalDailySales.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Orders (30d)</Text>
          <Text style={styles.summaryValue}>{totalDailyOrders}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Sales</Text>
        {dailySales.length === 0 ? (
          <Text style={styles.emptyText}>No daily sales data</Text>
        ) : (
          dailySales.map((day, idx) => (
            <View key={idx} style={styles.reportRow}>
              <View style={styles.reportRowLeft}>
                <Text style={styles.reportRowTitle}>{new Date(day.sale_date).toLocaleDateString()}</Text>
                <Text style={styles.reportRowSubtitle}>{day.order_count} orders</Text>
              </View>
              <Text style={styles.reportRowValue}>${day.total_sales.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Sales</Text>
        {weeklySales.length === 0 ? (
          <Text style={styles.emptyText}>No weekly sales data</Text>
        ) : (
          weeklySales.map((week, idx) => (
            <View key={week.label} style={styles.reportRow}>
              <View style={styles.reportRowLeft}>
                <Text style={styles.reportRowTitle}>{week.label}</Text>
                <Text style={styles.reportRowSubtitle}>
                  {week.order_count} orders • Avg ${week.avg_order_value.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.reportRowValue}>${week.total_sales.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Sales</Text>
        {monthlySales.length === 0 ? (
          <Text style={styles.emptyText}>No monthly sales data</Text>
        ) : (
          monthlySales.map((month) => (
            <View key={month.label} style={styles.reportRow}>
              <View style={styles.reportRowLeft}>
                <Text style={styles.reportRowTitle}>{month.label}</Text>
                <Text style={styles.reportRowSubtitle}>
                  {month.order_count} orders • Avg ${month.avg_order_value.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.reportRowValue}>${month.total_sales.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function ItemPerformance() {
  const dateRange = useReportDateRange();
  const summaryQuery = trpc.reports.summary.useQuery(dateRange);
  const menuQuery = trpc.menu.getAll.useQuery();

  const mappedItems = useMemo(() => {
    const menuMap = new Map((menuQuery.data ?? []).map((item) => [item.id, item]));

    return (summaryQuery.data?.topItems ?? []).map((item) => {
      const menuItem = menuMap.get(item.id);

      return {
        item_id: item.id,
        item_name: item.name,
        category: menuItem?.category ?? 'Uncategorized',
        total_quantity: item.quantity,
        total_revenue: item.revenue,
        order_count: item.quantity,
      };
    });
  }, [menuQuery.data, summaryQuery.data?.topItems]);

  if (summaryQuery.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5C0000" />
        <Text style={styles.loadingText}>Loading item data...</Text>
      </View>
    );
  }

  const sortedItems = mappedItems.sort((a, b) => b.total_revenue - a.total_revenue);
  const topItems = sortedItems.slice(0, 10);

  return (
    <ScrollView style={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Selling Items</Text>
        {topItems.length === 0 ? (
          <Text style={styles.emptyText}>No item sales data</Text>
        ) : (
          topItems.map((item, idx) => (
            <View key={item.item_id} style={styles.reportRow}>
              <View style={styles.reportRowLeft}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>#{idx + 1}</Text>
                </View>
                <View style={styles.reportRowContent}>
                  <Text style={styles.reportRowTitle}>{item.item_name}</Text>
                  <Text style={styles.reportRowSubtitle}>
                    {item.category} • Qty: {item.total_quantity}
                  </Text>
                </View>
              </View>
              <Text style={styles.reportRowValue}>${item.total_revenue.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Items</Text>
        {sortedItems.length === 0 ? (
          <Text style={styles.emptyText}>No item sales data</Text>
        ) : (
          sortedItems.map((item) => (
            <View key={item.item_id} style={styles.reportRow}>
              <View style={styles.reportRowLeft}>
                <View style={styles.reportRowContent}>
                  <Text style={styles.reportRowTitle}>{item.item_name}</Text>
                  <Text style={styles.reportRowSubtitle}>
                    {item.category} • {item.order_count} orders • Qty: {item.total_quantity}
                  </Text>
                </View>
              </View>
              <Text style={styles.reportRowValue}>${item.total_revenue.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function OperationsOverview() {
  const dateRange = useReportDateRange();
  const summaryQuery = trpc.reports.summary.useQuery(dateRange);
  const tablesQuery = trpc.tables.getAll.useQuery();

  if (summaryQuery.isLoading || tablesQuery.isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5C0000" />
        <Text style={styles.loadingText}>Loading operations data...</Text>
      </View>
    );
  }

  const activeTables = (tablesQuery.data ?? []).filter((table) => table.status !== 'available');
  const salesSummary = summaryQuery.data?.summary;

  return (
    <ScrollView style={styles.content}>
      {salesSummary && (
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>${salesSummary.totalRevenue.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={styles.summaryValue}>{salesSummary.totalOrders}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Avg Order Value</Text>
            <Text style={styles.summaryValue}>${salesSummary.averageOrderValue.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Paid Orders</Text>
            <Text style={styles.summaryValue}>{salesSummary.paidOrders}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Tables</Text>
        {activeTables.length === 0 ? (
          <Text style={styles.emptyText}>No active tables</Text>
        ) : (
          activeTables.map((table) => (
            <View key={table.number} style={styles.reportRow}>
              <View style={styles.reportRowLeft}>
                <View style={styles.reportRowContent}>
                  <Text style={styles.reportRowTitle}>Table {table.number}</Text>
                  <Text style={styles.reportRowSubtitle}>
                    {table.status} • Capacity: {table.capacity}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EEDD',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#5C0000',
    borderBottomWidth: 3,
    borderBottomColor: '#5C0000',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#5C0000',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  summaryCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500' as const,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  reportRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  reportRowContent: {
    flex: 1,
  },
  reportRowTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  reportRowSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  reportRowValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  rankBadge: {
    backgroundColor: '#5C0000',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
