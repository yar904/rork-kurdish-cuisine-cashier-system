import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Calendar } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpcClient';

export default function EmployeeShiftsScreen() {
  const { employeeId, name } = useLocalSearchParams<{ employeeId: string; name: string }>();

  const shiftsQuery = trpc.employees.getShifts.useQuery(
    { employeeId },
    { enabled: !!employeeId }
  );

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (shiftsQuery.isLoading) {
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
          title: `Shifts - ${name}`,
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Scheduled Shifts</Text>
        {shiftsQuery.data?.map((shift) => (
          <View key={shift.id} style={styles.shiftCard}>
            <View style={styles.shiftHeader}>
              <Calendar size={20} color={Colors.primary} />
              <Text style={styles.shiftDate}>
                {new Date(shift.shift_date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.shiftTime}>
              <Text style={styles.timeText}>
                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
              </Text>
            </View>
            {shift.notes && (
              <Text style={styles.notes}>📝 {shift.notes}</Text>
            )}
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
  list: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  shiftCard: {
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
  shiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  shiftDate: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  shiftTime: {
    backgroundColor: Colors.backgroundGray,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
    textAlign: 'center' as const,
  },
  notes: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    fontWeight: '500' as const,
  },
});
