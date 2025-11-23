import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Text } from '@/components/CustomText';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Clock,
  ChefHat,
  CheckCircle,
  DollarSign,
  HandHeart,
  Receipt,
  AlertCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useNotifications } from '@/contexts/NotificationContext';

type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'paid';
type StatusKey = OrderStatus | 'waiting';

interface StatusConfig {
  color: string;
  icon: React.ReactNode;
  title: string;
  message: string;
}

const STATUS_CONFIG: Record<StatusKey, StatusConfig> = {
  waiting: {
    color: '#8E8E93',
    icon: <Clock size={60} color="#8E8E93" />,
    title: 'Waiting for order…',
    message: 'We will update this page once your order is placed.',
  },
  new: {
    color: '#2563EB',
    icon: <Clock size={60} color="#2563EB" />,
    title: 'Order Received',
    message: 'Your order has been received and is being queued.',
  },
  preparing: {
    color: '#EA580C',
    icon: <ChefHat size={60} color="#EA580C" />,
    title: 'Preparing',
    message: 'Our kitchen is preparing your meal.',
  },
  ready: {
    color: '#16A34A',
    icon: <CheckCircle size={60} color="#16A34A" />,
    title: 'Ready',
    message: 'Your order is ready and on the way.',
  },
  served: {
    color: '#7C3AED',
    icon: <CheckCircle size={60} color="#7C3AED" />,
    title: 'Served',
    message: 'Enjoy your meal!',
  },
  paid: {
    color: '#6B7280',
    icon: <DollarSign size={60} color="#6B7280" />,
    title: 'Paid',
    message: 'Payment completed. Thank you!',
  },
};

const TIMELINE_STEPS: { key: OrderStatus; label: string; color: string }[] = [
  { key: 'new', label: 'Received', color: '#2563EB' },
  { key: 'preparing', label: 'Preparing', color: '#EA580C' },
  { key: 'ready', label: 'Ready', color: '#16A34A' },
  { key: 'served', label: 'Served', color: '#7C3AED' },
];

export default function TrackOrderPage() {
  const { tableNumber } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { publish } = useNotifications();

  const tableNum = parseInt(String(tableNumber), 10);

  const statusQuery = trpc.orders.getCustomerStatus.useQuery(
    { tableNumber: tableNum },
    {
      refetchInterval: 3000,
      enabled: !isNaN(tableNum),
    }
  );

  const handleServiceRequest = async (
    requestType: 'help' | 'other'
  ) => {
    try {
      await publish(tableNum, requestType);

      if (Platform.OS === 'web') {
        alert('Request sent successfully');
      } else {
        Alert.alert('Success', 'Request sent successfully');
      }
    } catch (error) {
      console.error('Failed to send service request:', error);
      if (Platform.OS === 'web') {
        alert('Failed to send request');
      } else {
        Alert.alert('Error', 'Failed to send request');
      }
    }
  };

  const handleRefresh = () => {
    statusQuery.refetch();
  };

  const hasOrder = statusQuery.data?.hasOrder;

  const currentStatus: StatusKey = useMemo(() => {
    if (!hasOrder) return 'waiting';
    return statusQuery.data?.status ?? 'new';
  }, [hasOrder, statusQuery.data?.status]);

  const config = STATUS_CONFIG[currentStatus];

  const completedStatuses = useMemo(() => {
    if (currentStatus === 'waiting') return [];
    if (currentStatus === 'paid') return TIMELINE_STEPS.map(step => step.key);

    const currentIndex = TIMELINE_STEPS.findIndex(step => step.key === currentStatus);
    if (currentIndex === -1) return [];

    return TIMELINE_STEPS.filter((_, index) => index <= currentIndex).map(step => step.key);
  }, [currentStatus]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: `Track Order - Table ${tableNumber}`,
          headerStyle: { backgroundColor: '#5C0000' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={statusQuery.isRefetching}
            onRefresh={handleRefresh}
            tintColor="#5C0000"
            colors={['#5C0000']}
          />
        }
      >
        {statusQuery.isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5C0000" />
            <Text style={styles.loadingText}>Loading order status...</Text>
          </View>
        ) : (
          <>
            <View style={styles.statusCard}>
              <View style={styles.iconContainer}>{config.icon}</View>
              <Text style={[styles.statusTitle, { color: config.color }]}>{config.title}</Text>
              <Text style={styles.statusMessage}>{config.message}</Text>

              {hasOrder && statusQuery.data?.created_at && (
                <View style={styles.orderIdContainer}>
                  <Text style={styles.orderIdLabel}>Order Created</Text>
                  <Text style={styles.orderId}>
                    {new Date(statusQuery.data.created_at).toLocaleTimeString()}
                  </Text>
                </View>
              )}
            </View>

            {hasOrder && currentStatus !== 'paid' && (
              <View style={styles.timelineCard}>
                <Text style={styles.timelineTitle}>Order Progress</Text>

                <View style={styles.timeline}>
                  {TIMELINE_STEPS.map((step, index) => (
                    <TimelineItem
                      key={step.key}
                      title={step.label}
                      color={step.color}
                      completed={completedStatuses.includes(step.key)}
                      active={currentStatus === step.key}
                      isLast={index === TIMELINE_STEPS.length - 1}
                    />
                  ))}
                </View>
              </View>
            )}

            {hasOrder && statusQuery.data?.items && statusQuery.data.items.length > 0 && (
              <View style={styles.itemsCard}>
                <Text style={styles.itemsTitle}>Your Order</Text>
                {statusQuery.data.items.map((item, index) => (
                  <View key={`${item.name}-${index}`} style={styles.orderItem}>
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemQuantity}>×{item.quantity}</Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    ${(statusQuery.data.subtotal ?? 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax (10%)</Text>
                  <Text style={styles.summaryValue}>
                    ${(statusQuery.data.tax ?? 0).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelBold}>Total</Text>
                  <Text style={styles.summaryValueBold}>
                    ${(statusQuery.data.total ?? 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {!hasOrder && (
              <View style={styles.waitingCard}>
                <Text style={styles.waitingTitle}>Waiting for order…</Text>
                <Text style={styles.waitingMessage}>
                  Once your order is placed, you will see live updates here.
                </Text>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backButtonText}>Back to Menu</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      {hasOrder && (
        <View style={[styles.actionButtons, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.serviceButton}
            onPress={() => handleServiceRequest('help')}
            activeOpacity={0.8}
          >
            <HandHeart size={20} color="#5C0000" />
            <Text style={styles.serviceButtonText}>Call Waiter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceButton}
            onPress={() => handleServiceRequest('help')}
            activeOpacity={0.8}
          >
            <Receipt size={20} color="#5C0000" />
            <Text style={styles.serviceButtonText}>Notify Staff</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceButton}
            onPress={() => handleServiceRequest('other')}
            activeOpacity={0.8}
          >
            <AlertCircle size={20} color="#5C0000" />
            <Text style={styles.serviceButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

interface TimelineItemProps {
  title: string;
  completed: boolean;
  active: boolean;
  color: string;
  isLast?: boolean;
}

function TimelineItem({ title, completed, active, color, isLast }: TimelineItemProps) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View
          style={[
            styles.timelineDot,
            { borderColor: color },
            completed && { backgroundColor: color },
            active && styles.timelineDotActive,
          ]}
        />
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              completed && { backgroundColor: color },
            ]}
          />
        )}
      </View>
      <View style={styles.timelineRight}>
        <Text
          style={[
            styles.timelineText,
            (completed || active) && styles.timelineTextActive,
            { color: completed || active ? '#3A3A3A' : '#8E8E93' },
          ]}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F6EEDD',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 160,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 28,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  iconContainer: {
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  orderIdContainer: {
    backgroundColor: '#F6EEDD',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
    gap: 4,
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#5C0000',
    letterSpacing: 1,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginBottom: 16,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E5EA',
    borderWidth: 3,
    borderColor: '#E5E5EA',
  },
  timelineDotActive: {
    transform: [{ scale: 1.05 }],
  },
  timelineLine: {
    width: 3,
    flex: 1,
    backgroundColor: '#E5E5EA',
    minHeight: 32,
  },
  timelineRight: {
    flex: 1,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  timelineText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  timelineTextActive: {
    fontWeight: '600' as const,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  itemsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F6EEDD',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: '#3A3A3A',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '600' as const,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#5C0000',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 15,
    color: '#3A3A3A',
  },
  summaryLabelBold: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  summaryValueBold: {
    fontSize: 19,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  waitingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 12,
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
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  waitingTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  waitingMessage: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: '#5C0000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  actionButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F6EEDD',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#5C0000',
    minWidth: 100,
    justifyContent: 'center',
  },
  serviceButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#5C0000',
  },
});
