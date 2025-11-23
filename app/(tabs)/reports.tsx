import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { Text } from '@/components/CustomText';
import { Stack } from 'expo-router';
import { FileText, DollarSign, Package, Table as TableIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';

type ReportTab = 'sales' | 'items' | 'operations';

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
  const { data: dailySales, isLoading: loadingDaily } = trpc.reports.salesDaily.useQuery();
  const { data: weeklySales, isLoading: loadingWeekly } = trpc.reports.salesWeekly.useQuery();
  const { data: monthlySales, isLoading: loadingMonthly } = trpc.reports.salesMonthly.useQuery();

  if (loadingDaily || loadingWeekly || loadingMonthly) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5C0000" />
        <Text style={styles.loadingText}>Loading sales data...</Text>
      </View>
    );
  }

  const totalDailySales = dailySales?.reduce((sum, day) => sum + day.total_sales, 0) || 0;
  const totalDailyOrders = dailySales?.reduce((sum, day) => sum + day.order_count, 0) || 0;

  return (
    <ScrollView style={styles.content}>
      <View style={styles.summaryCards}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Revenue (7d)</Text>
          <Text style={styles.summaryValue}>${totalDailySales.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Orders (7d)</Text>
          <Text style={styles.summaryValue}>{totalDailyOrders}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Daily Sales</Text>
        {!dailySales || dailySales.length === 0 ? (
          <Text style={styles.emptyText}>No daily sales data</Text>
        ) : (
          dailySales.map((day, idx) => (
            <View key={idx} style={styles.reportRow}>
              <View style={styles.reportRowLeft}>
                <Text style={styles.reportRowTitle}>
                  {new Date(day.sale_date).toLocaleDateString()}
                </Text>
                <Text style={styles.reportRowSubtitle}>
                  {day.order_count} orders
                </Text>
              </View>
              <Text style={styles.reportRowValue}>${day.total_sales.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Weekly Sales</Text>
        {!weeklySales || weeklySales.length === 0 ? (
          <Text style={styles.emptyText}>No weekly sales data</Text>
        ) : (
          weeklySales.map((week, idx) => (
            <View key={idx} style={styles.reportRow}>
              <View style={styles.reportRowLeft}>
                <Text style={styles.reportRowTitle}>Week {idx + 1}</Text>
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
        {!monthlySales || monthlySales.length === 0 ? (
          <Text style={styles.emptyText}>No monthly sales data</Text>
        ) : (
          monthlySales.map((month, idx) => (
            <View key={idx} style={styles.reportRow}>
              <View style={styles.reportRowLeft}>
                <Text style={styles.reportRowTitle}>{month.month} {month.year}</Text>
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
  const { data: itemSales, isLoading } = trpc.reports.itemSalesSummary.useQuery();

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5C0000" />
        <Text style={styles.loadingText}>Loading item data...</Text>
      </View>
    );
  }

  const sortedItems = itemSales?.sort((a, b) => b.total_revenue - a.total_revenue) || [];
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
  const { data: activeTables, isLoading: loadingTables } = trpc.reports.activeTables.useQuery();
  const { data: salesSummary, isLoading: loadingSummary } = trpc.reports.salesSummary.useQuery();

  if (loadingTables || loadingSummary) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#5C0000" />
        <Text style={styles.loadingText}>Loading operations data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.content}>
      {salesSummary && (
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Revenue</Text>
            <Text style={styles.summaryValue}>${salesSummary.total_revenue.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Orders</Text>
            <Text style={styles.summaryValue}>{salesSummary.total_orders}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Avg Order Value</Text>
            <Text style={styles.summaryValue}>${salesSummary.avg_order_value.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Paid Orders</Text>
            <Text style={styles.summaryValue}>{salesSummary.paid_orders}</Text>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Tables</Text>
        {!activeTables || activeTables.length === 0 ? (
          <Text style={styles.emptyText}>No active tables</Text>
        ) : (
          activeTables.map((table) => (
            <View key={table.table_number} style={styles.reportRow}>
              <View style={styles.reportRowLeft}>
                <View style={styles.reportRowContent}>
                  <Text style={styles.reportRowTitle}>Table {table.table_number}</Text>
                  <Text style={styles.reportRowSubtitle}>
                    {table.status} • Capacity: {table.capacity}
                    {table.waiter_name && ` • Waiter: ${table.waiter_name}`}
                  </Text>
                </View>
              </View>
              {table.order_total && (
                <Text style={styles.reportRowValue}>${table.order_total.toFixed(2)}</Text>
              )}
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
