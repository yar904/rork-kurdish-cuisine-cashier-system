import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator, RefreshControl } from 'react-native';
import { Text } from '@/components/CustomText';
import { Stack } from 'expo-router';
import { ChefHat, Clock, CheckCircle, PlayCircle, ArrowRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpcClient';

export default function KitchenDashboard() {
  const insets = useSafeAreaInsets();
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const activeOrdersQuery = trpc.orders.getActive.useQuery(undefined, { refetchInterval: 4000 });

  const newOrders = activeOrdersQuery.data?.filter((order) => order.status === 'new') ?? [];
  const inProgressOrders = activeOrdersQuery.data?.filter((order) => order.status === 'preparing') ?? [];
  const readyOrders =
    activeOrdersQuery.data?.filter((order) => order.status === 'ready' || order.status === 'served') ?? [];

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      activeOrdersQuery.refetch();
      setUpdatingOrderId(null);
    },
    onError: () => {
      setUpdatingOrderId(null);
    },
  });

  const handleStartPreparing = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    await updateStatusMutation.mutateAsync({ orderId, status: 'preparing' });
  };

  const handleMarkReady = async (orderId: string) => {
    setUpdatingOrderId(orderId);
    await updateStatusMutation.mutateAsync({ orderId, status: 'ready' });
  };

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    return `${minutes}m ago`;
  };

  const OrderCard = ({ order, onAction, actionLabel, actionIcon: ActionIcon, actionColor }: any) => (
    <View style={styles.orderCard}>
      <View style={styles.orderCardHeader}>
        <View>
          <Text style={styles.tableNumber}>Table {order.tableNumber}</Text>
          <Text style={styles.timeText}>{getTimeSince(order.createdAt)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: actionColor }]}
          onPress={() => onAction(order.id)}
          disabled={updatingOrderId === order.id}
          activeOpacity={0.8}
        >
          {updatingOrderId === order.id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <ActionIcon size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{actionLabel}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.orderItems}>
        {order.items.map((item: any, idx: number) => (
          <View key={idx} style={styles.orderItem}>
            <Text style={styles.orderItemQty}>{item.quantity}x</Text>
            <Text style={styles.orderItemName}>{item.menuItem?.name || 'Unknown'}</Text>
            {item.notes && (
              <Text style={styles.orderItemNotes}>({item.notes})</Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Kitchen Dashboard',
          headerStyle: { backgroundColor: '#5C0000' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={activeOrdersQuery.isRefetching}
            onRefresh={() => {
              activeOrdersQuery.refetch();
            }}
            tintColor="#5C0000"
          />
        }
      >
        <View style={styles.header}>
          <ChefHat size={32} color="#5C0000" />
          <Text style={styles.headerTitle}>Kitchen Dashboard</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>New Orders</Text>
            <View style={[styles.badge, { backgroundColor: '#F59E0B' }]}>
              <Text style={styles.badgeText}>{newOrders.length}</Text>
            </View>
          </View>

          {activeOrdersQuery.isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#5C0000" />
            </View>
          )}

          {!activeOrdersQuery.isLoading && newOrders.length === 0 && (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No new orders</Text>
            </View>
          )}

          {newOrders.length > 0 && (
            <View style={styles.ordersContainer}>
              {newOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={handleStartPreparing}
                  actionLabel="Start"
                  actionIcon={PlayCircle}
                  actionColor="#3B82F6"
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>In Progress</Text>
            <View style={[styles.badge, { backgroundColor: '#3B82F6' }]}>
              <Text style={styles.badgeText}>{inProgressOrders.length}</Text>
            </View>
          </View>

          {activeOrdersQuery.isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#5C0000" />
            </View>
          )}

          {!activeOrdersQuery.isLoading && inProgressOrders.length === 0 && (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No orders in progress</Text>
            </View>
          )}

          {inProgressOrders.length > 0 && (
            <View style={styles.ordersContainer}>
              {inProgressOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onAction={handleMarkReady}
                  actionLabel="Ready"
                  actionIcon={CheckCircle}
                  actionColor="#10B981"
                />
              ))}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Completed Today</Text>
            <View style={[styles.badge, { backgroundColor: '#10B981' }]}>
              <Text style={styles.badgeText}>{readyOrders.length}</Text>
            </View>
          </View>

          {activeOrdersQuery.isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#5C0000" />
            </View>
          )}

          {!activeOrdersQuery.isLoading && readyOrders.length === 0 && (
            <View style={styles.emptySection}>
              <Text style={styles.emptyText}>No completed orders today</Text>
            </View>
          )}

          {readyOrders.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.completedScroll}>
              {readyOrders.slice(0, 10).map((order) => (
                <View key={order.id} style={styles.completedCard}>
                  <Text style={styles.completedTable}>Table {order.tableNumber}</Text>
                  <Text style={styles.completedTime}>{getTimeSince(order.updatedAt)}</Text>
                  <View style={[styles.completedBadge, { backgroundColor: '#10B981' + '20' }]}>
                    <Text style={[styles.completedStatus, { color: '#10B981' }]}>
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EEDD',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginTop: 12,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  badge: {
    minWidth: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  ordersContainer: {
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  tableNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  timeText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  orderItems: {
    gap: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderItemQty: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#5C0000',
    minWidth: 32,
  },
  orderItemName: {
    fontSize: 16,
    color: '#3A3A3A',
    fontWeight: '500' as const,
    flex: 1,
  },
  orderItemNotes: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic' as const,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptySection: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  completedScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  completedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    minWidth: 140,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  completedTable: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  completedTime: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  completedStatus: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
});
