import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Clock, LogIn, LogOut } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ClockInOutScreen() {
  const { employeeId, name } = useLocalSearchParams<{ employeeId: string; name: string }>();
  const insets = useSafeAreaInsets();

  const clockRecordsQuery = trpc.employees.getClockRecords.useQuery(
    { employeeId },
    { enabled: !!employeeId }
  );

  const clockInMutation = trpc.employees.clockIn.useMutation({
    onSuccess: () => {
      clockRecordsQuery.refetch();
      Alert.alert('Success', 'Clocked in successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const clockOutMutation = trpc.employees.clockOut.useMutation({
    onSuccess: () => {
      clockRecordsQuery.refetch();
      Alert.alert('Success', 'Clocked out successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const activeRecord = clockRecordsQuery.data?.find(
    (record) => record.clock_out === null
  );

  const handleClockIn = () => {
    if (!employeeId) return;
    clockInMutation.mutate({ employeeId });
  };

  const handleClockOut = () => {
    if (!employeeId) return;
    clockOutMutation.mutate({ employeeId, breakMinutes: 0 });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateHours = (clockIn: string, clockOut: string | null) => {
    if (!clockOut) return 'In Progress';
    const start = new Date(clockIn).getTime();
    const end = new Date(clockOut).getTime();
    const hours = (end - start) / (1000 * 60 * 60);
    return `${hours.toFixed(2)} hours`;
  };

  if (clockRecordsQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: `Clock In/Out - ${name}`,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.header}>
        <Text style={styles.employeeName}>{name}</Text>
        {activeRecord && (
          <View style={styles.activeRecordCard}>
            <View style={styles.activeIndicator}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Currently Clocked In</Text>
            </View>
            <Text style={styles.clockInTime}>
              Since: {formatDateTime(activeRecord.clock_in)}
            </Text>
          </View>
        )}

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.clockInButton,
              activeRecord && styles.disabledButton,
            ]}
            onPress={handleClockIn}
            disabled={!!activeRecord || clockInMutation.isPending}
          >
            <LogIn size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Clock In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.clockOutButton,
              !activeRecord && styles.disabledButton,
            ]}
            onPress={handleClockOut}
            disabled={!activeRecord || clockOutMutation.isPending}
          >
            <LogOut size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Clock Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Recent Clock Records</Text>
        {clockRecordsQuery.data?.map((record) => (
          <View key={record.id} style={styles.recordCard}>
            <View style={styles.recordHeader}>
              <Clock size={20} color={Colors.primary} />
              <Text style={styles.recordDate}>
                {new Date(record.clock_in).toLocaleDateString()}
              </Text>
              {!record.clock_out && (
                <View style={styles.inProgressBadge}>
                  <Text style={styles.inProgressText}>In Progress</Text>
                </View>
              )}
            </View>

            <View style={styles.recordDetails}>
              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Clock In:</Text>
                <Text style={styles.recordValue}>{formatDateTime(record.clock_in)}</Text>
              </View>

              {record.clock_out && (
                <View style={styles.recordRow}>
                  <Text style={styles.recordLabel}>Clock Out:</Text>
                  <Text style={styles.recordValue}>{formatDateTime(record.clock_out)}</Text>
                </View>
              )}

              <View style={styles.recordRow}>
                <Text style={styles.recordLabel}>Total Hours:</Text>
                <Text style={[styles.recordValue, styles.hoursValue]}>
                  {calculateHours(record.clock_in, record.clock_out)}
                </Text>
              </View>
            </View>
          </View>
        ))}
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
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  employeeName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 16,
  },
  activeRecordCard: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  activeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
  },
  activeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#166534',
  },
  clockInTime: {
    fontSize: 12,
    color: '#166534',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  clockInButton: {
    backgroundColor: '#22c55e',
  },
  clockOutButton: {
    backgroundColor: '#ef4444',
  },
  disabledButton: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 12,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
    flex: 1,
  },
  inProgressBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inProgressText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: '#92400e',
  },
  recordDetails: {
    gap: 8,
  },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  recordValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500' as const,
  },
  hoursValue: {
    color: Colors.primary,
    fontWeight: '700' as const,
  },
});
