import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Share,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { QrCode, Share2 } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TableQRCodesScreen() {
  const insets = useSafeAreaInsets();
  const tablesQuery = trpc.tables.getAll.useQuery();

  const getOrderUrl = (tableNumber: number) => {
    const baseUrl = process.env.EXPO_PUBLIC_APP_URL || 'https://your-app.com';
    return `${baseUrl}/customer-order?table=${tableNumber}`;
  };

  const handleShare = async (tableNumber: number) => {
    const url = getOrderUrl(tableNumber);
    try {
      await Share.share({
        message: `Order from Table ${tableNumber}\n${url}`,
        url: url,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR code');
    }
  };

  if (tablesQuery.isLoading) {
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
          title: 'Table QR Codes',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <View style={styles.header}>
        <Text style={styles.title}>QR Codes for Self-Ordering</Text>
        <Text style={styles.subtitle}>
          Customers scan these QR codes to order directly from their table
        </Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {tablesQuery.data?.map((table) => {
          const url = getOrderUrl(table.number);
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;

          return (
            <View key={table.number} style={styles.qrCard}>
              <View style={styles.qrHeader}>
                <View style={styles.tableInfo}>
                  <Text style={styles.tableName}>Table {table.number}</Text>
                  <Text style={styles.tableCapacity}>Capacity: {table.capacity}</Text>
                </View>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={() => handleShare(table.number)}
                >
                  <Share2 size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>

              <View style={styles.qrCodeContainer}>
                <QrCode size={200} color={Colors.primary} />
                <Text style={styles.qrPlaceholder}>QR Code for Table {table.number}</Text>
                <Text style={styles.qrUrl}>{url}</Text>
              </View>

              <View style={styles.instructions}>
                <Text style={styles.instructionTitle}>How it works:</Text>
                <Text style={styles.instructionText}>
                  1. Customer scans QR code{'\n'}
                  2. Opens menu on their phone{'\n'}
                  3. Adds items to cart{'\n'}
                  4. Submits order directly to kitchen
                </Text>
              </View>
            </View>
          );
        })}
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
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  qrCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tableInfo: {
    flex: 1,
  },
  tableName: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 4,
  },
  tableCapacity: {
    fontSize: 14,
    color: '#6b7280',
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrCodeContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    marginBottom: 16,
  },
  qrPlaceholder: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#111827',
    marginTop: 12,
  },
  qrUrl: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center' as const,
  },
  instructions: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#111827',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 20,
  },
});
