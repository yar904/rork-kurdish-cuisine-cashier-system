import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

type POSStatusBadgeProps = {
  status: OrderStatus;
  label?: string;
};

export function POSStatusBadge({ status, label }: POSStatusBadgeProps) {
  const getStatusColor = (s: OrderStatus) => {
    switch (s) {
      case 'pending':
        return '#3B82F6';
      case 'preparing':
        return '#F59E0B';
      case 'ready':
        return '#10B981';
      case 'served':
        return '#8B5CF6';
      case 'completed':
        return '#6B7280';
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
