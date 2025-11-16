import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { formatPrice } from '@/constants/currency';
import { ClipboardList, DollarSign, Users, X, Bell, Receipt } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { useNotifications } from '@/contexts/NotificationContext';
import { useRealtime } from '@/contexts/RealtimeContext';
import { POSContainer, POSCard, POSButton } from '@/components/pos-ui';

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';

type Order = {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  total: number;
  createdAt: Date;
  waiterName?: string;
  items: Array<{
    quantity: number;
    menuItem: {
      name: string;
      price: number;
    };
  }>;
};

type ServiceRequest = {
  id: string;
  tableNumber: number;
  type: string;
  status: string;
  createdAt: Date;
};

export default function WaiterScreen() {
  const { t } = useLanguage();
  const { notifyServiceRequest } = useNotifications();
  const { subscribeToServiceRequests, subscribeToOrders } = useRealtime();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [splitBillModal, setSplitBillModal] = useState<{ visible: boolean; order: Order | null }>({ visible: false, order: null });
  const [splitPeople, setSplitPeople] = useState<string>('2');
  const { width } = useWindowDimensions();
  const previousServiceRequestsRef = useRef<any[]>([]);
  
  const isPhone = width < 768;

  const ordersQuery = trpc.orders.getAll.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const serviceRequestsQuery = trpc.serviceRequests.getAll.useQuery(undefined, {
    refetchInterval: 3000,
  });

  const updateOrderMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      ordersQuery.refetch();
      Alert.alert('Success', 'Order status updated');
    },
    onError: (error) => {
      console.error('[Waiter] Order update error:', error);
      Alert.alert('Error', error.message || 'Failed to update order');
    },
  });

  const updateServiceRequestMutation = trpc.serviceRequests.updateStatus.useMutation({
    onSuccess: () => {
      serviceRequestsQuery.refetch();
      Alert.alert('Success', 'Request resolved');
    },
    onError: (error) => {
      console.error('[Waiter] Service request update error:', error);
      Alert.alert('Error', error.message || 'Failed to resolve request');
    },
  });

  useEffect(() => {
    const unsubscribeRequests = subscribeToServiceRequests(() => {
      console.log('[Waiter] Real-time service request update');
      serviceRequestsQuery.refetch();
    });

    const unsubscribeOrders = subscribeToOrders(() => {
      console.log('[Waiter] Real-time order update');
      ordersQuery.refetch();
    });
    
    return () => {
      unsubscribeRequests();
      unsubscribeOrders();
    };
  }, [subscribeToServiceRequests, subscribeToOrders, serviceRequestsQuery, ordersQuery]);

  const orders = useMemo(() => {
    if (!ordersQuery.data) return [];
    
    return ordersQuery.data.map((o: any): Order => {
      const orderItems = o.order_items || [];
      const items = orderItems.map((item: any) => {
        const menuItem = item.menu_items || item.menu_item;
        if (!menuItem) return null;
        
        return {
          quantity: item.quantity,
          menuItem: {
            name: menuItem.name || menuItem.name_kurdish,
            price: menuItem.price,
          },
        };
      }).filter((item: any): item is Order['items'][0] => item !== null);
      
      return {
        id: o.id,
        tableNumber: o.table_number,
        status: o.status as OrderStatus,
        total: o.total_amount,
        createdAt: new Date(o.created_at),
        waiterName: o.waiter_name || undefined,
        items,
      };
    });
  }, [ordersQuery.data]);

  const serviceRequests = useMemo(() => {
    if (!serviceRequestsQuery.data) return [];
    
    return serviceRequestsQuery.data.map((r: any): ServiceRequest => ({
      id: r.id,
      tableNumber: r.table_number,
      type: r.type,
      status: r.status,
      createdAt: new Date(r.created_at),
    }));
  }, [serviceRequestsQuery.data]);

  useEffect(() => {
    const pendingRequests = serviceRequests.filter(r => r.status === 'pending');
    const previousPendingRequests = previousServiceRequestsRef.current.filter((r: any) => r.status === 'pending');
    
    if (pendingRequests.length > previousPendingRequests.length) {
      const newRequests = pendingRequests.filter(nr => 
        !previousPendingRequests.some((pr: any) => pr.id === nr.id)
      );
      
      newRequests.forEach(request => {
        console.log(`🔔 SERVICE REQUEST: Table ${request.tableNumber} - ${request.type}`);
        notifyServiceRequest(request.tableNumber, request.type);
        
        if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Service Request! 🔔', {
            body: `Table ${request.tableNumber} needs ${request.type}`,
            icon: '/assets/images/icon.png',
          });
        }
      });
    }
    
    previousServiceRequestsRef.current = serviceRequests;
  }, [serviceRequests, notifyServiceRequest]);

  const filteredOrders = useMemo(() => {
    if (selectedFilter === 'all') return orders;
    if (selectedFilter === 'active') {
      return orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    }
    return orders.filter(o => o.status === 'completed');
  }, [orders, selectedFilter]);

  const ordersByTable = useMemo(() => {
    const grouped: Record<number, Order[]> = {};
    filteredOrders.forEach(order => {
      if (!grouped[order.tableNumber]) {
        grouped[order.tableNumber] = [];
      }
      grouped[order.tableNumber].push(order);
    });
    return grouped;
  }, [filteredOrders]);

  const tableNumbers = useMemo(() => 
    Object.keys(ordersByTable).map(Number).sort((a, b) => a - b),
    [ordersByTable]
  );

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return '#3B82F6';
      case 'preparing': return '#F59E0B';
      case 'ready': return '#10B981';
      case 'served': return '#8B5CF6';
      case 'completed': return '#6B7280';
      default: return '#8E8E93';
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    return t(status as keyof typeof t) || status;
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000 / 60);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  };

  const handleMarkPaid = async (orderId: string) => {
    try {
      await updateOrderMutation.mutateAsync({
        id: orderId,
        status: 'completed',
      });
    } catch (error) {
      console.error('Error marking order as paid:', error);
    }
  };

  const handleServeOrder = async (orderId: string) => {
    try {
      await updateOrderMutation.mutateAsync({
        id: orderId,
        status: 'served',
      });
    } catch (error) {
      console.error('Error marking order as served:', error);
    }
  };

  const handleResolveServiceRequest = async (requestId: string) => {
    try {
      await updateServiceRequestMutation.mutateAsync({
        id: requestId,
        status: 'completed',
      });
    } catch (error) {
      console.error('Error resolving service request:', error);
    }
  };

  const handleSplitBill = (order: Order) => {
    setSplitBillModal({ visible: true, order });
    setSplitPeople('2');
  };

  const calculateSplitAmount = (total: number, people: number) => {
    return (total / people).toFixed(2);
  };

  const pendingServiceRequests = useMemo(() => 
    serviceRequests.filter(r => r.status === 'pending' || r.status === 'in-progress'),
    [serviceRequests]
  );

  const readyOrders = useMemo(() => 
    orders.filter(o => o.status === 'ready'),
    [orders]
  );

  const renderOrder = (order: Order) => {
    const canMarkPaid = order.status === 'served';
    const canServe = order.status === 'ready';
    
    return (
      <POSCard key={order.id} style={{ marginBottom: 12 }}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
            <View>
              <Text style={styles.orderNumber}>#{order.id.slice(0, 8)}</Text>
              <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusBadgeText}>{getStatusLabel(order.status)}</Text>
          </View>
        </View>

        {order.waiterName && (
          <Text style={styles.waiterName}>Waiter: {order.waiterName}</Text>
        )}

        <View style={styles.orderItems}>
          {order.items.map((item, index) => (
            <View key={index} style={styles.orderItem}>
              <Text style={styles.orderItemQuantity}>{item.quantity}x</Text>
              <Text style={styles.orderItemName}>{item.menuItem.name}</Text>
              <Text style={styles.orderItemPrice}>
                {formatPrice(item.menuItem.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.orderFooter}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalAmount}>{formatPrice(order.total)}</Text>
          </View>
          {canServe && (
            <POSButton
              variant="success"
              title="Mark as Served"
              onPress={() => handleServeOrder(order.id)}
              loading={updateOrderMutation.isPending}
              style={{ marginTop: 8 }}
            />
          )}
          {canMarkPaid && (
            <View style={styles.orderActions}>
              <POSButton
                variant="secondary"
                title="Split Bill"
                onPress={() => handleSplitBill(order)}
                icon={<Users size={16} color="#2563EB" />}
                style={{ flex: 1 }}
              />
              <POSButton
                variant="success"
                title="Mark as Paid"
                onPress={() => handleMarkPaid(order.id)}
                loading={updateOrderMutation.isPending}
                icon={<DollarSign size={16} color="#fff" />}
                style={{ flex: 1 }}
              />
            </View>
          )}
        </View>
      </POSCard>
    );
  };

  if (ordersQuery.isLoading || serviceRequestsQuery.isLoading) {
    return (
      <POSContainer>
        <Stack.Screen options={{ 
          title: 'Waiter Dashboard',
          headerStyle: { backgroundColor: '#2563EB' },
          headerTintColor: '#fff',
          headerShadowVisible: false,
        }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </POSContainer>
    );
  }

  return (
    <POSContainer>
      <Stack.Screen options={{ 
        title: 'Waiter Dashboard',
        headerStyle: { backgroundColor: '#2563EB' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }} />

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Waiter Dashboard</Text>
          <Text style={styles.headerSubtitle}>{orders.filter(o => o.status !== 'completed').length} active tables</Text>
        </View>
      </View>

      {(pendingServiceRequests.length > 0 || readyOrders.length > 0) && (
        <View style={styles.alertsSection}>
          {readyOrders.length > 0 && (
            <View style={styles.readyNotification}>
              <Text style={styles.readyNotificationText}>
                ✅ {readyOrders.length} order{readyOrders.length > 1 ? 's' : ''} ready to serve!
              </Text>
            </View>
          )}
          {pendingServiceRequests.map(request => (
            <View key={request.id} style={styles.serviceRequestAlert}>
              <View style={styles.serviceRequestHeader}>
                {request.type === 'bill' ? <Receipt size={20} color="#F59E0B" /> : <Bell size={20} color="#F59E0B" />}
                <Text style={styles.serviceRequestText}>
                  Table {request.tableNumber} - {request.type === 'bill' ? 'Bill Request' : 'Waiter Call'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.resolveButton}
                onPress={() => handleResolveServiceRequest(request.id)}
                disabled={updateServiceRequestMutation.isPending}
              >
                {updateServiceRequestMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.resolveButtonText}>Resolved</Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'active' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('active')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'active' && styles.filterButtonTextActive,
          ]}>
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'all' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('all')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'all' && styles.filterButtonTextActive,
          ]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'completed' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('completed')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'completed' && styles.filterButtonTextActive,
          ]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {tableNumbers.length === 0 ? (
          <View style={styles.emptyState}>
            <ClipboardList size={64} color="#8E8E93" />
            <Text style={styles.emptyStateTitle}>No Orders</Text>
            <Text style={styles.emptyStateText}>
              Orders will appear here
            </Text>
          </View>
        ) : (
          <View style={[styles.tablesContainer, !isPhone && styles.tablesContainerTablet]}>
            {tableNumbers.map(tableNumber => (
              <View key={tableNumber} style={[styles.tableSection, !isPhone && styles.tableSectionTablet]}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Table {tableNumber}</Text>
                  <View style={styles.tableHeaderBadge}>
                    <Text style={styles.tableHeaderBadgeText}>
                      {ordersByTable[tableNumber].length} order{ordersByTable[tableNumber].length !== 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.tableOrders}>
                  {ordersByTable[tableNumber].map(renderOrder)}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={splitBillModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setSplitBillModal({ visible: false, order: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Split Bill</Text>
              <TouchableOpacity onPress={() => setSplitBillModal({ visible: false, order: null })}>
                <X size={24} color="#1C1C1E" />
              </TouchableOpacity>
            </View>

            {splitBillModal.order && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Order #{splitBillModal.order.id.slice(0, 8)}</Text>
                <Text style={styles.modalTotalLabel}>Total: {formatPrice(splitBillModal.order.total)}</Text>

                <Text style={styles.modalLabel}>Split among how many people?</Text>
                <TextInput
                  style={styles.splitInput}
                  keyboardType="number-pad"
                  value={splitPeople}
                  onChangeText={setSplitPeople}
                  placeholder="Number of people"
                  placeholderTextColor="#8E8E93"
                />

                {parseInt(splitPeople) > 0 && (
                  <View style={styles.splitResult}>
                    <Text style={styles.splitResultLabel}>Amount per person:</Text>
                    <Text style={styles.splitResultAmount}>
                      {formatPrice(parseFloat(calculateSplitAmount(splitBillModal.order.total, parseInt(splitPeople))))}
                    </Text>
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <POSButton
                    variant="secondary"
                    title="Cancel"
                    onPress={() => setSplitBillModal({ visible: false, order: null })}
                    style={{ flex: 1 }}
                  />
                  <POSButton
                    variant="primary"
                    title="Confirm"
                    onPress={() => {
                      const people = parseInt(splitPeople);
                      if (people > 0) {
                        const amountPerPerson = calculateSplitAmount(splitBillModal.order!.total, people);
                        Alert.alert(
                          'Bill Split',
                          `Total: ${formatPrice(splitBillModal.order!.total)}\nPeople: ${people}\nPer Person: ${formatPrice(parseFloat(amountPerPerson))}`,
                          [{ text: 'OK' }]
                        );
                        setSplitBillModal({ visible: false, order: null });
                      }
                    }}
                    style={{ flex: 1 }}
                  />
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </POSContainer>
  );
}

const styles = StyleSheet.create({
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
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  filterBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#2563EB',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1C1C1E',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
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
  tablesContainer: {
    padding: 16,
    ...Platform.select({
      web: {
        maxWidth: 1600,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
  },
  tablesContainerTablet: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 16,
    justifyContent: 'space-evenly' as const,
  },
  tableSection: {
    marginBottom: 24,
  },
  tableSectionTablet: {
    flex: 1,
    minWidth: 320,
    maxWidth: 550,
    marginBottom: 0,
  },
  tableOrders: {
    gap: 12,
    marginTop: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tableHeaderText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1C1C1E',
  },
  tableHeaderBadge: {
    backgroundColor: '#F5F5F7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tableHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#1C1C1E',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  orderNumber: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1C1C1E',
  },
  orderTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#fff',
    textTransform: 'capitalize' as const,
  },
  waiterName: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 12,
  },
  orderItems: {
    gap: 8,
    marginBottom: 12,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  orderItemQuantity: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#2563EB',
    minWidth: 30,
  },
  orderItemName: {
    fontSize: 14,
    color: '#1C1C1E',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1C1C1E',
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    paddingTop: 12,
    gap: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1C1C1E',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#2563EB',
  },
  orderActions: {
    flexDirection: 'row' as const,
    gap: 8,
    marginTop: 8,
  },
  alertsSection: {
    padding: 12,
    gap: 8,
    backgroundColor: '#F5F5F7',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  serviceRequestAlert: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  serviceRequestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  serviceRequestText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1C1C1E',
    flex: 1,
  },
  resolveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resolveButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: '#1C1C1E',
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1C1C1E',
  },
  modalTotalLabel: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: '#2563EB',
    marginBottom: 8,
  },
  splitInput: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1C1C1E',
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  splitResult: {
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  splitResultLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#8E8E93',
  },
  splitResultAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: '#2563EB',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  readyNotification: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  readyNotificationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
});
