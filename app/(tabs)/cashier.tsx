import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Text } from '@/components/CustomText';
import { Stack, useRouter } from 'expo-router';
import { ShoppingCart, Clock, DollarSign, CheckCircle, XCircle, RefreshCw } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useNotificationsList } from '@/contexts/NotificationContext';

type OrderStatus = 'new' | 'preparing' | 'ready' | 'served' | 'paid';

export default function CashierDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const activeOrdersQuery = trpc.orders.getActive.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const notificationsQuery = useNotificationsList();

  const clearNotificationMutation = trpc.notifications.clear.useMutation({
    onSuccess: () => notificationsQuery.refetch(),
  });

  const updateStatusMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      activeOrdersQuery.refetch();
      setShowModal(false);
      setSelectedOrder(null);
    },
  });

  const onRefresh = useCallback(() => {
    activeOrdersQuery.refetch();
  }, [activeOrdersQuery]);

  const handleMarkAsReady = async (orderId: string) => {
    setIsUpdating(true);
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: 'ready',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleMarkAsPaid = async (orderId: string) => {
    setIsUpdating(true);
    try {
      await updateStatusMutation.mutateAsync({
        orderId,
        status: 'paid',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'new': return '#F59E0B';
      case 'preparing': return '#3B82F6';
      case 'ready': return '#10B981';
      case 'served': return '#8B5CF6';
      default: return '#8E8E93';
    }
  };

  const getTimeSince = (date: Date | string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Cashier Dashboard',
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
            onRefresh={onRefresh}
            tintColor="#5C0000"
          />
        }
      >
        <View style={styles.header}>
          <ShoppingCart size={32} color="#5C0000" />
          <Text style={styles.headerTitle}>Active Orders</Text>
          <Text style={styles.headerSubtitle}>
            {activeOrdersQuery.data?.length || 0} orders currently active
          </Text>
        </View>

        <View style={styles.notificationsCard}>
          <Text style={styles.notificationsTitle}>Notifications</Text>
          {notificationsQuery.isLoading ? (
            <ActivityIndicator color="#5C0000" />
          ) : notificationsQuery.data && notificationsQuery.data.length > 0 ? (
            notificationsQuery.data.map((notification) => (
              <View key={notification.id} style={styles.notificationRow}>
                <Text style={styles.notificationText}>
                  Table {notification.table_number} — {notification.type} — {getTimeSince(notification.created_at as any)}
                </Text>
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => clearNotificationMutation.mutate({ id: notification.id })}
                  disabled={clearNotificationMutation.isLoading}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.notificationText}>No notifications</Text>
          )}
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/cashier/history' as any)}
            activeOpacity={0.8}
          >
            <Clock size={20} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>View History</Text>
          </TouchableOpacity>
        </View>

        {activeOrdersQuery.isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5C0000" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        )}

        {activeOrdersQuery.error && (
          <View style={styles.errorContainer}>
            <XCircle size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Error Loading Orders</Text>
            <Text style={styles.errorText}>{activeOrdersQuery.error.message}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => activeOrdersQuery.refetch()}>
              <RefreshCw size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {!activeOrdersQuery.isLoading && !activeOrdersQuery.error && activeOrdersQuery.data?.length === 0 && (
          <View style={styles.emptyContainer}>
            <CheckCircle size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyText}>No active orders at the moment</Text>
          </View>
        )}

        {!activeOrdersQuery.isLoading && !activeOrdersQuery.error && activeOrdersQuery.data && activeOrdersQuery.data.length > 0 && (
          <View style={styles.ordersGrid}>
            {activeOrdersQuery.data.map((order) => (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedOrder(order);
                  setShowModal(true);
                }}
              >
                <View style={styles.orderHeader}>
                  <View style={styles.tableInfo}>
                    <Text style={styles.tableLabelSmall}>Table</Text>
                    <Text style={styles.tableNumber}>{order.tableNumber}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status as OrderStatus) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(order.status as OrderStatus) }]}>
                      {(order.status as string).toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderBody}>
                  <Text style={styles.itemCount}>
                    {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                  </Text>
                  <Text style={styles.timeText}>{getTimeSince(order.createdAt)}</Text>
                </View>

                <View style={styles.orderFooter}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>IQD {order.total.toLocaleString()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={styles.closeButton}>
                <XCircle size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Order Information</Text>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Table:</Text>
                    <Text style={styles.modalInfoValue}>Table {selectedOrder.tableNumber}</Text>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Status:</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedOrder.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(selectedOrder.status) }]}>
                        {selectedOrder.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Time:</Text>
                    <Text style={styles.modalInfoValue}>{getTimeSince(selectedOrder.createdAt)}</Text>
                  </View>
                  {selectedOrder.waiterName && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>Waiter:</Text>
                      <Text style={styles.modalInfoValue}>{selectedOrder.waiterName}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Order Items</Text>
                  {selectedOrder.items.map((item: any, index: number) => (
                    <View key={index} style={styles.modalItemRow}>
                      <View style={styles.modalItemInfo}>
                        <Text style={styles.modalItemName}>
                          {item.quantity}x {item.menuItem?.name || 'Unknown Item'}
                        </Text>
                        {item.notes && (
                          <Text style={styles.modalItemNotes}>Note: {item.notes}</Text>
                        )}
                      </View>
                      <Text style={styles.modalItemPrice}>
                        IQD {((item.menuItem?.price || 0) * item.quantity).toLocaleString()}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={styles.modalSection}>
                  <View style={styles.modalTotalRow}>
                    <Text style={styles.modalTotalLabel}>Total Amount</Text>
                    <Text style={styles.modalTotalValue}>IQD {selectedOrder.total.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  {selectedOrder.status !== 'ready' && selectedOrder.status !== 'paid' && (
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.readyButton]}
                      onPress={() => handleMarkAsReady(selectedOrder.id)}
                      disabled={isUpdating}
                      activeOpacity={0.8}
                    >
                      {isUpdating ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <CheckCircle size={20} color="#FFFFFF" />
                          <Text style={styles.modalActionButtonText}>Mark as Ready</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                  {(selectedOrder.status === 'ready' || selectedOrder.status === 'served') && (
                    <TouchableOpacity
                      style={[styles.modalActionButton, styles.paidButton]}
                      onPress={() => handleMarkAsPaid(selectedOrder.id)}
                      disabled={isUpdating}
                      activeOpacity={0.8}
                    >
                      {isUpdating ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <>
                          <DollarSign size={20} color="#FFFFFF" />
                          <Text style={styles.modalActionButtonText}>Mark as Paid</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    textAlign: 'center',
  },
  notificationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  notificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  notificationText: {
    flex: 1,
    fontSize: 14,
    color: '#3A3A3A',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#5C0000',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5C0000',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  errorContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 12,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  errorText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#5C0000',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  emptyContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  ordersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  orderCard: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  tableInfo: {
    gap: 4,
  },
  tableLabelSmall: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500' as const,
  },
  tableNumber: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  orderBody: {
    gap: 4,
    marginBottom: 16,
  },
  itemCount: {
    fontSize: 16,
    color: '#3A3A3A',
    fontWeight: '500' as const,
  },
  timeText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F6EEDD',
  },
  totalLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500' as const,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F6EEDD',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#3A3A3A',
    marginBottom: 12,
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modalInfoValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#3A3A3A',
  },
  modalItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F6EEDD',
  },
  modalItemInfo: {
    flex: 1,
    gap: 4,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#3A3A3A',
  },
  modalItemNotes: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic' as const,
  },
  modalItemPrice: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#3A3A3A',
    marginLeft: 12,
  },
  modalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F6EEDD',
    borderRadius: 12,
  },
  modalTotalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#3A3A3A',
  },
  modalTotalValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  modalActions: {
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  modalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  readyButton: {
    backgroundColor: '#10B981',
  },
  paidButton: {
    backgroundColor: '#5C0000',
  },
  modalActionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
