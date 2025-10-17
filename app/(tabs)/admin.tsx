import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, Alert, Share } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { Settings, QrCode, Printer, Users, Table as TableIcon, CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTables } from '@/contexts/TableContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { Colors } from '@/constants/colors';
import { TableStatus } from '@/types/restaurant';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;

export default function AdminScreen() {
  const { t } = useLanguage();
  const { tables, updateTableStatus } = useTables();
  const { orders } = useRestaurant();
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const previousOrderCount = useRef(orders.length);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    const newOrders = orders.filter(o => o.status === 'new');
    if (orders.length > previousOrderCount.current) {
      const diff = orders.length - previousOrderCount.current;
      setNewOrdersCount(prev => prev + diff);
      
      setTimeout(() => {
        setNewOrdersCount(0);
      }, 5000);
    }
    previousOrderCount.current = orders.length;
  }, [orders]);

  const getTableStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available': return Colors.success;
      case 'occupied': return Colors.error;
      case 'reserved': return Colors.warning;
      case 'needs-cleaning': return Colors.info;
      default: return Colors.textLight;
    }
  };

  const getTableStatusIcon = (status: TableStatus) => {
    switch (status) {
      case 'available': return CheckCircle;
      case 'occupied': return Users;
      case 'reserved': return Clock;
      case 'needs-cleaning': return XCircle;
      default: return TableIcon;
    }
  };

  const handleGenerateQR = async (tableNumber: number) => {
    const menuUrl = `${window.location.origin}/menu?table=${tableNumber}`;
    const qrMessage = `QR Code for Table ${tableNumber}:\n${menuUrl}\n\nCustomers can scan this to view the menu.`;
    
    try {
      await Share.share({
        message: qrMessage,
        title: `Table ${tableNumber} QR Code`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const handlePrintOrders = (tableNumber: number) => {
    const tableOrders = orders.filter(o => o.tableNumber === tableNumber);
    if (tableOrders.length === 0) {
      Alert.alert(t('noOrders'), 'No orders for this table');
      return;
    }

    let receipt = `\n${'='.repeat(40)}\n`;
    receipt += `   ${t('restaurantName').toUpperCase()}\n`;
    receipt += `${'='.repeat(40)}\n\n`;
    receipt += `Table: ${tableNumber}\n`;
    receipt += `Date: ${new Date().toLocaleDateString()}\n`;
    receipt += `Time: ${new Date().toLocaleTimeString()}\n`;
    receipt += `${'-'.repeat(40)}\n\n`;

    tableOrders.forEach((order, idx) => {
      receipt += `Order #${idx + 1} - ${order.id}\n`;
      receipt += `Status: ${order.status}\n`;
      receipt += `Waiter: ${order.waiterName || 'N/A'}\n\n`;
      
      order.items.forEach(item => {
        receipt += `${item.quantity}x ${item.menuItem.name}\n`;
        receipt += `   $${item.menuItem.price.toFixed(2)} each\n`;
        receipt += `   Subtotal: $${(item.menuItem.price * item.quantity).toFixed(2)}\n`;
        if (item.notes) {
          receipt += `   Note: ${item.notes}\n`;
        }
      });
      receipt += `\nOrder Total: $${order.total.toFixed(2)}\n`;
      receipt += `${'-'.repeat(40)}\n\n`;
    });

    const grandTotal = tableOrders.reduce((sum, o) => sum + o.total, 0);
    receipt += `\nGRAND TOTAL: $${grandTotal.toFixed(2)}\n`;
    receipt += `${'='.repeat(40)}\n\n`;
    receipt += `Thank you for dining with us!\n`;
    receipt += `شكراً لزيارتكم - سوپاس\n\n`;

    Alert.alert('Receipt', receipt, [
      { text: 'Close', style: 'cancel' },
      { 
        text: 'Share',
        onPress: async () => {
          try {
            await Share.share({ message: receipt });
          } catch (error) {
            console.log('Share error:', error);
          }
        }
      }
    ]);
  };

  const handleTableStatusChange = (tableNumber: number) => {
    const table = tables.find(t => t.number === tableNumber);
    if (!table) return;

    const statusOptions: TableStatus[] = ['available', 'occupied', 'reserved', 'needs-cleaning'];
    const currentIndex = statusOptions.indexOf(table.status);
    const nextStatus = statusOptions[(currentIndex + 1) % statusOptions.length];
    
    updateTableStatus(tableNumber, nextStatus);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: `${t('restaurantName')} - Admin`,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerRight: () => newOrdersCount > 0 ? (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{newOrdersCount} New</Text>
          </View>
        ) : null,
      }} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {newOrdersCount > 0 && (
          <View style={styles.newOrderAlert}>
            <Text style={styles.newOrderAlertText}>
              {newOrdersCount} new {newOrdersCount === 1 ? 'order' : 'orders'} received!
            </Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TableIcon size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Table Management</Text>
          </View>

          <View style={styles.tableGrid}>
            {tables.map(table => {
              const StatusIcon = getTableStatusIcon(table.status);
              const tableOrders = orders.filter(o => o.tableNumber === table.number && o.status !== 'paid');
              
              return (
                <TouchableOpacity
                  key={table.number}
                  style={[
                    styles.tableCard,
                    selectedTable === table.number && styles.tableCardSelected,
                    isTablet && styles.tableCardTablet,
                  ]}
                  onPress={() => setSelectedTable(selectedTable === table.number ? null : table.number)}
                  onLongPress={() => handleTableStatusChange(table.number)}
                >
                  <View style={[styles.tableStatus, { backgroundColor: getTableStatusColor(table.status) }]}>
                    <StatusIcon size={16} color="#fff" />
                  </View>
                  
                  <View style={styles.tableInfo}>
                    <Text style={styles.tableNumber}>Table {table.number}</Text>
                    <Text style={styles.tableCapacity}>Seats: {table.capacity}</Text>
                    <Text style={[styles.tableStatusText, { color: getTableStatusColor(table.status) }]}>
                      {table.status.replace('-', ' ').toUpperCase()}
                    </Text>
                    {tableOrders.length > 0 && (
                      <Text style={styles.tableOrders}>
                        {tableOrders.length} active {tableOrders.length === 1 ? 'order' : 'orders'}
                      </Text>
                    )}
                  </View>

                  {selectedTable === table.number && (
                    <View style={styles.tableActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleGenerateQR(table.number)}
                      >
                        <QrCode size={20} color={Colors.primary} />
                        <Text style={styles.actionButtonText}>QR Code</Text>
                      </TouchableOpacity>
                      
                      {tableOrders.length > 0 && (
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handlePrintOrders(table.number)}
                        >
                          <Printer size={20} color={Colors.primary} />
                          <Text style={styles.actionButtonText}>Receipt</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Settings size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                tables.forEach(t => {
                  if (t.status === 'needs-cleaning') {
                    updateTableStatus(t.number, 'available');
                  }
                });
                Alert.alert('Success', 'All tables marked as cleaned');
              }}
            >
              <CheckCircle size={32} color={Colors.success} />
              <Text style={styles.quickActionTitle}>Clean All Tables</Text>
              <Text style={styles.quickActionSubtitle}>
                {tables.filter(t => t.status === 'needs-cleaning').length} tables need cleaning
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => {
                const qrList = tables.map(t => 
                  `Table ${t.number}: ${window.location.origin}/menu?table=${t.number}`
                ).join('\n\n');
                
                Alert.alert('All QR Codes', qrList, [
                  { text: 'Close', style: 'cancel' },
                  {
                    text: 'Share All',
                    onPress: async () => {
                      try {
                        await Share.share({ message: qrList });
                      } catch (error) {
                        console.log('Share error:', error);
                      }
                    }
                  }
                ]);
              }}
            >
              <QrCode size={32} color={Colors.info} />
              <Text style={styles.quickActionTitle}>Generate All QR Codes</Text>
              <Text style={styles.quickActionSubtitle}>For all {tables.length} tables</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Table Status Legend:</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.success }]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.error }]} />
              <Text style={styles.legendText}>Occupied</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.warning }]} />
              <Text style={styles.legendText}>Reserved</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Colors.info }]} />
              <Text style={styles.legendText}>Needs Cleaning</Text>
            </View>
          </View>
          <Text style={styles.legendHint}>Long press on table to change status</Text>
        </View>
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
  contentContainer: {
    padding: 16,
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
    fontSize: isTablet ? 24 : 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  tableCard: {
    flexBasis: isTablet ? '23%' : '47%',
    minWidth: 160,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tableCardTablet: {
    minWidth: 200,
  },
  tableCardSelected: {
    borderColor: Colors.primary,
    borderWidth: 3,
  },
  tableStatus: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableInfo: {
    gap: 4,
  },
  tableNumber: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  tableCapacity: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  tableStatusText: {
    fontSize: 12,
    fontWeight: '700' as const,
    marginTop: 4,
  },
  tableOrders: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  tableActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  quickActions: {
    flexDirection: isTablet ? 'row' : 'column',
    gap: 16,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  legend: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  legendHint: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic' as const,
    marginTop: 12,
  },
  headerBadge: {
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 16,
  },
  headerBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  newOrderAlert: {
    backgroundColor: Colors.success,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: Colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  newOrderAlertText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
});
