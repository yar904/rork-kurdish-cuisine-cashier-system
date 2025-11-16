import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Share, Alert, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { Calendar, TrendingUp, TrendingDown, Download, FileText, BarChart3, DollarSign, ShoppingBag, Printer, TrendingDown as LossIcon, Percent } from 'lucide-react-native';

import { formatPrice } from '@/constants/currency';
import { useLanguage } from '@/contexts/LanguageContext';
import { printDailyReport } from '@/lib/printer';
import { trpc } from '@/lib/trpc';

type ReportPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

export default function ReportsScreen() {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('today');
  const [customStartDate] = useState<Date>(new Date());
  const [customEndDate] = useState<Date>(new Date());



  const getDateRange = (period: ReportPeriod) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          start: today.toISOString(),
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
          label: 'Today',
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday.toISOString(),
          end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString(),
          label: 'Yesterday',
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          start: weekStart.toISOString(),
          end: now.toISOString(),
          label: 'This Week',
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          start: monthStart.toISOString(),
          end: now.toISOString(),
          label: 'This Month',
        };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return {
          start: yearStart.toISOString(),
          end: now.toISOString(),
          label: 'This Year',
        };
      case 'custom':
        return {
          start: customStartDate.toISOString(),
          end: customEndDate.toISOString(),
          label: 'Custom Range',
        };
      default:
        return {
          start: today.toISOString(),
          end: now.toISOString(),
          label: 'Today',
        };
    }
  };

  const dateRange = useMemo(() => {
    return getDateRange(selectedPeriod);
  }, [selectedPeriod, customStartDate, customEndDate]);

  const financialQuery = trpc.reports.financial.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const employeeQuery = trpc.reports.employeePerformance.useQuery({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  const reportData = financialQuery.data;
  const employeeData = employeeQuery.data;
  const isLoading = financialQuery.isLoading || employeeQuery.isLoading;

  const handlePrintReport = async () => {
    if (!reportData) {
      Alert.alert('Error', 'No data to print');
      return;
    }

    try {
      await printDailyReport({
        title: 'Tapse Restaurant Financial Report',
        period: dateRange.label,
        dateRange: `${new Date(dateRange.start).toLocaleDateString()} - ${new Date(dateRange.end).toLocaleDateString()}`,
        summary: reportData.summary,
        items: reportData.topProfitableItems.map(i => ({ ...i, id: i.id, name: i.name, quantity: i.quantity, revenue: i.revenue })),
        categories: reportData.categoryBreakdown.map(c => ({ category: c.category, revenue: c.revenue, percentage: (c.revenue / reportData.summary.totalRevenue) * 100 })),
        peakHours: [],
      });
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print report');
    }
  };

  const exportReport = async (format: 'pdf' | 'csv') => {
    if (!reportData) {
      Alert.alert('Error', 'No data to export');
      return;
    }

    let reportContent = '';
    const startDate = new Date(dateRange.start).toLocaleDateString();
    const endDate = new Date(dateRange.end).toLocaleDateString();
    
    if (format === 'csv') {
      reportContent = `Tapse Restaurant - Financial Report\n`;
      reportContent += `Period: ${dateRange.label}\n`;
      reportContent += `${startDate} - ${endDate}\n\n`;
      
      reportContent += `Financial Summary\n`;
      reportContent += `Total Revenue,${formatPrice(reportData.summary.totalRevenue)}\n`;
      reportContent += `Total Cost,${formatPrice(reportData.summary.totalCost)}\n`;
      reportContent += `Gross Profit,${formatPrice(reportData.summary.totalProfit)}\n`;
      reportContent += `Labor Cost,${formatPrice(reportData.summary.laborCost)}\n`;
      reportContent += `Net Profit,${formatPrice(reportData.summary.netProfit)}\n`;
      reportContent += `Profit Margin,${reportData.summary.overallMargin.toFixed(2)}%\n`;
      reportContent += `Total Orders,${reportData.summary.totalOrders}\n`;
      reportContent += `Average Order,${formatPrice(reportData.summary.averageOrderValue)}\n\n`;
      
      reportContent += `Top Profitable Items\n`;
      reportContent += `Item,Quantity,Revenue,Cost,Profit,Margin\n`;
      reportData.topProfitableItems.forEach(item => {
        reportContent += `${item.name},${item.quantity},${formatPrice(item.revenue)},${formatPrice(item.cost)},${formatPrice(item.profit)},${item.margin.toFixed(1)}%\n`;
      });
      
      reportContent += `\nCategory Performance\n`;
      reportContent += `Category,Revenue,Cost,Profit,Margin\n`;
      reportData.categoryBreakdown.forEach(cat => {
        reportContent += `${cat.category},${formatPrice(cat.revenue)},${formatPrice(cat.cost)},${formatPrice(cat.profit)},${cat.margin.toFixed(1)}%\n`;
      });
    } else {
      reportContent = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      reportContent += `   TAPSE RESTAURANT\n`;
      reportContent += `   Financial Report\n`;
      reportContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      reportContent += `Period: ${dateRange.label}\n`;
      reportContent += `${startDate} - ${endDate}\n\n`;
      
      reportContent += `FINANCIAL SUMMARY\n`;
      reportContent += `${'─'.repeat(40)}\n`;
      reportContent += `Revenue:          ${formatPrice(reportData.summary.totalRevenue)}\n`;
      reportContent += `Cost:             ${formatPrice(reportData.summary.totalCost)}\n`;
      reportContent += `Gross Profit:     ${formatPrice(reportData.summary.totalProfit)}\n`;
      reportContent += `Labor Cost:       ${formatPrice(reportData.summary.laborCost)}\n`;
      reportContent += `Net Profit:       ${formatPrice(reportData.summary.netProfit)}\n`;
      reportContent += `Profit Margin:    ${reportData.summary.overallMargin.toFixed(2)}%\n\n`;
      
      reportContent += `TOP PROFITABLE ITEMS\n`;
      reportContent += `${'─'.repeat(40)}\n`;
      reportData.topProfitableItems.slice(0, 5).forEach((item, i) => {
        reportContent += `${i + 1}. ${item.name}\n`;
        reportContent += `   Profit: ${formatPrice(item.profit)} (${item.margin.toFixed(1)}%)\n`;
      });
      
      reportContent += `\nCATEGORY PERFORMANCE\n`;
      reportContent += `${'─'.repeat(40)}\n`;
      reportData.categoryBreakdown.forEach(cat => {
        reportContent += `${cat.category}\n`;
        reportContent += `  Profit: ${formatPrice(cat.profit)} (${cat.margin.toFixed(1)}%)\n`;
      });
      
      reportContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      reportContent += `Generated: ${new Date().toLocaleString()}\n`;
    }

    try {
      await Share.share({
        message: reportContent,
        title: `Tapse Financial Report - ${dateRange.label}`,
      });
    } catch (error) {
      console.log('Share error:', error);
      Alert.alert('Error', 'Failed to export report');
    }
  };

  const PeriodButton = ({ period, label }: { period: ReportPeriod; label: string }) => (
    <TouchableOpacity
      style={[
        styles.periodButton,
        selectedPeriod === period && styles.periodButtonActive,
      ]}
      onPress={() => setSelectedPeriod(period)}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.periodButtonText,
          selectedPeriod === period && styles.periodButtonTextActive,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const StatCard = ({ icon: Icon, label, value, growth }: { icon: any; label: string; value: string; growth?: number }) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Icon size={20} color="#2563EB" />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {growth !== undefined && (
        <View style={styles.growthContainer}>
          {growth >= 0 ? (
            <TrendingUp size={14} color="#10B981" />
          ) : (
            <TrendingDown size={14} color="#EF4444" />
          )}
          <Text
            style={[
              styles.growthText,
              { color: growth >= 0 ? '#10B981' : '#EF4444' },
            ]}
          >
            {Math.abs(growth).toFixed(1)}%
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `${t('restaurantName')} - Reports`,
          headerStyle: { backgroundColor: '#2563EB' },
          headerTintColor: '#fff',
        }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Generating financial report...</Text>
        </View>
      ) : !reportData ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available for selected period</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={24} color="#2563EB" />
            <Text style={styles.sectionTitle}>Select Period</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
            <View style={styles.periodButtons}>
              <PeriodButton period="today" label="Today" />
              <PeriodButton period="yesterday" label="Yesterday" />
              <PeriodButton period="week" label="This Week" />
              <PeriodButton period="month" label="This Month" />
              <PeriodButton period="year" label="This Year" />
              <PeriodButton period="custom" label="Custom" />
            </View>
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart3 size={24} color="#2563EB" />
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.exportButtons}>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={handlePrintReport}
                activeOpacity={0.7}
              >
                <Printer size={18} color="#2563EB" />
                <Text style={styles.exportButtonText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => exportReport('csv')}
                activeOpacity={0.7}
              >
                <Download size={18} color="#2563EB" />
                <Text style={styles.exportButtonText}>CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => exportReport('pdf')}
                activeOpacity={0.7}
              >
                <FileText size={18} color="#2563EB" />
                <Text style={styles.exportButtonText}>PDF</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              icon={DollarSign}
              label="Total Revenue"
              value={formatPrice(reportData.summary.totalRevenue)}
            />
            <StatCard
              icon={LossIcon}
              label="Total Cost"
              value={formatPrice(reportData.summary.totalCost)}
            />
            <StatCard
              icon={TrendingUp}
              label="Gross Profit"
              value={formatPrice(reportData.summary.totalProfit)}
            />
            <StatCard
              icon={Percent}
              label="Profit Margin"
              value={`${reportData.summary.overallMargin.toFixed(1)}%`}
            />
            <StatCard
              icon={ShoppingBag}
              label="Total Orders"
              value={reportData.summary.totalOrders.toString()}
            />
            <StatCard
              icon={DollarSign}
              label="Net Profit"
              value={formatPrice(reportData.summary.netProfit)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Profitable Items</Text>
          <View style={styles.card}>
            {reportData.topProfitableItems.map((item, index) => (
              <View key={item.id} style={styles.topItemRow}>
                <View style={styles.topItemRank}>
                  <Text style={styles.topItemRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topItemInfo}>
                  <Text style={styles.topItemName}>{item.name}</Text>
                  <Text style={styles.topItemQuantity}>
                    {item.quantity} sold • {item.margin.toFixed(1)}% margin
                  </Text>
                </View>
                <View style={styles.topItemStats}>
                  <Text style={styles.topItemRevenue}>{formatPrice(item.profit)}</Text>
                  <Text style={styles.topItemProfit}>profit</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Performance</Text>
          <View style={styles.card}>
            {reportData.categoryBreakdown.map((cat) => (
              <View key={cat.category} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.category}</Text>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { 
                          width: `${cat.margin}%`, 
                          backgroundColor: cat.margin > 50 ? '#10B981' : cat.margin > 30 ? '#F59E0B' : '#EF4444' 
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryRevenue}>{formatPrice(cat.profit)}</Text>
                  <Text style={styles.categoryPercentage}>{cat.margin.toFixed(1)}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {employeeData && employeeData.waiterPerformance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Performing Waiters</Text>
            <View style={styles.card}>
              {employeeData.waiterPerformance.slice(0, 5).map((waiter, index) => (
                <View key={waiter.name} style={styles.topItemRow}>
                  <View style={styles.topItemRank}>
                    <Text style={styles.topItemRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.topItemInfo}>
                    <Text style={styles.topItemName}>{waiter.name}</Text>
                    <Text style={styles.topItemQuantity}>
                      {waiter.totalOrders} orders • Avg: {formatPrice(waiter.averageOrderValue)}
                    </Text>
                  </View>
                  <Text style={styles.topItemRevenue}>{formatPrice(waiter.totalRevenue)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Profit Trend</Text>
          <View style={styles.card}>
            <View style={styles.chartContainer}>
              {reportData.dailyFinancials.map((day, index) => {
                const maxProfit = Math.max(...reportData.dailyFinancials.map(d => d.profit));
                return (
                  <View key={index} style={styles.chartBar}>
                    <View
                      style={[
                        styles.chartBarFill,
                        {
                          height: maxProfit > 0 ? `${(day.profit / maxProfit) * 100}%` : '10%',
                          backgroundColor: day.profit > 0 ? '#10B981' : '#EF4444',
                        },
                      ]}
                    />
                    <Text style={styles.chartBarLabel}>
                      {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                    </Text>
                    <Text style={styles.chartBarValue}>{formatPrice(day.profit)}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
    ...Platform.select({
      web: {
        maxWidth: 1600,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1C1C1E',
    flex: 1,
  },
  periodScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  periodButtonActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1C1C1E',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  exportButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#1C1C1E',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600' as const,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  growthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  growthText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  topItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topItemRankText: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: '#fff',
  },
  topItemInfo: {
    flex: 1,
  },
  topItemName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1C1C1E',
    marginBottom: 2,
  },
  topItemQuantity: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600' as const,
  },
  topItemRevenue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#1C1C1E',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1C1C1E',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#F5F5F7',
    borderRadius: 4,
    overflow: 'hidden' as const,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryStats: {
    alignItems: 'flex-end',
  },
  categoryRevenue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#1C1C1E',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600' as const,
  },
  peakHourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  peakHourBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  peakHourLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1C1C1E',
  },
  peakHourRevenue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: '#1C1C1E',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 200,
    paddingTop: 20,
  },
  chartBar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  chartBarFill: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 20,
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#8E8E93',
    fontWeight: '600' as const,
    marginTop: 8,
  },
  chartBarValue: {
    fontSize: 11,
    color: '#1C1C1E',
    fontWeight: '700' as const,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    fontWeight: '600' as const,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600' as const,
  },
  topItemStats: {
    alignItems: 'flex-end',
  },
  topItemProfit: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600' as const,
    marginTop: 2,
  },
});
