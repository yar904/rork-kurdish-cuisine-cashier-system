import React, { useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { ChefHat, Clock, ArrowRight, Printer } from 'lucide-react-native';
import { printKitchenTicket } from '@/lib/printer';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRealtime } from '@/contexts/RealtimeContext';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

type Order = {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  createdAt: Date;
  waiterName?: string;
  items: Array<{
    quantity: number;
    notes?: string;
    menuItem: {
      name: string;
      nameKurdish: string;
      price: number;
    };
  }>;
};

const STATUS_COLORS = {
  pending: '#3B82F6',
  preparing: '#F59E0B',
  ready: '#10B981',
  served: '#8B5CF6',
  completed: '#6B7280',
  cancelled: '#EF4444',
};

export default function KitchenScreen() {
  const { t } = useLanguage();
  const { notifyOrderReady } = useNotifications();
  const { subscribeToOrders } = useRealtime();
  const previousOrdersRef = useRef<Order[]>([]);

  const ordersQuery = trpc.orders.getAll.useQuery(undefined, {
    refetchInterval: 5000,
  });

  useEffect(() => {
    console.log('[Kitchen] Orders query data:', ordersQuery.data);
    console.log('[Kitchen] Orders query loading:', ordersQuery.isLoading);
    console.log('[Kitchen] Orders query error:', ordersQuery.error);
  }, [ordersQuery.data, ordersQuery.isLoading, ordersQuery.error]);

  const updateOrderMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      ordersQuery.refetch();
    },
    onError: (error) => {
      console.error('[Kitchen] Update error:', error);
      Alert.alert('Error', error.message || 'Failed to update order status');
    },
  });

  const orders = useMemo(() => {
    if (!ordersQuery.data) return [];

    return ordersQuery.data.map((o: any): Order => {
      const orderItems = o.order_items || [];
      const items = orderItems
        .map((item: any) => {
          const menuItem = item.menu_items || item.menu_item;
          if (!menuItem) return null;

          return {
            quantity: item.quantity,
            notes: item.notes || undefined,
            menuItem: {
              name: menuItem.name || menuItem.name_kurdish,
              nameKurdish: menuItem.name_kurdish,
              price: menuItem.price,
            },
          };
        })
        .filter((item: any): item is Order['items'][0] => item !== null);

      return {
        id: o.id,
        tableNumber: o.table_number,
        status: o.status as OrderStatus,
        createdAt: new Date(o.created_at),
        waiterName: o.waiter_name || undefined,
        items,
      };
    });
  }, [ordersQuery.data]);

  useEffect(() => {
    const unsubscribe = subscribeToOrders(() => {
      console.log('[Kitchen] Real-time order update detected - refetching');
      ordersQuery.refetch();
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeToOrders, ordersQuery]);

  useEffect(() => {
    const newOrders = orders.filter((o) => o.status === 'pending');
    const previousNewOrders = previousOrdersRef.current.filter((o) => o.status === 'pending');

    if (newOrders.length > previousNewOrders.length) {
      const addedOrders = newOrders.filter(
        (no) => !previousNewOrders.some((po) => po.id === no.id)
      );

      addedOrders.forEach((order) => {
        console.log(`🔔 NEW ORDER: #${order.id} for Table ${order.tableNumber}`);
        if (
          Platform.OS === 'web' &&
          'Notification' in window &&
          Notification.permission === 'granted'
        ) {
          new Notification('New Order! 🍽️', {
            body: `Order #${order.id} for Table ${order.tableNumber}`,
            icon: '/assets/images/icon.png',
          });
        }
      });
    }

    previousOrdersRef.current = orders;
  }, [orders]);

  const activeOrders = useMemo(() => {
    const filtered = orders.filter(
      (order) =>
        order.status === 'pending' || order.status === 'preparing' || order.status === 'ready'
    );

    return filtered.sort((a, b) => {
      if (a.status === 'preparing' && b.status === 'pending') return -1;
      if (a.status === 'pending' && b.status === 'preparing') return 1;

      const aItemCount = a.items.reduce((sum, item) => sum + item.quantity, 0);
      const bItemCount = b.items.reduce((sum, item) => sum + item.quantity, 0);

      if (aItemCount !== bItemCount) {
        return aItemCount - bItemCount;
      }

      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }, [orders]);

  const pendingOrders = useMemo(
    () => activeOrders.filter((o) => o.status === 'pending'),
    [activeOrders]
  );

  const preparingOrders = useMemo(
    () => activeOrders.filter((o) => o.status === 'preparing'),
    [activeOrders]
  );

  const readyOrders = useMemo(
    () => activeOrders.filter((o) => o.status === 'ready'),
    [activeOrders]
  );

  const getNextStatus = (status: OrderStatus): OrderStatus | null => {
    switch (status) {
      case 'pending':
        return 'preparing';
      case 'preparing':
        return 'ready';
      case 'ready':
        return 'served';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (status: OrderStatus): string => {
    switch (status) {
      case 'pending':
        return 'Start Preparing';
      case 'preparing':
        return 'Mark as Ready';
      case 'ready':
        return 'Mark as Served';
      default:
        return '';
    }
  };

  const handleStatusUpdate = async (orderId: string, currentStatus: OrderStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus) {
      try {
        await updateOrderMutation.mutateAsync({
          id: orderId,
          status: nextStatus,
        });

        if (nextStatus === 'ready') {
          const order = orders.find((o) => o.id === orderId);
          if (order) {
            console.log(`✅ Order #${orderId} for Table ${order.tableNumber} is READY!`);
            await notifyOrderReady(orderId, order.tableNumber);

            if (Platform.OS === 'web') {
              try {
                const audioContext = new (window.AudioContext ||
                  (window as any).webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.value = 1000;
                gainNode.gain.value = 0.4;
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.15);
                setTimeout(() => {
                  const osc2 = audioContext.createOscillator();
                  const gain2 = audioContext.createGain();
                  osc2.connect(gain2);
                  gain2.connect(audioContext.destination);
                  osc2.frequency.value = 1200;
                  gain2.gain.value = 0.4;
                  osc2.start(audioContext.currentTime);
                  osc2.stop(audioContext.currentTime + 0.15);
                }, 150);
              } catch (error) {
                console.log('Sound playback error:', error);
              }
            }
          }
        }

        Alert.alert('Success', `Order updated to ${nextStatus}`);
      } catch (error) {
        console.error('Error updating order status:', error);
      }
    }
  };

  const handlePrintKitchen = async (order: Order) => {
    try {
      await printKitchenTicket(order as any, t('restaurantName') || 'Kurdish Cuisine');
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print kitchen ticket');
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  };

  const renderOrder = (order: Order) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderHeaderLeft}>
          <View
            style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[order.status] }]}
          >
            <Text style={styles.statusBadgeText}>{order.status.toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.orderNumber}>#{order.id}</Text>
            <Text style={styles.tableNumber}>Table {order.tableNumber}</Text>
          </View>
        </View>
        <View style={styles.orderHeaderRight}>
          <Clock size={16} color="#8E8E93" />
          <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
        </View>
      </View>

      {order.waiterName && (
        <Text style={styles.waiterName}>Waiter: {order.waiterName}</Text>
      )}

      <TouchableOpacity
        style={styles.printButton}
        onPress={() => handlePrintKitchen(order)}
        activeOpacity={0.7}
      >
        <Printer size={16} color="#3d0101" />
        <Text style={styles.printButtonText}>Print</Text>
      </TouchableOpacity>

      <View style={styles.orderItems}>
        {order.items.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityBadgeText}>{item.quantity}x</Text>
            </View>
            <View style={styles.orderItemInfo}>
              <Text style={styles.orderItemName}>{item.menuItem.name}</Text>
              <Text style={styles.orderItemKurdish}>{item.menuItem.nameKurdish}</Text>
              {item.notes && <Text style={styles.orderItemNotes}>Note: {item.notes}</Text>}
            </View>
          </View>
        ))}
      </View>

      {getNextStatus(order.status) && (
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: STATUS_COLORS[getNextStatus(order.status)!] },
          ]}
          onPress={() => handleStatusUpdate(order.id, order.status)}
          disabled={updateOrderMutation.isPending}
          activeOpacity={0.8}
        >
          {updateOrderMutation.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Text style={styles.actionButtonText}>{getNextStatusLabel(order.status)}</Text>
              <ArrowRight size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (ordersQuery.isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: `Kitchen / چێشتخانە`,
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#1C1C1E',
            headerShadowVisible: false,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3d0101" />
          <Text style={styles.loadingText}>Loading orders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Kitchen / چێشتخانە`,
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1C1C1E',
          headerShadowVisible: false,
        }}
      />

      <ScrollView style={styles.content}>
        {activeOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <ChefHat size={64} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No Active Orders</Text>
            <Text style={styles.emptyStateText}>New orders will appear here</Text>
          </View>
        ) : (
          <View style={styles.columns}>
            <View style={styles.column}>
              <View style={styles.columnHeader}>
                <View style={[styles.columnHeaderDot, { backgroundColor: STATUS_COLORS.pending }]} />
                <Text style={styles.columnHeaderText}>Pending</Text>
                <View style={styles.columnHeaderBadge}>
                  <Text style={styles.columnHeaderBadgeText}>{pendingOrders.length}</Text>
                </View>
              </View>
              {pendingOrders.map(renderOrder)}
            </View>

            <View style={styles.column}>
              <View style={styles.columnHeader}>
                <View
                  style={[styles.columnHeaderDot, { backgroundColor: STATUS_COLORS.preparing }]}
                />
                <Text style={styles.columnHeaderText}>Preparing</Text>
                <View style={styles.columnHeaderBadge}>
                  <Text style={styles.columnHeaderBadgeText}>{preparingOrders.length}</Text>
                </View>
              </View>
              {preparingOrders.map(renderOrder)}
            </View>

            <View style={styles.column}>
              <View style={styles.columnHeader}>
                <View style={[styles.columnHeaderDot, { backgroundColor: STATUS_COLORS.ready }]} />
                <Text style={styles.columnHeaderText}>Ready</Text>
                <View style={styles.columnHeaderBadge}>
                  <Text style={styles.columnHeaderBadgeText}>{readyOrders.length}</Text>
                </View>
              </View>
              {readyOrders.map(renderOrder)}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1C1C1E',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  columns: {
    padding: 16,
    flexDirection: 'row' as const,
    gap: 16,
    flexWrap: 'wrap' as const,
    justifyContent: 'space-evenly' as const,
    ...Platform.select({
      web: {
        maxWidth: 1920,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
  },
  column: {
    flex: 1,
    minWidth: 300,
    maxWidth: 500,
    gap: 12,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      },
    }),
  },
  columnHeaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  columnHeaderText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1C1C1E',
    flex: 1,
  },
  columnHeaderBadge: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  columnHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#1C1C1E',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      },
    }),
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  orderHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#fff',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1C1C1E',
  },
  tableNumber: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  orderTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
  waiterName: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 8,
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F5F7',
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  printButtonText: {
    fontSize: 13,
    color: '#1C1C1E',
    fontWeight: '600' as const,
  },
  orderItems: {
    gap: 8,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
  },
  quantityBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#3d0101',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityBadgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1C1C1E',
  },
  orderItemKurdish: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  orderItemNotes: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 4,
    fontStyle: 'italic' as const,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    minHeight: 44,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
