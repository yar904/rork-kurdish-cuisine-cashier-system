import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { TrendingUp, Clock, Calendar, DollarSign } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function EmployeeMetricsScreen() {
  const { employeeId, name } = useLocalSearchParams<{ employeeId: string; name: string }>();
  const insets = useSafeAreaInsets();

  const metricsQuery = trpc.employees.getMetrics.useQuery(
    { employeeId },
    { enabled: !!employeeId }
  );

  if (metricsQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const metrics = metricsQuery.data;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: `Metrics - ${name}`,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Performance Metrics</Text>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#dbeafe' }]}>
              <Clock size={24} color={Colors.primary} />
            </View>
            <Text style={styles.metricValue}>{metrics?.totalHours || 0}</Text>
            <Text style={styles.metricLabel}>Total Hours</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#dcfce7' }]}>
              <Calendar size={24} color="#22c55e" />
            </View>
            <Text style={styles.metricValue}>{metrics?.totalDays || 0}</Text>
            <Text style={styles.metricLabel}>Days Worked</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
              <TrendingUp size={24} color="#f59e0b" />
            </View>
            <Text style={styles.metricValue}>{metrics?.averageHoursPerDay || 0}</Text>
            <Text style={styles.metricLabel}>Avg Hours/Day</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={[styles.iconCircle, { backgroundColor: '#d1fae5' }]}>
              <DollarSign size={24} color="#10b981" />
            </View>
            <Text style={styles.metricValue}>${metrics?.totalEarnings || 0}</Text>
            <Text style={styles.metricLabel}>Total Earnings</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center' as const,
  },
});
