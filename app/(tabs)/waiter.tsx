import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, Alert, TextInput, Modal } from 'react-native';
import { Stack } from 'expo-router';
import { formatPrice } from '@/constants/currency';
import { ClipboardList, DollarSign, Users, X } from 'lucide-react-native';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Order, OrderStatus } from '@/types/restaurant';
import { Colors } from '@/constants/colors';

const getResponsiveLayout = () => {
  const { width } = Dimensions.get('window');
  return {
    isPhone: width < 768,
    isTablet: width >= 768 && width < 1200,
    isDesktop: width >= 1200,
    columns: width < 768 ? 1 : width < 1200 ? 2 : 3,
    width,
  };
};

export default function WaiterScreen() {
  const { orders, updateOrderStatus, readyNotification } = useRestaurant();
  const { t } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'completed'>('active');
  const [splitBillModal, setSplitBillModal] = useState<{ visible: boolean; order: Order | null }>({ visible: false, order: null });
  const [splitPeople, setSplitPeople] = useState<string>('2');
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

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

  const handleMarkPaid = (orderId: string) => {
    updateOrderStatus(orderId, 'paid');
  };

  const handleSplitBill = (order: Order) => {
    setSplitBillModal({ visible: true, order });
    setSplitPeople('2');
  };

  const calculateSplitAmount = (total: number, people: number) => {
    return (total / people).toFixed(2);
  };

  const renderOrder = (order: Order) => {
    const canMarkPaid = order.status === 'served';
    
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
          <Text style={styles.waiterName}>{t('waiter')}: {order.waiterName}</Text>
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
            <Text style={styles.totalLabel}>{t('total')}:</Text>
            <Text style={styles.totalAmount}>{formatPrice(order.total)}</Text>
          </View>
          {canMarkPaid && (
            <View style={styles.orderActions}>
              <TouchableOpacity
                style={styles.splitButton}
                onPress={() => handleSplitBill(order)}
              >
                <Users size={16} color={Colors.primary} />
                <Text style={styles.splitButtonText}>Split Bill</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.paidButton}
                onPress={() => handleMarkPaid(order.id)}
              >
                <DollarSign size={16} color="#fff" />
                <Text style={styles.paidButtonText}>{t('markAsPaid')}</Text>
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
        title: `${t('restaurantName')} - ${t('waiter')}`,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
      }} />

      {readyNotification && (() => {
        const readyOrder = orders.find(o => o.id === readyNotification);
        if (readyOrder) {
          return (
            <View style={styles.readyNotification}>
              <Text style={styles.readyNotificationText}>
                Order {readyOrder.id} for Table {readyOrder.tableNumber} is READY for serving!
              </Text>
            </View>
          );
        }
        return null;
      })()}

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, selectedFilter === 'active' && styles.filterButtonActive]}
          onPress={() => setSelectedFilter('active')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'active' && styles.filterButtonTextActive,
          ]}>
            {t('activeOrders')}
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
            {t('allOrders')}
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
            {t('completed')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {tableNumbers.length === 0 ? (
          <View style={styles.emptyState}>
            <ClipboardList size={64} color={Colors.textLight} />
            <Text style={styles.emptyStateTitle}>{t('noOrders')}</Text>
            <Text style={styles.emptyStateText}>
              {t('ordersWillAppear')}
            </Text>
          </View>
        ) : (
          <View style={[styles.tablesContainer, dimensions.width >= 768 && styles.tablesContainerTablet]}>
            {tableNumbers.map(tableNumber => (
              <View key={tableNumber} style={[styles.tableSection, dimensions.width >= 768 && styles.tableSectionTablet]}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>{t('table')} {tableNumber}</Text>
                  <View style={styles.tableHeaderBadge}>
                    <Text style={styles.tableHeaderBadgeText}>
                      {ordersByTable[tableNumber].length} {ordersByTable[tableNumber].length === 1 ? t('order') : t('orders')}
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
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {splitBillModal.order && (
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Order #{splitBillModal.order.id}</Text>
                <Text style={styles.modalTotalLabel}>Total: {formatPrice(splitBillModal.order.total)}</Text>

                <Text style={styles.modalLabel}>Split among how many people?</Text>
                <TextInput
                  style={styles.splitInput}
                  keyboardType="number-pad"
                  value={splitPeople}
                  onChangeText={setSplitPeople}
                  placeholder="Number of people"
                  placeholderTextColor={Colors.textLight}
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
                  <TouchableOpacity
                    style={styles.modalCancelButton}
                    onPress={() => setSplitBillModal({ visible: false, order: null })}
                  >
                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalConfirmButton}
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
                  >
                    <Text style={styles.modalConfirmButtonText}>Confirm</Text>
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tableSection: {
    marginBottom: 24,
  },
  tableSectionTablet: {
    flex: 1,
    minWidth: 300,
    maxWidth: 500,
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
    flexDirection: 'row',
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
