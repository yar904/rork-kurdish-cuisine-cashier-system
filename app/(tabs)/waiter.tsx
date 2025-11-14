import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform, Alert, TextInput, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { formatPrice } from '@/constants/currency';
import { ClipboardList, DollarSign, Users, X, Bell, Receipt } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { Order, OrderStatus } from '@/types/restaurant';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { useNotifications } from '@/contexts/NotificationContext';



export default function ManagerScreen() {
  const { t } = useLanguage();
  const { notifyServiceRequest } = useNotifications();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [splitBillModal, setSplitBillModal] = useState<{ visible: boolean; order: Order | null }>({ visible: false, order: null });
  const [splitPeople, setSplitPeople] = useState<string>('2');
  const { width } = useWindowDimensions();
  const previousServiceRequestsRef = useRef<any[]>([]);
  
  const isPhone = width < 768;
  const isTablet = width >= 768 && width < 1200;
  const isDesktop = width >= 1200;

  const ordersQuery = trpc.orders.getAll.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const serviceRequestsQuery = trpc.serviceRequests.getAll.useQuery(undefined, {
    refetchInterval: 3000,
  });

  const updateOrderMutation = trpc.orders.updateStatus.useMutation({
    onSuccess: () => {
      ordersQuery.refetch();
    },
  });

  const updateServiceRequestMutation = trpc.serviceRequests.updateStatus.useMutation({
    onSuccess: () => {
      serviceRequestsQuery.refetch();
    },
  });

  const orders = ordersQuery.data || [];
  const serviceRequests = serviceRequestsQuery.data || [];

  useEffect(() => {
    const pendingRequests = serviceRequests.filter(r => r.status === 'pending');
    const previousPendingRequests = previousServiceRequestsRef.current.filter(r => r.status === 'pending');
    
    if (pendingRequests.length > previousPendingRequests.length) {
      const newRequests = pendingRequests.filter(nr => 
        !previousPendingRequests.some(pr => pr.id === nr.id)
      );
      
      newRequests.forEach(request => {
        console.log(`🔔 SERVICE REQUEST: Table ${request.tableNumber} - ${request.requestType}`);
        notifyServiceRequest(request.tableNumber, request.requestType);
        
        if (Platform.OS === 'web' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Service Request! 🔔', {
            body: `Table ${request.tableNumber} needs ${request.requestType}`,
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
      return orders.filter(o => o.status !== 'paid');
    }
    return orders.filter(o => o.status === 'paid');
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
      case 'new': return Colors.statusNew;
      case 'preparing': return Colors.statusPreparing;
      case 'ready': return Colors.statusReady;
      case 'served': return Colors.statusServed;
      case 'paid': return Colors.statusPaid;
      default: return Colors.textLight;
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    return t(status as keyof typeof t);
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
        orderId,
        status: 'paid',
      });
      Alert.alert('Success', 'Order marked as paid');
    } catch (error) {
      console.error('Error marking order as paid:', error);
      Alert.alert('Error', 'Failed to mark order as paid');
    }
  };

  const handleServeOrder = async (orderId: string) => {
    try {
      await updateOrderMutation.mutateAsync({
        orderId,
        status: 'served',
      });
      Alert.alert('Success', 'Order marked as served');
    } catch (error) {
      console.error('Error marking order as served:', error);
      Alert.alert('Error', 'Failed to mark order as served');
    }
  };

  const handleResolveServiceRequest = async (requestId: string) => {
    try {
      await updateServiceRequestMutation.mutateAsync({
        requestId,
        status: 'resolved',
      });
      Alert.alert('Success', 'Service request resolved');
    } catch (error) {
      console.error('Error resolving service request:', error);
      Alert.alert('Error', 'Failed to resolve service request');
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
      <View key={order.id} style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View style={styles.orderHeaderLeft}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(order.status) }]} />
            <View>
              <Text style={styles.orderNumber}>{order.id}</Text>
              <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusBadgeText}>{getStatusLabel(order.status)}</Text>
          </View>
        </View>

        {order.waiterName && (
          <Text style={styles.waiterName}>پێشخزمەتکار / {t('waiter')}: {order.waiterName}</Text>
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
            <Text style={styles.totalLabel}>کۆی گشتی / {t('total')}:</Text>
            <Text style={styles.totalAmount}>{formatPrice(order.total)}</Text>
          </View>
          {canServe && (
            <TouchableOpacity
              style={styles.serveButton}
              onPress={() => handleServeOrder(order.id)}
            >
              <ClipboardList size={16} color="#fff" />
              <Text style={styles.paidButtonText}>پێشکەش کراوە / Mark as Served</Text>
            </TouchableOpacity>
          )}
          {canMarkPaid && (
            <View style={styles.orderActions}>
              <TouchableOpacity
                style={styles.splitButton}
                onPress={() => handleSplitBill(order)}
              >
                <Users size={16} color={Colors.primary} />
                <Text style={styles.splitButtonText}>دابەشکردنی حیساب / Split Bill</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.paidButton}
                onPress={() => handleMarkPaid(order.id)}
              >
                <DollarSign size={16} color="#fff" />
                <Text style={styles.paidButtonText}>دراوە / {t('markAsPaid')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: `${t('restaurantName')} - پێشخزمەتکار / Waiter`,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
      }} />

      {(pendingServiceRequests.length > 0 || readyOrders.length > 0) && (
        <View style={styles.alertsSection}>
          {readyOrders.length > 0 && (
            <View style={styles.readyNotification}>
              <Text style={styles.readyNotificationText}>
                ✅ {readyOrders.length} داواکاری / order{readyOrders.length > 1 ? 's' : ''} ئامادەیە / ready to serve!
              </Text>
            </View>
          )}
          {pendingServiceRequests.map(request => (
            <View key={request.id} style={styles.serviceRequestAlert}>
              <View style={styles.serviceRequestHeader}>
                <Bell size={20} color={Colors.warning} />
                <Text style={styles.serviceRequestText}>
                  میز / Table {request.tableNumber} - {request.requestType === 'bill' ? '💵 داواکاری حیساب / Bill Request' : '👤 بانگهێشتی پێشخزمەتکار / Waiter Call'}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.resolveButton}
                onPress={() => handleResolveServiceRequest(request.id)}
              >
                <Text style={styles.resolveButtonText}>چارەسەرکراوە / Resolved</Text>
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
            چالاک / {t('activeOrders')}
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
            هەموو / {t('allOrders')}
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
            تەواو / {t('completed')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {tableNumbers.length === 0 ? (
          <View style={styles.emptyState}>
            <ClipboardList size={64} color={Colors.textLight} />
            <Text style={styles.emptyStateTitle}>هیچ داواکارییەک نییە / {t('noOrders')}</Text>
            <Text style={styles.emptyStateText}>
              داواکارییەکان لێرە دەردەکەون / {t('ordersWillAppear')}
            </Text>
          </View>
        ) : (
          <View style={[styles.tablesContainer, !isPhone && styles.tablesContainerTablet]}>
            {tableNumbers.map(tableNumber => (
              <View key={tableNumber} style={[styles.tableSection, !isPhone && styles.tableSectionTablet]}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>میز / {t('table')} {tableNumber}</Text>
                  <View style={styles.tableHeaderBadge}>
                    <Text style={styles.tableHeaderBadgeText}>
                      {ordersByTable[tableNumber].length} داواکاری / {ordersByTable[tableNumber].length === 1 ? t('order') : t('orders')}
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
              <Text style={styles.modalTitle}>دابەشکردنی حیساب / Split Bill</Text>
              <TouchableOpacity onPress={() => setSplitBillModal({ visible: false, order: null })}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {splitBillModal.order && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>داواکاری / Order #{splitBillModal.order.id}</Text>
                <Text style={styles.modalTotalLabel}>کۆی گشتی / Total: {formatPrice(splitBillModal.order.total)}</Text>

                <Text style={styles.modalLabel}>دابەش بکە بۆ چەند کەس؟ / Split among how many people?</Text>
                <TextInput
                  style={styles.splitInput}
                  keyboardType="number-pad"
                  value={splitPeople}
                  onChangeText={setSplitPeople}
                  placeholder="ژمارەی کەسەکان / Number of people"
                  placeholderTextColor={Colors.textLight}
                />

                {parseInt(splitPeople) > 0 && (
                  <View style={styles.splitResult}>
                    <Text style={styles.splitResultLabel}>بڕی هەر کەسێک / Amount per person:</Text>
                    <Text style={styles.splitResultAmount}>
                      {formatPrice(parseFloat(calculateSplitAmount(splitBillModal.order.total, parseInt(splitPeople))))}
                    </Text>
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setSplitBillModal({ visible: false, order: null })}
                  >
                    <Text style={styles.modalCancelButtonText}>پاشگەزبوونەوە / Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmButton}
                    onPress={() => {
                      const people = parseInt(splitPeople);
                      if (people > 0) {
                        const amountPerPerson = calculateSplitAmount(splitBillModal.order!.total, people);
                        Alert.alert(
                          'دابەشکردنی حیساب / Bill Split',
                          `کۆی گشتی / Total: ${formatPrice(splitBillModal.order!.total)}\nکەسەکان / People: ${people}\nهەر کەسێک / Per Person: ${formatPrice(parseFloat(amountPerPerson))}`,
                          [{ text: 'OK' }]
                        );
                        setSplitBillModal({ visible: false, order: null });
                      }
                    }}
                  >
                    <Text style={styles.modalConfirmButtonText}>پەسەندکردن / Confirm</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: Colors.backgroundGray,
  },
  filterBar: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.backgroundGray,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
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
    color: Colors.text,
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    color: Colors.text,
  },
  tableHeaderBadge: {
    backgroundColor: Colors.cream,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tableHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  orderCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
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
    color: Colors.text,
  },
  orderTime: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    color: Colors.textSecondary,
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
    color: Colors.primary,
    minWidth: 30,
  },
  orderItemName: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  orderFooter: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  orderActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  splitButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  splitButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  paidButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.success,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  paidButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  serveButton: {
    flexDirection: 'row',
    backgroundColor: Colors.statusReady,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  alertsSection: {
    padding: 12,
    gap: 8,
    backgroundColor: Colors.backgroundGray,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  serviceRequestAlert: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.warning,
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
    color: Colors.text,
    flex: 1,
  },
  resolveButton: {
    backgroundColor: Colors.success,
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
    backgroundColor: Colors.background,
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
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalTotalLabel: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.primary,
    marginBottom: 8,
  },
  splitInput: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  splitResult: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  splitResultLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  splitResultAmount: {
    fontSize: 32,
    fontWeight: '800' as const,
    color: Colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.backgroundGray,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalConfirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  readyNotification: {
    backgroundColor: Colors.success,
    padding: 16,
    margin: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: Colors.success,
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
