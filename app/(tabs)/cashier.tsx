import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import { Stack } from 'expo-router';
import { formatPrice } from '@/constants/currency';
import { ShoppingCart, Plus, Minus, Trash2, Send, Bell, Receipt, Printer } from 'lucide-react-native';
import { MENU_ITEMS } from '@/constants/menu';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { printOrderReceipt } from '@/lib/printer';

type OrderItem = {
  id: string;
  name: string;
  nameKurdish: string;
  price: number;
  quantity: number;
  image?: string;
};

export default function CashierScreen() {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [waiterName, setWaiterName] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('appetizers');

  const categories = [
    'appetizers', 'soups', 'kebabs', 'rice-dishes', 
    'stews', 'breads', 'desserts', 'drinks'
  ];

  const categoryLabels: Record<string, string> = {
    appetizers: 'APPETIZERS',
    soups: 'SOUPS',
    kebabs: 'KEBABS',
    'rice-dishes': 'RICE DISHES',
    stews: 'STEWS',
    breads: 'BREADS',
    desserts: 'DESSERTS',
    drinks: 'DRINKS'
  };

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      Alert.alert('✅ Success', 'Order submitted successfully');
      setOrderItems([]);
      setWaiterName('');
    },
    onError: (error) => {
      console.error('[Cashier] Order error:', error);
      Alert.alert('❌ Error', error.message);
    },
  });

  const createServiceRequestMutation = trpc.serviceRequests.create.useMutation({
    onSuccess: (data, variables) => {
      console.log('[Cashier] Service request created:', data);
      Alert.alert('✅ Success', 
        variables.type === 'waiter' ? 'Waiter called' : 'Bill requested'
      );
    },
    onError: (error) => {
      console.error('[Cashier] Service request error:', error);
      Alert.alert('❌ Error', error.message);
    },
  });

  const addItem = (itemId: string) => {
    const menuItem = MENU_ITEMS.find(item => item.id === itemId);
    if (!menuItem) return;

    const existingItem = orderItems.find(item => item.id === itemId);
    
    if (existingItem) {
      setOrderItems(orderItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        id: menuItem.id,
        name: menuItem.name,
        nameKurdish: menuItem.nameKurdish,
        price: menuItem.price,
        quantity: 1,
        image: menuItem.image,
      }]);
    }
  };

  const handlePrintReceipt = async () => {
    if (orderItems.length === 0) {
      Alert.alert('Error', 'No items to print');
      return;
    }

    const mockOrder = {
      id: `ORD-${Date.now()}`,
      tableNumber: selectedTable || 0,
      waiterName: waiterName || undefined,
      total: calculateTotal(),
      createdAt: new Date().toISOString(),
      items: orderItems.map(item => ({
        menuItem: {
          name: item.name,
          nameKurdish: item.nameKurdish,
          price: item.price,
        },
        quantity: item.quantity,
        notes: undefined,
      })),
    };

    try {
      await printOrderReceipt(mockOrder as any, {
        name: 'Kurdish Cuisine Cashier',
        address: 'Your Restaurant Address',
        phone: '+964 XXX XXX XXXX',
      });
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Print Error', 'Failed to print receipt');
    }
  };

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setOrderItems(orderItems.filter(item => item.id !== itemId));
    } else {
      setOrderItems(orderItems.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const removeItem = (itemId: string) => {
    setOrderItems(orderItems.filter(item => item.id !== itemId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const handleSubmitOrder = () => {
    if (!selectedTable) {
      Alert.alert('Error', 'Please select a table');
      return;
    }

    if (orderItems.length === 0) {
      Alert.alert('Error', 'Please add items to order');
      return;
    }

    const orderData = {
      tableNumber: selectedTable,
      waiterName: waiterName || undefined,
      totalAmount: calculateTotal(),
      items: orderItems.map(item => ({
        menuItemId: item.id,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    console.log('[Cashier] Submitting order:', orderData);
    createOrderMutation.mutate(orderData);
  };

  const handleCallWaiter = () => {
    if (!selectedTable) {
      Alert.alert('Error', 'Please select a table');
      return;
    }

    console.log('[Cashier] Calling waiter for table:', selectedTable);
    createServiceRequestMutation.mutate({
      tableNumber: selectedTable,
      type: 'waiter',
      notes: 'Waiter requested from cashier',
    });
  };

  const handleRequestBill = () => {
    if (!selectedTable) {
      Alert.alert('Error', 'Please select a table');
      return;
    }

    console.log('[Cashier] Requesting bill for table:', selectedTable);
    createServiceRequestMutation.mutate({
      tableNumber: selectedTable,
      type: 'bill',
      notes: 'Bill requested from cashier',
    });
  };

  const filteredMenuItems = MENU_ITEMS.filter(
    item => item.category === selectedCategory && item.available
  );

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'کاشێر / Cashier',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }} 
      />

      <View style={styles.content}>
        <View style={styles.menuSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive
                ]}>
                  {categoryLabels[category] || category.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.menuScroll}>
            <View style={styles.menuGrid}>
              {filteredMenuItems.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.menuItem}
                  onPress={() => addItem(item.id)}
                >
                  {item.image && (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.menuItemImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.menuItemInfo}>
                    <Text style={styles.menuItemName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.menuItemNameKurdish} numberOfLines={1}>{item.nameKurdish}</Text>
                    <Text style={styles.menuItemPrice}>{formatPrice(item.price)}</Text>
                  </View>
                  <TouchableOpacity style={styles.addButton} onPress={() => addItem(item.id)}>
                    <Plus size={18} color="#fff" />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.orderSection}>
          <View style={styles.orderHeader}>
            <ShoppingCart size={20} color={Colors.primary} />
            <Text style={styles.orderTitle}>داواکاری / Order</Text>
          </View>

          <View style={styles.tableSelector}>
            <Text style={styles.label}>مێز / Table:</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tableButtons}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(table => (
                <TouchableOpacity
                  key={table}
                  style={[
                    styles.tableButton,
                    selectedTable === table && styles.tableButtonActive
                  ]}
                  onPress={() => setSelectedTable(table)}
                >
                  <Text style={[
                    styles.tableButtonText,
                    selectedTable === table && styles.tableButtonTextActive
                  ]}>
                    {table}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TextInput
            style={styles.input}
            placeholder="ناوی گارسۆن / Waiter Name (Optional)"
            value={waiterName}
            onChangeText={setWaiterName}
            placeholderTextColor="#999"
          />

          <ScrollView style={styles.orderList}>
            {orderItems.length === 0 ? (
              <View style={styles.emptyOrder}>
                <Text style={styles.emptyText}>No items</Text>
              </View>
            ) : (
              orderItems.map(item => (
                <View key={item.id} style={styles.orderItem}>
                  <View style={styles.orderItemInfo}>
                    <Text style={styles.orderItemName}>{item.name}</Text>
                    <Text style={styles.orderItemPrice}>
                      {formatPrice(item.price * item.quantity)}
                    </Text>
                  </View>
                  <View style={styles.orderItemControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeItem(item.id)}
                    >
                      <Trash2 size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>کۆی گشتی / Total:</Text>
              <Text style={styles.totalAmount}>{formatPrice(calculateTotal())}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCallWaiter}
                disabled={createServiceRequestMutation.isPending}
              >
                {createServiceRequestMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Bell size={16} color={Colors.primary} />
                    <Text style={styles.actionButtonText}>Call Waiter</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleRequestBill}
                disabled={createServiceRequestMutation.isPending}
              >
                {createServiceRequestMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Receipt size={16} color={Colors.primary} />
                    <Text style={styles.actionButtonText}>Request Bill</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePrintReceipt}
                disabled={orderItems.length === 0}
              >
                <Printer size={16} color={orderItems.length > 0 ? Colors.primary : '#C7C7CC'} />
                <Text style={[styles.actionButtonText, orderItems.length === 0 && styles.actionButtonTextDisabled]}>Print</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (orderItems.length === 0 || createOrderMutation.isPending) && 
                styles.submitButtonDisabled
              ]}
              onPress={handleSubmitOrder}
              disabled={orderItems.length === 0 || createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Send size={20} color="#fff" />
                  <Text style={styles.submitButtonText}>Submit Order</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    flexDirection: 'row',
  },
  menuSection: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  categoryScroll: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categoryScrollContent: {
    padding: 12,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  menuScroll: {
    flex: 1,
  },
  menuGrid: {
    padding: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
  },
  menuItem: {
    width: '31%',
    minWidth: 160,
    maxWidth: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  menuItemImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#F2F2F7',
  },
  menuItemInfo: {
    padding: 10,
  },
  menuItemName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#1C1C1E',
    marginBottom: 2,
  },
  menuItemNameKurdish: {
    fontSize: 11,
    color: '#8E8E93',
    marginBottom: 6,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  addButton: {
    position: 'absolute' as const,
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  orderSection: {
    width: 380,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E5EA',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FAFAFA',
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1C1C1E',
  },
  tableSelector: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#8E8E93',
    marginBottom: 8,
  },
  tableButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tableButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  tableButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tableButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#3A3A3C',
  },
  tableButtonTextActive: {
    color: '#fff',
  },
  input: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F2F2F7',
    fontSize: 13,
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  orderList: {
    flex: 1,
    padding: 12,
  },
  emptyOrder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#C7C7CC',
  },
  orderItem: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  orderItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#1C1C1E',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  orderItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1C1C1E',
    minWidth: 28,
    textAlign: 'center' as const,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto' as const,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#fff',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#8E8E93',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#1C1C1E',
  },
  actionButtonTextDisabled: {
    color: '#C7C7CC',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
