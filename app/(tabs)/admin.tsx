import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Platform, Alert, Share, TextInput } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Stack, useRouter } from 'expo-router';
import { formatPrice } from '@/constants/currency';
import { Settings, QrCode, Printer, Users, Table as TableIcon, CheckCircle, XCircle, Clock, LogOut, Download, FileText, Shield, Eye, EyeOff, MenuSquare, Package, Briefcase } from 'lucide-react-native';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTables } from '@/contexts/TableContext';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useAuth } from '@/contexts/AuthContext';
import { Colors } from '@/constants/colors';
import { TableStatus } from '@/types/restaurant';

const getResponsiveLayout = () => {
  const { width } = Dimensions.get('window');
  return {
    isPhone: width < 768,
    isTablet: width >= 768 && width < 1200,
    isDesktop: width >= 1200,
    width,
  };
};

export default function AdminScreen() {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));
  const router = useRouter();
  const { logout, user } = useAuth();
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: { width: number; height: number; scale: number; fontScale: number } }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);
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
        receipt += `   ${formatPrice(item.menuItem.price)} each\n`;
        receipt += `   Subtotal: ${formatPrice(item.menuItem.price * item.quantity)}\n`;
        if (item.notes) {
          receipt += `   Note: ${item.notes}\n`;
        }
      });
      receipt += `\nOrder Total: ${formatPrice(order.total)}\n`;
      receipt += `${'-'.repeat(40)}\n\n`;
    });

    const grandTotal = tableOrders.reduce((sum, o) => sum + o.total, 0);
    receipt += `\nGRAND TOTAL: ${formatPrice(grandTotal)}\n`;
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

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/landing');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: user.role === 'admin' ? 'Super Admin' : 'Restaurant Manager',
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerRight: () => (
          <View style={styles.headerRight}>
            {newOrdersCount > 0 && (
              <View style={styles.headerBadge}>
                <Text style={styles.headerBadgeText}>{newOrdersCount} New</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <LogOut size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        ),
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
                    dimensions.width >= 768 && styles.tableCardTablet,
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

        {user.role === 'admin' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Settings size={24} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Management</Text>
            </View>

            <View style={styles.managementGrid}>
              <TouchableOpacity
                style={styles.managementCard}
                onPress={() => router.push('/menu-management')}
                activeOpacity={0.7}
              >
                <MenuSquare size={40} color={Colors.primary} />
                <Text style={styles.managementCardTitle}>Menu Items</Text>
                <Text style={styles.managementCardSubtitle}>
                  Add, edit, or remove menu items
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.managementCard}
                onPress={() => router.push('/employees')}
                activeOpacity={0.7}
              >
                <Users size={40} color="#10b981" />
                <Text style={styles.managementCardTitle}>Employees</Text>
                <Text style={styles.managementCardSubtitle}>
                  Manage staff, shifts & clock records
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.managementCard}
                onPress={() => router.push('/inventory')}
                activeOpacity={0.7}
              >
                <Package size={40} color="#f59e0b" />
                <Text style={styles.managementCardTitle}>Inventory</Text>
                <Text style={styles.managementCardSubtitle}>
                  Track stock levels & suppliers
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.managementCard}
                onPress={() => router.push('/table-qr-codes')}
                activeOpacity={0.7}
              >
                <QrCode size={40} color="#8b5cf6" />
                <Text style={styles.managementCardTitle}>QR Self-Order</Text>
                <Text style={styles.managementCardSubtitle}>
                  Customers order from their table
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {user.role === 'admin' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={24} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Access Credentials</Text>
            </View>

            <View style={styles.credentialsContainer}>
              <View style={styles.credentialCard}>
                <View style={styles.credentialHeader}>
                  <Shield size={20} color={Colors.warning} />
                  <Text style={styles.credentialRole}>Super Admin Access</Text>
                  <TouchableOpacity
                    onPress={() => setShowPasswords(!showPasswords)}
                    style={styles.eyeButton}
                  >
                    {showPasswords ? <EyeOff size={18} color={Colors.textSecondary} /> : <Eye size={18} color={Colors.textSecondary} />}
                  </TouchableOpacity>
                </View>
                <View style={styles.credentialContent}>
                  <Text style={styles.credentialLabel}>Password:</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value="farman12"
                      secureTextEntry={!showPasswords}
                      editable={false}
                      selectTextOnFocus
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          navigator.clipboard.writeText('farman12');
                          Alert.alert('Copied', 'Admin password copied to clipboard');
                        } else {
                          Alert.alert('Admin Password', 'farman12');
                        }
                      }}
                      style={styles.copyButton}
                    >
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.credentialDescription}>
                  Full access to all features, reports, and system settings
                </Text>
              </View>

              <View style={styles.credentialCard}>
                <View style={styles.credentialHeader}>
                  <Shield size={20} color={Colors.success} />
                  <Text style={styles.credentialRole}>Manager Access</Text>
                </View>
                <View style={styles.credentialContent}>
                  <Text style={styles.credentialLabel}>Password:</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value="manager99"
                      secureTextEntry={!showPasswords}
                      editable={false}
                      selectTextOnFocus
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          navigator.clipboard.writeText('manager99');
                          Alert.alert('Copied', 'Manager password copied to clipboard');
                        } else {
                          Alert.alert('Manager Password', 'manager99');
                        }
                      }}
                      style={styles.copyButton}
                    >
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.credentialDescription}>
                  Access to Table Management, Reports & QR Codes
                </Text>
              </View>

              <View style={styles.credentialCard}>
                <View style={styles.credentialHeader}>
                  <Users size={20} color={Colors.info} />
                  <Text style={styles.credentialRole}>Staff Access</Text>
                </View>
                <View style={styles.credentialContent}>
                  <Text style={styles.credentialLabel}>Password:</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.passwordInput}
                      value="123tapse"
                      secureTextEntry={!showPasswords}
                      editable={false}
                      selectTextOnFocus
                    />
                    <TouchableOpacity
                      onPress={() => {
                        if (Platform.OS === 'web') {
                          navigator.clipboard.writeText('123tapse');
                          Alert.alert('Copied', 'Staff password copied to clipboard');
                        } else {
                          Alert.alert('Staff Password', '123tapse');
                        }
                      }}
                      style={styles.copyButton}
                    >
                      <Text style={styles.copyButtonText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.credentialDescription}>
                  Access to Kitchen, Cashier, Waiter, and Analytics
                </Text>
              </View>

              <View style={styles.currentUserBadge}>
                <Text style={styles.currentUserText}>
                  <Text style={styles.currentUserText}>
  Currently logged in as: <Text style={styles.currentUserRole}>{user.role === 'admin' ? 'Super Admin' : 'Restaurant Manager'}</Text>
</Text>
                </Text>
                <TouchableOpacity
                  style={styles.logoutButtonInline}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <LogOut size={18} color="#fff" />
                  <Text style={styles.logoutButtonInlineText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {user.role === 'manager' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={24} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Your Access Level</Text>
            </View>

            <View style={styles.credentialsContainer}>
              <View style={styles.managerInfoCard}>
                <Shield size={40} color={Colors.success} />
                <Text style={styles.managerInfoTitle}>Restaurant Manager</Text>
                <Text style={styles.managerInfoDescription}>
                  You have access to table management, QR code generation, order receipts, and reports.
                </Text>
                <View style={styles.managerPermissions}>
                  <View style={styles.permissionItem}>
                    <CheckCircle size={16} color={Colors.success} />
                    <Text style={styles.permissionText}>Table Management</Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <CheckCircle size={16} color={Colors.success} />
                    <Text style={styles.permissionText}>QR Code Generation</Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <CheckCircle size={16} color={Colors.success} />
                    <Text style={styles.permissionText}>Reports & Analytics</Text>
                  </View>
                  <View style={styles.permissionItem}>
                    <CheckCircle size={16} color={Colors.success} />
                    <Text style={styles.permissionText}>Export Data</Text>
                  </View>
                </View>
              </View>

              <View style={styles.currentUserBadge}>
                <Text style={styles.currentUserText}>
                  Currently logged in as: <Text style={styles.currentUserRole}>Restaurant Manager</Text>
                </Text>
                <TouchableOpacity
                  style={styles.logoutButtonInline}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <LogOut size={18} color="#fff" />
                  <Text style={styles.logoutButtonInlineText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText size={24} color={Colors.primary} />
            <Text style={styles.sectionTitle}>Export & Reports</Text>
          </View>

          <View style={[styles.exportGrid, dimensions.width >= 768 && styles.exportGridTablet]}>
            <TouchableOpacity
              style={styles.exportCard}
              onPress={() => {
                router.push('/(tabs)/reports');
              }}
              activeOpacity={0.7}
            >
              <FileText size={32} color={Colors.primary} />
              <Text style={styles.exportCardTitle}>View Reports</Text>
              <Text style={styles.exportCardSubtitle}>Detailed analytics & insights</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportCard}
              onPress={async () => {
                const today = new Date();
                const report = `DAILY REPORT - ${today.toLocaleDateString()}\n${'='.repeat(50)}\n\nTotal Orders: ${orders.length}\nActive Orders: ${orders.filter(o => o.status !== 'paid').length}\nCompleted Orders: ${orders.filter(o => o.status === 'paid').length}\n\nRevenue Summary:\nTotal: ${formatPrice(orders.reduce((sum, o) => sum + o.total, 0))}\nPaid: ${formatPrice(orders.filter(o => o.status === 'paid').reduce((sum, o) => sum + o.total, 0))}\n\nTable Status:\nAvailable: ${tables.filter(t => t.status === 'available').length}\nOccupied: ${tables.filter(t => t.status === 'occupied').length}\nReserved: ${tables.filter(t => t.status === 'reserved').length}\nNeed Cleaning: ${tables.filter(t => t.status === 'needs-cleaning').length}\n\n${'='.repeat(50)}\nGenerated: ${new Date().toLocaleString()}`;
                
                try {
                  await Share.share({ message: report, title: `Daily Report - ${today.toLocaleDateString()}` });
                } catch (error) {
                  Alert.alert('Error', 'Failed to export report');
                }
              }}
              activeOpacity={0.7}
            >
              <Download size={32} color={Colors.success} />
              <Text style={styles.exportCardTitle}>Export Daily Report</Text>
              <Text style={styles.exportCardSubtitle}>Download today's summary</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportCard}
              onPress={async () => {
                const report = `TABLE QR CODES\n${'='.repeat(50)}\n\n` + tables.map(t => 
                  `Table ${t.number}\nCapacity: ${t.capacity} seats\nQR: ${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/menu?table=${t.number}\n`
                ).join('\n') + `\n${'='.repeat(50)}\nGenerated: ${new Date().toLocaleString()}`;
                
                try {
                  await Share.share({ message: report, title: 'Table QR Codes' });
                } catch (error) {
                  Alert.alert('Error', 'Failed to export QR codes');
                }
              }}
              activeOpacity={0.7}
            >
              <QrCode size={32} color={Colors.info} />
              <Text style={styles.exportCardTitle}>Export QR Codes</Text>
              <Text style={styles.exportCardSubtitle}>All tables QR list</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.exportCard}
              onPress={async () => {
                const allOrders = orders.map((order, idx) => {
                  const items = order.items.map(item => 
                    `${item.quantity}x ${item.menuItem.name} - ${formatPrice(item.menuItem.price * item.quantity)}`
                  ).join('\n  ');
                  return `Order #${idx + 1} (${order.id})\nTable: ${order.tableNumber}\nStatus: ${order.status}\nTotal: ${formatPrice(order.total)}\nItems:\n  ${items}\n`;
                }).join('\n' + '-'.repeat(50) + '\n');
                
                const report = `ALL ORDERS\n${'='.repeat(50)}\n${allOrders}\n${'='.repeat(50)}\nTotal Orders: ${orders.length}\nGrand Total: ${formatPrice(orders.reduce((sum, o) => sum + o.total, 0))}\n\nGenerated: ${new Date().toLocaleString()}`;
                
                try {
                  await Share.share({ message: report, title: 'All Orders Report' });
                } catch (error) {
                  Alert.alert('Error', 'Failed to export orders');
                }
              }}
              activeOpacity={0.7}
            >
              <Printer size={32} color={Colors.warning} />
              <Text style={styles.exportCardTitle}>Export All Orders</Text>
              <Text style={styles.exportCardSubtitle}>Complete orders list</Text>
            </TouchableOpacity>
          </View>
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
    ...Platform.select({
      web: {
        maxWidth: 1600,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
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
    fontWeight: '800' as const,
    color: Colors.text,
  },
  tableGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'flex-start',
  },
  tableCard: {
    flexBasis: '47%',
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
    flexBasis: '30%',
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
    fontSize: 20,
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
    flexDirection: 'column',
    gap: 16,
    ...Platform.select({
      web: {
        flexDirection: 'row',
      },
    }),
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 16,
  },
  logoutButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
    gap: 16,
    borderWidth: 1,
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
  userInfo: {
    flex: 1,
    gap: 4,
  },
  userRole: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  userSubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  logoutButtonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.error,
  },
  credentialsContainer: {
    gap: 16,
  },
  credentialCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 20,
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
  credentialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  credentialRole: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    flex: 1,
  },
  eyeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.backgroundGray,
  },
  credentialContent: {
    marginBottom: 12,
  },
  credentialLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  passwordInput: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  copyButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  credentialDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
    lineHeight: 18,
  },
  currentUserBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  currentUserText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  currentUserRole: {
    fontWeight: '800' as const,
    fontSize: 16,
  },
  logoutButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  logoutButtonInlineText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  managerInfoCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    borderWidth: 2,
    borderColor: Colors.success,
    ...Platform.select({
      ios: {
        shadowColor: Colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  managerInfoTitle: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  managerInfoDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 8,
  },
  managerPermissions: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  permissionText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  exportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  exportGridTablet: {
    gap: 20,
  },
  exportCard: {
    flexBasis: '47%',
    minWidth: 160,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
      web: {
        minWidth: 200,
        flexBasis: '48%',
      },
    }),
  },
  exportCardTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  exportCardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    fontWeight: '600' as const,
  },
  menuManagementCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    borderWidth: 3,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  menuManagementTitle: {
    fontSize: 22,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  menuManagementSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  managementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  managementCard: {
    flexBasis: '47%',
    minWidth: 160,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  managementCardTitle: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  managementCardSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    fontWeight: '600' as const,
  },
});
