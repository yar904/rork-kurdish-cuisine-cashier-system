import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { TrendingUp, DollarSign, ShoppingBag, Award } from 'lucide-react-native';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLanguage } from '@/contexts/LanguageContext';

import { formatPrice } from '@/constants/currency';
import { MenuCategory } from '@/types/restaurant';
import PredictiveAnalytics from '@/components/PredictiveAnalytics';



export default function AnalyticsScreen() {
  const { orders } = useRestaurant();
  const { t, tc } = useLanguage();
  const { width } = useWindowDimensions();
  
  const isPhone = width < 768;
  const isTablet = width >= 768 && width < 1200;
  const isDesktop = width >= 1200;

  const analytics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const itemSales: Record<string, { name: string, nameKurdish: string, quantity: number, revenue: number }> = {};
    const categoryRevenue: Record<MenuCategory, number> = {} as Record<MenuCategory, number>;
    const statusCounts: Record<string, number> = {
      new: 0,
      preparing: 0,
      ready: 0,
      served: 0,
      paid: 0,
    };

    orders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;

      order.items.forEach(item => {
        const itemId = item.menuItem.id;
        if (!itemSales[itemId]) {
          itemSales[itemId] = {
            name: item.menuItem.name,
            nameKurdish: item.menuItem.nameKurdish,
            quantity: 0,
            revenue: 0,
          };
        }
        itemSales[itemId].quantity += item.quantity;
        itemSales[itemId].revenue += item.menuItem.price * item.quantity;

        const category = item.menuItem.category;
        categoryRevenue[category] = (categoryRevenue[category] || 0) + (item.menuItem.price * item.quantity);
      });
    });

    const topItems = Object.entries(itemSales)
      .sort((a, b) => b[1].quantity - a[1].quantity)
      .slice(0, 10);

    const categoryData = Object.entries(categoryRevenue)
      .sort((a, b) => b[1] - a[1])
      .map(([category, revenue]) => ({
        category: category as MenuCategory,
        revenue,
        percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
      }));

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      topItems,
      categoryData,
      statusCounts,
    };
  }, [orders]);

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
    <View style={[styles.statCard, !isPhone && styles.statCardTablet]}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <Icon size={!isPhone ? 28 : 24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statLabel, !isPhone && styles.statLabelLarge]}>{label}</Text>
        <Text style={[styles.statValue, !isPhone && styles.statValueLarge]}>{value}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: `${t('restaurantName')} - ${t('analytics')}`,
        headerStyle: { backgroundColor: '#2563EB' },
        headerTintColor: '#fff',
      }} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          <StatCard
            icon={DollarSign}
            label={t('totalRevenue')}
            value={formatPrice(analytics.totalRevenue)}
            color="#10B981"
          />
          <StatCard
            icon={ShoppingBag}
            label={t('totalOrders')}
            value={analytics.totalOrders.toString()}
            color="#3B82F6"
          />
          <StatCard
            icon={TrendingUp}
            label={t('avgOrderValue')}
            value={formatPrice(analytics.avgOrderValue)}
            color="#F59E0B"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={24} color="#2563EB" />
            <Text style={styles.sectionTitle}>{t('topSellingItems')}</Text>
          </View>
          <View style={styles.card}>
            {analytics.topItems.length === 0 ? (
              <Text style={styles.emptyText}>{t('noOrders')}</Text>
            ) : (
              analytics.topItems.map(([itemId, data], index) => (
                <View key={itemId} style={styles.topItemRow}>
                  <View style={styles.topItemRank}>
                    <Text style={styles.topItemRankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.topItemInfo}>
                    <Text style={styles.topItemName}>{data.name}</Text>
                    <Text style={styles.topItemNameKurdish}>{data.nameKurdish}</Text>
                  </View>
                  <View style={styles.topItemStats}>
                    <Text style={styles.topItemQuantity}>{data.quantity}x</Text>
                    <Text style={styles.topItemRevenue}>{formatPrice(data.revenue)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('revenueByCategory')}</Text>
          <View style={styles.card}>
            {analytics.categoryData.length === 0 ? (
              <Text style={styles.emptyText}>{t('noOrders')}</Text>
            ) : (
              analytics.categoryData.map(({ category, revenue, percentage }) => (
                <View key={category} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryName}>{tc(category)}</Text>
                    <View style={styles.progressBarContainer}>
                      <View 
                        style={[
                          styles.progressBar, 
                          { width: `${percentage}%`, backgroundColor: '#2563EB' }
                        ]} 
                      />
                    </View>
                  </View>
                  <View style={styles.categoryStats}>
                    <Text style={styles.categoryRevenue}>{formatPrice(revenue)}</Text>
                    <Text style={styles.categoryPercentage}>{percentage.toFixed(1)}%</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <PredictiveAnalytics />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ordersByStatus')}</Text>
          <View style={styles.card}>
            <View style={styles.statusGrid}>
              {Object.entries(analytics.statusCounts).map(([status, count]) => (
                <View key={status} style={styles.statusCard}>
                  <View 
                    style={[
                      styles.statusDot, 
                      { backgroundColor: '#3B82F6' }
                    ]} 
                  />
                  <Text style={styles.statusLabel}>
                    {t(status as keyof typeof t)}
                  </Text>
                  <Text style={styles.statusCount}>{count}</Text>
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
    backgroundColor: '#F5F5F7',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'column' as const,
    padding: 16,
    gap: 16,
    ...Platform.select({
      web: {
        flexDirection: 'row' as const,
        flexWrap: 'wrap' as const,
        maxWidth: 1600,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 16,
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
  statCardTablet: {
    minWidth: 220,
    maxWidth: 450,
  },
  statLabelLarge: {
    fontSize: 14,
  },
  statValueLarge: {
    fontSize: 26,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '600' as const,
    flexShrink: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: '#1C1C1E',
    flexShrink: 1,
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
    marginBottom: 16,
    flexShrink: 1,
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
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center' as const,
    paddingVertical: 20,
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
    color: '#FFFFFF',
  },
  topItemInfo: {
    flex: 1,
    minWidth: 0,
  },
  topItemName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1C1C1E',
    marginBottom: 2,
    flexShrink: 1,
  },
  topItemNameKurdish: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600' as const,
    flexShrink: 1,
  },
  topItemStats: {
    alignItems: 'flex-end',
  },
  topItemQuantity: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#2563EB',
    marginBottom: 2,
  },
  topItemRevenue: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600' as const,
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
    minWidth: 0,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1C1C1E',
    marginBottom: 8,
    flexShrink: 1,
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
  statusGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  statusCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  statusCount: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1C1C1E',
  },
});
