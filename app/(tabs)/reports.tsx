import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Share, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { Calendar, TrendingUp, TrendingDown, Download, FileText, BarChart3, DollarSign, ShoppingBag, Clock, Printer } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { formatPrice } from '@/constants/currency';
import { useLanguage } from '@/contexts/LanguageContext';
import { printDailyReport } from '@/lib/printer';

type ReportPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'year' | 'custom';

export default function ReportsScreen() {
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>('today');
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());

  const getDateRange = (period: ReportPeriod) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (period) {
      case 'today':
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
          label: 'Today',
        };
      case 'yesterday':
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday,
          end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
          label: 'Yesterday',
        };
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return {
          start: weekStart,
          end: now,
          label: 'This Week',
        };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return {
          start: monthStart,
          end: now,
          label: 'This Month',
        };
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return {
          start: yearStart,
          end: now,
          label: 'This Year',
        };
      case 'custom':
        return {
          start: customStartDate,
          end: customEndDate,
          label: 'Custom Range',
        };
      default:
        return {
          start: today,
          end: now,
          label: 'Today',
        };
    }
  };

  const mockReportData = useMemo(() => {
    const range = getDateRange(selectedPeriod);
    
    return {
      summary: {
        totalRevenue: 1250000,
        totalOrders: 45,
        averageOrderValue: 27777,
        paidRevenue: 1100000,
        paidOrders: 40,
      },
      comparison: {
        revenue: 15.5,
        orders: 12.3,
        averageOrderValue: 8.2,
      },
      topItems: [
        { id: '1', name: 'Kabab Teka', quantity: 25, revenue: 625000 },
        { id: '2', name: 'Palaw', quantity: 20, revenue: 320000 },
        { id: '3', name: 'Dolma', quantity: 18, revenue: 270000 },
        { id: '4', name: 'Biryani', quantity: 15, revenue: 225000 },
        { id: '5', name: 'Shorba', quantity: 12, revenue: 108000 },
      ],
      categoryBreakdown: [
        { category: 'Kebabs', revenue: 550000, percentage: 44 },
        { category: 'Rice Dishes', revenue: 320000, percentage: 25.6 },
        { category: 'Appetizers', revenue: 200000, percentage: 16 },
        { category: 'Drinks', revenue: 100000, percentage: 8 },
        { category: 'Desserts', revenue: 80000, percentage: 6.4 },
      ],
      peakHours: [
        { hour: 19, revenue: 450000, label: '7:00 PM' },
        { hour: 20, revenue: 380000, label: '8:00 PM' },
        { hour: 13, revenue: 280000, label: '1:00 PM' },
      ],
      dailySales: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en', { weekday: 'short' }),
        revenue: Math.floor(Math.random() * 200000) + 100000,
        orders: Math.floor(Math.random() * 20) + 10,
      })),
    };
  }, [selectedPeriod, customStartDate, customEndDate]);

  const handlePrintReport = async () => {
    const range = getDateRange(selectedPeriod);
    
    try {
      await printDailyReport({
        title: 'Tapse Restaurant Sales Report',
        period: range.label,
        dateRange: `${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()}`,
        summary: mockReportData.summary,
        items: mockReportData.topItems,
        categories: mockReportData.categoryBreakdown,
        peakHours: mockReportData.peakHours,
      });
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print report');
    }
  };

  const exportReport = async (format: 'pdf' | 'csv') => {
    let reportContent = '';
    const range = getDateRange(selectedPeriod);
    
    if (format === 'csv') {
      reportContent = `Tapse Restaurant - Sales Report\n`;
      reportContent += `Period: ${range.label}\n`;
      reportContent += `${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()}\n\n`;
      
      reportContent += `Summary\n`;
      reportContent += `Total Revenue,${formatPrice(mockReportData.summary.totalRevenue)}\n`;
      reportContent += `Total Orders,${mockReportData.summary.totalOrders}\n`;
      reportContent += `Average Order Value,${formatPrice(mockReportData.summary.averageOrderValue)}\n\n`;
      
      reportContent += `Top Selling Items\n`;
      reportContent += `Item,Quantity,Revenue\n`;
      mockReportData.topItems.forEach(item => {
        reportContent += `${item.name},${item.quantity},${formatPrice(item.revenue)}\n`;
      });
      
      reportContent += `\nCategory Breakdown\n`;
      reportContent += `Category,Revenue,Percentage\n`;
      mockReportData.categoryBreakdown.forEach(cat => {
        reportContent += `${cat.category},${formatPrice(cat.revenue)},${cat.percentage}%\n`;
      });
    } else {
      reportContent = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      reportContent += `   TAPSE RESTAURANT\n`;
      reportContent += `   Sales Report\n`;
      reportContent += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
      reportContent += `Period: ${range.label}\n`;
      reportContent += `${range.start.toLocaleDateString()} - ${range.end.toLocaleDateString()}\n\n`;
      
      reportContent += `SUMMARY\n`;
      reportContent += `${'─'.repeat(40)}\n`;
      reportContent += `Total Revenue:     ${formatPrice(mockReportData.summary.totalRevenue)}\n`;
      reportContent += `Total Orders:      ${mockReportData.summary.totalOrders}\n`;
      reportContent += `Avg Order Value:   ${formatPrice(mockReportData.summary.averageOrderValue)}\n`;
      reportContent += `Paid Revenue:      ${formatPrice(mockReportData.summary.paidRevenue)}\n\n`;
      
      reportContent += `TOP SELLING ITEMS\n`;
      reportContent += `${'─'.repeat(40)}\n`;
      mockReportData.topItems.forEach((item, i) => {
        reportContent += `${i + 1}. ${item.name}\n`;
        reportContent += `   Qty: ${item.quantity}  Revenue: ${formatPrice(item.revenue)}\n`;
      });
      
      reportContent += `\nCATEGORY BREAKDOWN\n`;
      reportContent += `${'─'.repeat(40)}\n`;
      mockReportData.categoryBreakdown.forEach(cat => {
        reportContent += `${cat.category}\n`;
        reportContent += `  ${formatPrice(cat.revenue)} (${cat.percentage}%)\n`;
      });
      
      reportContent += `\nPEAK HOURS\n`;
      reportContent += `${'─'.repeat(40)}\n`;
      mockReportData.peakHours.forEach(peak => {
        reportContent += `${peak.label}: ${formatPrice(peak.revenue)}\n`;
      });
      
      reportContent += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      reportContent += `Generated: ${new Date().toLocaleString()}\n`;
    }

    try {
      await Share.share({
        message: reportContent,
        title: `Tapse Report - ${range.label}`,
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
        <Icon size={20} color={Colors.primary} />
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Text style={styles.statValue}>{value}</Text>
      {growth !== undefined && (
        <View style={styles.growthContainer}>
          {growth >= 0 ? (
            <TrendingUp size={14} color={Colors.success} />
          ) : (
            <TrendingDown size={14} color={Colors.error} />
          )}
          <Text
            style={[
              styles.growthText,
              { color: growth >= 0 ? Colors.success : Colors.error },
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
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={24} color={Colors.primary} />
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
            <BarChart3 size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Summary</Text>
            <View style={styles.exportButtons}>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={handlePrintReport}
                activeOpacity={0.7}
              >
                <Printer size={18} color={Colors.primary} />
                <Text style={styles.exportButtonText}>Print</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => exportReport('csv')}
                activeOpacity={0.7}
              >
                <Download size={18} color={Colors.primary} />
                <Text style={styles.exportButtonText}>CSV</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.exportButton}
                onPress={() => exportReport('pdf')}
                activeOpacity={0.7}
              >
                <FileText size={18} color={Colors.primary} />
                <Text style={styles.exportButtonText}>PDF</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <StatCard
              icon={DollarSign}
              label="Total Revenue"
              value={formatPrice(mockReportData.summary.totalRevenue)}
              growth={mockReportData.comparison.revenue}
            />
            <StatCard
              icon={ShoppingBag}
              label="Total Orders"
              value={mockReportData.summary.totalOrders.toString()}
              growth={mockReportData.comparison.orders}
            />
            <StatCard
              icon={TrendingUp}
              label="Avg Order Value"
              value={formatPrice(mockReportData.summary.averageOrderValue)}
              growth={mockReportData.comparison.averageOrderValue}
            />
            <StatCard
              icon={DollarSign}
              label="Paid Revenue"
              value={formatPrice(mockReportData.summary.paidRevenue)}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Top Selling Items</Text>
          <View style={styles.card}>
            {mockReportData.topItems.map((item, index) => (
              <View key={item.id} style={styles.topItemRow}>
                <View style={styles.topItemRank}>
                  <Text style={styles.topItemRankText}>{index + 1}</Text>
                </View>
                <View style={styles.topItemInfo}>
                  <Text style={styles.topItemName}>{item.name}</Text>
                  <Text style={styles.topItemQuantity}>{item.quantity} sold</Text>
                </View>
                <Text style={styles.topItemRevenue}>{formatPrice(item.revenue)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Performance</Text>
          <View style={styles.card}>
            {mockReportData.categoryBreakdown.map((cat) => (
              <View key={cat.category} style={styles.categoryRow}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{cat.category}</Text>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${cat.percentage}%`, backgroundColor: Colors.primary },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.categoryStats}>
                  <Text style={styles.categoryRevenue}>{formatPrice(cat.revenue)}</Text>
                  <Text style={styles.categoryPercentage}>{cat.percentage}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Peak Hours</Text>
          </View>
          <View style={styles.card}>
            {mockReportData.peakHours.map((peak) => (
              <View key={peak.hour} style={styles.peakHourRow}>
                <View style={styles.peakHourBadge}>
                  <Clock size={16} color="#fff" />
                </View>
                <Text style={styles.peakHourLabel}>{peak.label}</Text>
                <Text style={styles.peakHourRevenue}>{formatPrice(peak.revenue)}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Sales Trend</Text>
          <View style={styles.card}>
            <View style={styles.chartContainer}>
              {mockReportData.dailySales.map((day, index) => (
                <View key={index} style={styles.chartBar}>
                  <View
                    style={[
                      styles.chartBarFill,
                      {
                        height: `${(day.revenue / 200000) * 100}%`,
                        backgroundColor: Colors.primary,
                      },
                    ]}
                  />
                  <Text style={styles.chartBarLabel}>{day.date}</Text>
                  <Text style={styles.chartBarValue}>{day.orders}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
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
    color: Colors.text,
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
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
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
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: Colors.background,
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
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
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
    backgroundColor: Colors.background,
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
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  topItemRank: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
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
    color: Colors.text,
    marginBottom: 2,
  },
  topItemQuantity: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  topItemRevenue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: Colors.backgroundGray,
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
    color: Colors.text,
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  peakHourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    gap: 12,
  },
  peakHourBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.info,
    justifyContent: 'center',
    alignItems: 'center',
  },
  peakHourLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  peakHourRevenue: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
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
    color: Colors.textSecondary,
    fontWeight: '600' as const,
    marginTop: 8,
  },
  chartBarValue: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '700' as const,
    marginTop: 2,
  },
});
