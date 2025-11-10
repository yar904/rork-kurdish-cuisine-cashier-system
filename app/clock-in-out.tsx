import React from 'react';
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

export default function ClockInOutScreen() {
  const { employeeId, name } = useLocalSearchParams<{ employeeId: string; name: string }>();

  const clockRecordsQuery = trpc.employees.getClockRecords.useQuery(
    { employeeId },
    { enabled: !!employeeId }
  );

  const clockInMutation = trpc.employees.clockIn.useMutation({
    onSuccess: () => {
      clockRecordsQuery.refetch();
      Alert.alert('Success', 'Clocked in successfully');
    },
<<<<<<< HEAD
    onError: (error: any) => {
=======
    onError: (error) => {
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
      Alert.alert('Error', error.message);
    },
  });

  const clockOutMutation = trpc.employees.clockOut.useMutation({
    onSuccess: () => {
      clockRecordsQuery.refetch();
      Alert.alert('Success', 'Clocked out successfully');
    },
<<<<<<< HEAD
    onError: (error: any) => {
=======
    onError: (error) => {
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
      Alert.alert('Error', error.message);
    },
  });

  const activeRecord = clockRecordsQuery.data?.find(
<<<<<<< HEAD
    (record: any) => record.clock_out === null
=======
    (record) => record.clock_out === null
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Clock In/Out - ${name}`,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
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
<<<<<<< HEAD
        {clockRecordsQuery.data?.map((record: any) => (
=======
        {clockRecordsQuery.data?.map((record) => (
>>>>>>> 3d65eb3cb3ed8162e20b96c17185529fc5c9cee3
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
    backgroundColor: Colors.backgroundGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  header: {
    backgroundColor: Colors.background,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  employeeName: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
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
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  recordCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    fontWeight: '700' as const,
    color: Colors.text,
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
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  recordValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  hoursValue: {
    color: Colors.primary,
    fontWeight: '700' as const,
  },
});
