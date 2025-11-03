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

export default function TableQRCodesScreen() {
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
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Table QR Codes',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />

      <View style={styles.header}>
        <Text style={styles.title}>QR Codes for Self-Ordering</Text>
        <Text style={styles.subtitle}>
          Customers scan these QR codes to order directly from their table
        </Text>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {tablesQuery.data?.map((table: any) => {
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
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  qrCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
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
    borderBottomColor: Colors.border,
  },
  tableInfo: {
    flex: 1,
  },
  tableName: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  tableCapacity: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrCodeContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  qrPlaceholder: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginTop: 12,
  },
  qrUrl: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center' as const,
    fontWeight: '500' as const,
  },
  instructions: {
    backgroundColor: Colors.backgroundGray,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionTitle: {
    fontSize: 14,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500' as const,
  },
});
