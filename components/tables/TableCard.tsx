import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from '@/components/CustomText';
import { Table, Clock } from 'lucide-react-native';

interface TableCardProps {
  tableNumber: number;
  status: string;
  orderTotal?: number | null;
  timeSinceSeated?: Date | null;
  onPress: () => void;
}

export function TableCard({ tableNumber, status, orderTotal, timeSinceSeated, onPress }: TableCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return '#10B981';
      case 'available':
        return '#8E8E93';
      case 'reserved':
        return '#3B82F6';
      case 'needs-cleaning':
        return '#F59E0B';
      default:
        return '#8E8E93';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'Occupied';
      case 'available':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'needs-cleaning':
        return 'Cleaning';
      default:
        return status;
    }
  };

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconContainer}>
        <Table size={28} color="#5C0000" />
      </View>
      
      <Text style={styles.tableNumber}>{tableNumber}</Text>
      
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
        <Text style={styles.statusText}>{getStatusLabel(status)}</Text>
      </View>

      {orderTotal !== null && orderTotal !== undefined && orderTotal > 0 && (
        <Text style={styles.total}>IQD {orderTotal.toLocaleString()}</Text>
      )}

      {timeSinceSeated && status === 'occupied' && (
        <View style={styles.timeContainer}>
          <Clock size={12} color="#8E8E93" />
          <Text style={styles.timeText}>{getTimeSince(timeSinceSeated)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    maxWidth: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F6EEDD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  total: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#5C0000',
    marginTop: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: 11,
    color: '#8E8E93',
  },
});
