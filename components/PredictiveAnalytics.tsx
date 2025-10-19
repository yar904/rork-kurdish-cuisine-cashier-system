import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { TrendingUp, Clock, AlertCircle, Sparkles } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { formatPrice } from '@/constants/currency';

export default function PredictiveAnalytics() {
  const { orders } = useRestaurant();

  const predictions = useMemo(() => {
    const now = new Date();
    const currentHour = now.getHours();

    const ordersByHour: Record<number, number> = {};
    const revenueByHour: Record<number, number> = {};
    
    orders.forEach(order => {
      const orderHour = new Date(order.createdAt).getHours();
      ordersByHour[orderHour] = (ordersByHour[orderHour] || 0) + 1;
      revenueByHour[orderHour] = (revenueByHour[orderHour] || 0) + order.total;
    });

    const avgOrdersPerHour = Object.values(ordersByHour).reduce((a, b) => a + b, 0) / Object.keys(ordersByHour).length || 0;
    const avgRevenuePerHour = Object.values(revenueByHour).reduce((a, b) => a + b, 0) / Object.keys(revenueByHour).length || 0;

    const peakHours = Object.entries(ordersByHour)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    const isPeakTime = peakHours.includes(currentHour);
    const nextPeakHour = peakHours.find(h => h > currentHour) || peakHours[0];

    const predictedOrders = Math.round(avgOrdersPerHour * 1.2);
    const predictedRevenue = avgRevenuePerHour * 1.2;

    return {
      avgOrdersPerHour: Math.round(avgOrdersPerHour),
      avgRevenuePerHour,
      peakHours,
      isPeakTime,
      nextPeakHour,
      predictedOrders,
      predictedRevenue,
      currentHour,
    };
  }, [orders]);

  const getHourDisplay = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    if (hour < 12) return `${hour} AM`;
    return `${hour - 12} PM`;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Sparkles size={24} color={Colors.primary} />
        <Text style={styles.headerTitle}>AI Predictions & Insights</Text>
      </View>

      {predictions.isPeakTime && (
        <View style={styles.alertCard}>
          <AlertCircle size={20} color={Colors.warning} />
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>Peak Hour Active!</Text>
            <Text style={styles.alertText}>
              Expect high order volume. Ensure adequate staffing.
            </Text>
          </View>
        </View>
      )}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <TrendingUp size={20} color={Colors.info} />
          <Text style={styles.cardTitle}>Current Predictions</Text>
        </View>
        <View style={styles.predictionRow}>
          <Text style={styles.predictionLabel}>Expected orders next hour:</Text>
          <Text style={styles.predictionValue}>{predictions.predictedOrders}</Text>
        </View>
        <View style={styles.predictionRow}>
          <Text style={styles.predictionLabel}>Expected revenue:</Text>
          <Text style={styles.predictionValue}>{formatPrice(predictions.predictedRevenue)}</Text>
        </View>
        <View style={styles.predictionRow}>
          <Text style={styles.predictionLabel}>Average orders/hour:</Text>
          <Text style={styles.predictionValue}>{predictions.avgOrdersPerHour}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Clock size={20} color={Colors.success} />
          <Text style={styles.cardTitle}>Peak Hours</Text>
        </View>
        <Text style={styles.peakHoursText}>
          Busiest times: {predictions.peakHours.map(h => getHourDisplay(h)).join(', ')}
        </Text>
        {!predictions.isPeakTime && (
          <Text style={styles.nextPeakText}>
            Next peak hour: {getHourDisplay(predictions.nextPeakHour)}
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>AI Recommendations</Text>
        <View style={styles.recommendationsList}>
          <View style={styles.recommendationItem}>
            <View style={styles.recommendationDot} />
            <Text style={styles.recommendationText}>
              {predictions.isPeakTime 
                ? 'Staff all kitchen stations during peak hours'
                : 'Schedule additional staff for upcoming peak hours'}
            </Text>
          </View>
          <View style={styles.recommendationItem}>
            <View style={styles.recommendationDot} />
            <Text style={styles.recommendationText}>
              Monitor inventory for high-demand items
            </Text>
          </View>
          <View style={styles.recommendationItem}>
            <View style={styles.recommendationDot} />
            <Text style={styles.recommendationText}>
              Prepare ingredients for popular dishes in advance
            </Text>
          </View>
          <View style={styles.recommendationItem}>
            <View style={styles.recommendationDot} />
            <Text style={styles.recommendationText}>
              Consider promotions during slower hours to balance demand
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.warning + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.warning + '40',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  predictionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  predictionLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  predictionValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  peakHoursText: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  nextPeakText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  recommendationsList: {
    gap: 12,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  recommendationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
});
