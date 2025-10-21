import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { ChefHat, Clock, ArrowRight } from 'lucide-react-native';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Order, OrderStatus } from '@/types/restaurant';
import { Colors } from '@/constants/colors';



export default function KitchenScreen() {
  const { orders, updateOrderStatus, readyNotification, optimizeKitchenQueue } = useRestaurant();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  
  const isPhone = width < 768;
  const isTablet = width >= 768 && width < 1200;
  const isDesktop = width >= 1200;

  const activeOrders = useMemo(() => {
    const filtered = orders.filter(order => 
      order.status === 'new' || order.status === 'preparing' || order.status === 'ready'
    );
    return optimizeKitchenQueue(filtered);
  }, [orders, optimizeKitchenQueue]);

  const newOrders = useMemo(() => 
    activeOrders.filter(o => o.status === 'new'), 
    [activeOrders]
  );
  
  const preparingOrders = useMemo(() => 
    activeOrders.filter(o => o.status === 'preparing'), 
    [activeOrders]
  );
  
  const readyOrders = useMemo(() => 
    activeOrders.filter(o => o.status === 'ready'), 
    [activeOrders]
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

  const getNextStatus = (status: OrderStatus): OrderStatus | null => {
    switch (status) {
      case 'new': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'served';
      default: return null;
    }
  };

  const getNextStatusLabel = (status: OrderStatus): string => {
    switch (status) {
      case 'new': return t('startPreparing');
      case 'preparing': return t('markReady');
      case 'ready': return t('markServed');
      default: return '';
    }
  };

  const handleStatusUpdate = (orderId: string, currentStatus: OrderStatus) => {
    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus) {
      updateOrderStatus(orderId, nextStatus);
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
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
            <Text style={styles.statusBadgeText}>
              {t(order.status as keyof typeof t).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.orderNumber}>{order.id}</Text>
            <Text style={styles.tableNumber}>{t('table')} {order.tableNumber}</Text>
          </View>
        </View>
        <View style={styles.orderHeaderRight}>
          <Clock size={16} color={Colors.textSecondary} />
          <Text style={styles.orderTime}>{formatTime(order.createdAt)}</Text>
        </View>
      </View>

      {order.waiterName && (
        <Text style={styles.waiterName}>{t('waiter')}: {order.waiterName}</Text>
      )}

      <View style={styles.orderItems}>
        {order.items.map((item, index) => (
          <View key={index} style={styles.orderItem}>
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityBadgeText}>{item.quantity}x</Text>
            </View>
            <View style={styles.orderItemInfo}>
              <Text style={styles.orderItemName}>{item.menuItem.name}</Text>
              <Text style={styles.orderItemKurdish}>{item.menuItem.nameKurdish}</Text>
              {item.notes && (
                <Text style={styles.orderItemNotes}>Note: {item.notes}</Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {getNextStatus(order.status) && (
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: getStatusColor(getNextStatus(order.status)!) }]}
          onPress={() => handleStatusUpdate(order.id, order.status)}
        >
          <Text style={styles.actionButtonText}>
            {getNextStatusLabel(order.status)}
          </Text>
          <ArrowRight size={20} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: `${t('restaurantName')} - ${t('kitchen')}`,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
      }} />
      
      {readyNotification && (() => {
        const readyOrder = orders.find(o => o.id === readyNotification);
        if (readyOrder) {
          return (
            <View style={styles.readyNotification}>
              <Text style={styles.readyNotificationText}>
                Order {readyOrder.id} for Table {readyOrder.tableNumber} is READY!
              </Text>
            </View>
          );
        }
        return null;
      })()}

      <ScrollView style={styles.content}>
        {activeOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <ChefHat size={64} color={Colors.textLight} />
            <Text style={styles.emptyStateTitle}>{t('noActiveOrders')}</Text>
            <Text style={styles.emptyStateText}>
              {t('newOrdersWillAppear')}
            </Text>
          </View>
        ) : (
          <View style={styles.columns}>
            <View style={styles.column}>
              <View style={styles.columnHeader}>
                <View style={[styles.columnHeaderDot, { backgroundColor: Colors.statusNew }]} />
                <Text style={styles.columnHeaderText}>{t('newOrders')}</Text>
                <View style={styles.columnHeaderBadge}>
                  <Text style={styles.columnHeaderBadgeText}>{newOrders.length}</Text>
                </View>
              </View>
              {newOrders.map(renderOrder)}
            </View>

            <View style={styles.column}>
              <View style={styles.columnHeader}>
                <View style={[styles.columnHeaderDot, { backgroundColor: Colors.statusPreparing }]} />
                <Text style={styles.columnHeaderText}>{t('preparing')}</Text>
                <View style={styles.columnHeaderBadge}>
                  <Text style={styles.columnHeaderBadgeText}>{preparingOrders.length}</Text>
                </View>
              </View>
              {preparingOrders.map(renderOrder)}
            </View>

            <View style={styles.column}>
              <View style={styles.columnHeader}>
                <View style={[styles.columnHeaderDot, { backgroundColor: Colors.statusReady }]} />
                <Text style={styles.columnHeaderText}>{t('ready')}</Text>
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
    backgroundColor: Colors.backgroundGray,
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
    backgroundColor: Colors.background,
    borderRadius: 8,
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
  columnHeaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  columnHeaderText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  columnHeaderBadge: {
    backgroundColor: Colors.backgroundGray,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  columnHeaderBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
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
    color: Colors.text,
  },
  tableNumber: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderTime: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    gap: 12,
    padding: 12,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
  },
  quantityBadge: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.primary,
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
    color: Colors.text,
  },
  orderItemKurdish: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  orderItemNotes: {
    fontSize: 12,
    color: Colors.warning,
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
  },
  actionButtonText: {
    fontSize: 14,
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
