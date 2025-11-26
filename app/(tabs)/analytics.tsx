import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { Text } from '@/components/CustomText';
import { Stack } from 'expo-router';
import { TrendingUp, Award, Clock, DollarSign } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';

export default function AnalyticsDashboard() {
  const insets = useSafeAreaInsets();
  
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  }, []);

  const summaryQuery = trpc.reports.summary.useQuery(dateRange);
  const menuQuery = trpc.menu.getAll.useQuery();

  const dailySales = summaryQuery.data?.dailySales ?? [];
  const todaySales = dailySales[dailySales.length - 1];
  const todayRevenue = todaySales?.revenue ?? 0;
  const todayOrders = todaySales?.orders ?? 0;
  const todayAvgOrderValue = todayOrders > 0 ? todayRevenue / todayOrders : 0;

  const topItems = useMemo(() => {
    const menuMap = new Map((menuQuery.data ?? []).map((item) => [item.id, item]));
    return (summaryQuery.data?.topItems ?? [])
      .map((item) => ({
        item_id: item.id,
        item_name: item.name,
        total_quantity: item.quantity,
        total_revenue: item.revenue,
        category: menuMap.get(item.id)?.category ?? 'Uncategorized',
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue)
      .slice(0, 5);
  }, [menuQuery.data, summaryQuery.data?.topItems]);

  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    (summaryQuery.data?.categoryBreakdown ?? []).forEach((entry) => {
      totals[entry.category] = (totals[entry.category] || 0) + entry.revenue;
    });
    return totals;
  }, [summaryQuery.data?.categoryBreakdown]);

  const isLoading = summaryQuery.isLoading;

  const categories = Object.entries(categoryTotals)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5);

  const salesSummary = summaryQuery.data?.summary;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Analytics',
          headerStyle: { backgroundColor: '#5C0000' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5C0000" />
          <Text style={styles.loadingText}>Loading analytics...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TrendingUp size={32} color="#5C0000" />
            <Text style={styles.headerTitle}>Business Analytics</Text>
            <Text style={styles.headerSubtitle}>Key metrics and trends</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Today's Performance</Text>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: '#5C000015' }]}>
                  <DollarSign size={24} color="#5C0000" />
                </View>
                <Text style={styles.kpiLabel}>Total Revenue</Text>
                <Text style={styles.kpiValue}>${todayRevenue.toFixed(2)}</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: '#10B98115' }]}>
                  <Clock size={24} color="#10B981" />
                </View>
                <Text style={styles.kpiLabel}>Total Orders</Text>
                <Text style={styles.kpiValue}>{todayOrders}</Text>
              </View>

              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: '#C6A66715' }]}>
                  <Award size={24} color="#C6A667" />
                </View>
                <Text style={styles.kpiLabel}>Avg Order Value</Text>
                <Text style={styles.kpiValue}>${todayAvgOrderValue.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overall Statistics</Text>
            {salesSummary && (
              <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>
                    ${salesSummary.totalRevenue.toFixed(2)}
                  </Text>
                  <Text style={styles.statLabel}>Total Revenue</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{salesSummary.totalOrders}</Text>
                  <Text style={styles.statLabel}>Total Orders</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{salesSummary.paidOrders}</Text>
                  <Text style={styles.statLabel}>Paid Orders</Text>
                </View>
                <View style={styles.statCard}>
                  <Text style={styles.statValue}>{Math.max(salesSummary.totalOrders - salesSummary.paidOrders, 0)}</Text>
                  <Text style={styles.statLabel}>Pending Orders</Text>
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 5 Selling Items</Text>
            {topItems.length === 0 ? (
              <Text style={styles.emptyText}>No item data available</Text>
            ) : (
              <View style={styles.chartContainer}>
                {topItems.map((item: any, idx: number) => {
                  const maxRevenue = topItems[0].total_revenue;
                  const percentage = (item.total_revenue / maxRevenue) * 100;
                  
                  return (
                    <View key={item.item_id} style={styles.barItem}>
                      <View style={styles.barInfo}>
                        <Text style={styles.barRank}>#{idx + 1}</Text>
                        <View style={styles.barDetails}>
                          <Text style={styles.barLabel}>{item.item_name}</Text>
                          <Text style={styles.barSubLabel}>
                            {item.total_quantity} sold • ${item.total_revenue.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.barTrack}>
                        <View 
                          style={[
                            styles.barFill,
                            { width: `${percentage}%` }
                          ]} 
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top 5 Categories</Text>
            {categories.length === 0 ? (
              <Text style={styles.emptyText}>No category data available</Text>
            ) : (
              <View style={styles.chartContainer}>
                {categories.map(([category, revenue]: any, idx: number) => {
                  const maxRevenue = categories[0][1];
                  const percentage = (revenue / maxRevenue) * 100;
                  
                  return (
                    <View key={category} style={styles.barItem}>
                      <View style={styles.barInfo}>
                        <Text style={styles.barRank}>#{idx + 1}</Text>
                        <View style={styles.barDetails}>
                          <Text style={styles.barLabel}>{category}</Text>
                          <Text style={styles.barSubLabel}>
                            ${revenue.toFixed(2)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.barTrack}>
                        <View 
                          style={[
                            styles.barFill,
                            { width: `${percentage}%`, backgroundColor: '#C6A667' }
                          ]} 
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sales Trend (Last 7 Days)</Text>
            {!dailySales || dailySales.length === 0 ? (
              <Text style={styles.emptyText}>No sales data available</Text>
            ) : (
              <View style={styles.trendContainer}>
                {dailySales.map((day: any, idx: number) => {
                  const maxSales = Math.max(...dailySales.map((d: any) => d.revenue));
                  const height = maxSales > 0 ? (day.revenue / maxSales) * 100 : 0;
                  
                  return (
                    <View key={idx} style={styles.trendBar}>
                      <View style={styles.trendBarContainer}>
                        <View 
                          style={[
                            styles.trendBarFill,
                            { height: `${height}%` }
                          ]} 
                        />
                      </View>
                      <Text style={styles.trendLabel}>
                        {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text style={styles.trendValue}>${day.revenue.toFixed(0)}</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}
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
  },
  contentContainer: {
    padding: 20,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
      },
    }),
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
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
  kpiIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    textAlign: 'center',
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 120,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#5C0000',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    paddingVertical: 20,
  },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  barItem: {
    marginBottom: 20,
  },
  barInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  barRank: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#5C0000',
    minWidth: 32,
  },
  barDetails: {
    flex: 1,
  },
  barLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  barSubLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  barTrack: {
    height: 12,
    backgroundColor: '#F6EEDD',
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#5C0000',
    borderRadius: 6,
  },
  trendContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 200,
  },
  trendBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  trendBarContainer: {
    flex: 1,
    width: 32,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  trendBarFill: {
    width: '100%',
    backgroundColor: '#5C0000',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4,
  },
  trendLabel: {
    fontSize: 12,
    color: '#3A3A3A',
    fontWeight: '600' as const,
    marginTop: 8,
  },
  trendValue: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
  },
});
