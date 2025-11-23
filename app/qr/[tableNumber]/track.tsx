import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Alert,
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

interface StatusConfig {
  color: string;
  icon: React.ReactNode;
  title: string;
  message: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  no_order: {
    color: '#8E8E93',
    icon: <Clock size={60} color="#8E8E93" />,
    title: 'No Active Order',
    message: 'You don\'t have any active orders at this table.',
  },
  pending: {
    color: '#3B82F6',
    icon: <Clock size={60} color="#3B82F6" />,
    title: 'Order Received',
    message: 'Your order has been received and will be prepared soon.',
  },
  preparing: {
    color: '#F59E0B',
    icon: <ChefHat size={60} color="#F59E0B" />,
    title: 'Preparing Your Food',
    message: 'Our kitchen is preparing your delicious meal.',
  },
  ready: {
    color: '#10B981',
    icon: <CheckCircle size={60} color="#10B981" />,
    title: 'Ready for Pickup',
    message: 'Your food is ready! We\'ll bring it to your table shortly.',
  },
  served: {
    color: '#8B5CF6',
    icon: <CheckCircle size={60} color="#8B5CF6" />,
    title: 'Served',
    message: 'Enjoy your meal!',
  },
  paid: {
    color: '#6B7280',
    icon: <DollarSign size={60} color="#6B7280" />,
    title: 'Payment Completed',
    message: 'Thank you for dining with us!',
  },
};

export default function TrackOrderPage() {
  const { tableNumber } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const tableNum = parseInt(String(tableNumber), 10);

  const statusQuery = trpc.orders.getCustomerStatus.useQuery(
    { tableNumber: tableNum },
    {
      refetchInterval: 3000,
      enabled: !isNaN(tableNum),
    }
  );

  const createServiceRequestMutation = trpc.serviceRequests.create.useMutation();

  const handleServiceRequest = async (requestType: 'waiter' | 'bill') => {
    try {
      await createServiceRequestMutation.mutateAsync({
        tableNumber: tableNum,
        requestType,
        messageText: '',
      });

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

  const currentStatus = statusQuery.data?.status || 'no_order';
  const config = STATUS_CONFIG[currentStatus];

  const getCompletedStatuses = () => {
    const statuses = ['pending', 'preparing', 'ready', 'served'];
    const currentIndex = statuses.indexOf(currentStatus);
    return statuses.filter((_, index) => index <= currentIndex);
  };

  const completedStatuses = getCompletedStatuses();

  return (
    <View style={styles.container}>
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
              <Text style={styles.statusTitle}>{config.title}</Text>
              <Text style={styles.statusMessage}>{config.message}</Text>

              {statusQuery.data?.orderId && (
                <View style={styles.orderIdContainer}>
                  <Text style={styles.orderIdLabel}>Order ID</Text>
                  <Text style={styles.orderId}>
                    {statusQuery.data.orderId.slice(0, 8).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {currentStatus !== 'no_order' && currentStatus !== 'paid' && (
              <View style={styles.timelineCard}>
                <Text style={styles.timelineTitle}>Order Progress</Text>

                <View style={styles.timeline}>
                  <TimelineItem
                    title="Received"
                    completed={completedStatuses.includes('pending')}
                    active={currentStatus === 'pending'}
                  />
                  <TimelineItem
                    title="Preparing"
                    completed={completedStatuses.includes('preparing')}
                    active={currentStatus === 'preparing'}
                  />
                  <TimelineItem
                    title="Ready"
                    completed={completedStatuses.includes('ready')}
                    active={currentStatus === 'ready'}
                  />
                  <TimelineItem
                    title="Served"
                    completed={completedStatuses.includes('served')}
                    active={currentStatus === 'served'}
                    isLast
                  />
                </View>
              </View>
            )}

            {statusQuery.data?.items && statusQuery.data.items.length > 0 && (
              <View style={styles.itemsCard}>
                <Text style={styles.itemsTitle}>Your Order</Text>
                {statusQuery.data.items.map((item, index) => (
                  <View key={index} style={styles.orderItem}>
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
                    ${statusQuery.data.subtotal.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>
                    ${statusQuery.data.tax.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabelBold}>Total</Text>
                  <Text style={styles.summaryValueBold}>
                    ${statusQuery.data.total.toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {currentStatus === 'no_order' && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
                activeOpacity={0.8}
              >
                <Text style={styles.backButtonText}>Order Now</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      {currentStatus !== 'no_order' && currentStatus !== 'paid' && (
        <View style={[styles.actionButtons, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity
            style={styles.serviceButton}
            onPress={() => handleServiceRequest('waiter')}
            activeOpacity={0.8}
            disabled={createServiceRequestMutation.isPending}
          >
            <HandHeart size={20} color="#5C0000" />
            <Text style={styles.serviceButtonText}>Call Waiter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceButton}
            onPress={() => handleServiceRequest('bill')}
            activeOpacity={0.8}
            disabled={createServiceRequestMutation.isPending}
          >
            <Receipt size={20} color="#5C0000" />
            <Text style={styles.serviceButtonText}>Request Bill</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.serviceButton}
            onPress={() => handleServiceRequest('waiter')}
            activeOpacity={0.8}
            disabled={createServiceRequestMutation.isPending}
          >
            <AlertCircle size={20} color="#5C0000" />
            <Text style={styles.serviceButtonText}>Report Issue</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

interface TimelineItemProps {
  title: string;
  completed: boolean;
  active: boolean;
  isLast?: boolean;
}

function TimelineItem({ title, completed, active, isLast }: TimelineItemProps) {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineLeft}>
        <View
          style={[
            styles.timelineDot,
            completed && styles.timelineDotCompleted,
            active && styles.timelineDotActive,
          ]}
        />
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              completed && styles.timelineLineCompleted,
            ]}
          />
        )}
      </View>
      <View style={styles.timelineRight}>
        <Text
          style={[
            styles.timelineText,
            (completed || active) && styles.timelineTextActive,
          ]}
        >
          {title}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EEDD',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 140,
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
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
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
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  orderIdContainer: {
    backgroundColor: '#F6EEDD',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#5C0000',
    letterSpacing: 2,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
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
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginBottom: 20,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E5EA',
    borderWidth: 3,
    borderColor: '#E5E5EA',
  },
  timelineDotCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  timelineDotActive: {
    backgroundColor: '#5C0000',
    borderColor: '#5C0000',
  },
  timelineLine: {
    width: 3,
    flex: 1,
    backgroundColor: '#E5E5EA',
    minHeight: 32,
  },
  timelineLineCompleted: {
    backgroundColor: '#10B981',
  },
  timelineRight: {
    flex: 1,
    paddingVertical: 2,
  },
  timelineText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  timelineTextActive: {
    color: '#3A3A3A',
    fontWeight: '600' as const,
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
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
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginBottom: 16,
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
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 16,
    color: '#3A3A3A',
  },
  summaryLabelBold: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  summaryValueBold: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  backButton: {
    backgroundColor: '#5C0000',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    fontSize: 16,
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
