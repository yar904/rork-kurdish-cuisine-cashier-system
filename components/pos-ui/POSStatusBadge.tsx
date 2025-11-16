import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

type POSStatusBadgeProps = {
  status: OrderStatus;
  label?: string;
};

export function POSStatusBadge({ status, label }: POSStatusBadgeProps) {
  const getStatusColor = (s: OrderStatus) => {
    switch (s) {
      case 'pending':
        return Colors.statusNew;
      case 'preparing':
        return Colors.statusPreparing;
      case 'ready':
        return Colors.statusReady;
      case 'served':
        return Colors.statusServed;
      case 'completed':
        return Colors.statusPaid;
      case 'cancelled':
        return '#6B7280';
      default:
        return '#8E8E93';
    }
  };

  return (
    <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
      <Text style={styles.badgeText}>{label || status.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
