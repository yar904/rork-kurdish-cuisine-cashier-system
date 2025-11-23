import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Text } from '@/components/CustomText';
import { CheckCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface QRSuccessProps {
  tableNumber: number;
  orderId: string;
}

export function QRSuccess({ tableNumber, orderId }: QRSuccessProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={80} color="#10B981" />
        </View>

        <Text style={styles.title}>Order Placed!</Text>
        <Text style={styles.message}>
          Your order has been sent to the kitchen.
          {'\n'}We'll bring it to Table {tableNumber} shortly.
        </Text>

        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>Order ID</Text>
          <Text style={styles.orderId}>{orderId.slice(0, 8).toUpperCase()}</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => router.push(`/qr/${tableNumber}/track`)}
          activeOpacity={0.8}
          accessibilityRole="button"
          testID="track-order-button"
        >
          <Text style={styles.primaryButtonText}>Track My Order</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Order More</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EEDD',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
    }),
  },
  iconContainer: {
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  orderInfo: {
    backgroundColor: '#F6EEDD',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  orderLabel: {
    fontSize: 13,
    color: '#8E8E93',
  },
  orderId: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#5C0000',
    letterSpacing: 2,
  },
  primaryButton: {
    backgroundColor: '#5C0000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#5C0000',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
});
