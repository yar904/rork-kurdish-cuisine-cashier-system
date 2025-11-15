import React, { useState, useEffect, useMemo } from 'react';
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
  Image,
  Modal
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import { formatPrice } from '@/constants/currency';
import { ShoppingCart, Plus, Minus, Trash2, Send, Bell, Receipt, Printer, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';
import { printOrderReceipt } from '@/lib/printer';
import { useRealtime } from '@/contexts/RealtimeContext';

type OrderItem = {
  id: string;
  name: string;
  nameKurdish: string;
  price: number;
  quantity: number;
  image?: string;
};

const CATEGORIES = [
  'appetizers', 'soups', 'salads', 'kebabs', 'rice-dishes', 
  'stews', 'seafood', 'breads', 'desserts', 'drinks', 'shisha', 'hot-drinks'
];

const CATEGORY_LABELS: Record<string, string> = {
  appetizers: 'APPETIZERS',
  soups: 'SOUPS',
  salads: 'SALADS',
  kebabs: 'KEBABS',
  'rice-dishes': 'RICE DISHES',
  stews: 'STEWS',
  seafood: 'SEAFOOD',
  breads: 'BREADS',
  desserts: 'DESSERTS',
  drinks: 'COLD DRINKS',
  shisha: 'SHISHA',
  'hot-drinks': 'HOT DRINKS'
};

export default function CashierScreen() {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [waiterName, setWaiterName] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('appetizers');
  const [customItemModal, setCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [customItemQuantity, setCustomItemQuantity] = useState('1');
  const [customItemImage, setCustomItemImage] = useState<string | undefined>(undefined);
  
  const { subscribeToOrders } = useRealtime();

  const menuQuery = trpc.menu.getAll.useQuery(undefined, {
    refetchInterval: 10000,
  });

  useEffect(() => {
    const unsubscribe = subscribeToOrders(() => {
      console.log('[Cashier] Real-time menu update');
      menuQuery.refetch();
    });
    return unsubscribe;
  }, [subscribeToOrders, menuQuery]);

  const createOrderMutation = trpc.orders.create.useMutation({
    onSuccess: () => {
      Alert.alert('✅ Success', 'Order submitted successfully');
      setOrderItems([]);
      setWaiterName('');
    },
    onError: (error) => {
      console.error('[Cashier] Order error:', error);
      Alert.alert('❌ Error', error.message || 'Failed to submit order');
    },
  });

  const createServiceRequestMutation = trpc.serviceRequests.create.useMutation({
    onSuccess: (data) => {
      console.log('[Cashier] Service request created:', data);
      Alert.alert('✅ Success', 'Request sent successfully');
    },
    onError: (error) => {
      console.error('[Cashier] Service request error:', error);
      Alert.alert('❌ Error', error.message || 'Failed to send request');
    },
  });

  const menuItems = useMemo(() => {
    if (!menuQuery.data) return [];
    console.log('[Cashier] Raw menu data:', menuQuery.data);
    return menuQuery.data.map((item: any) => {
      const menuItem = {
        id: item.id,
        name: item.name || item.name_kurdish,
        nameKurdish: item.name_kurdish,
        category: item.category,
        price: item.price,
        image: item.image,
        available: item.available !== false,
      };
      console.log('[Cashier] Mapped menu item:', menuItem);
      return menuItem;
    });
  }, [menuQuery.data]);

  const addItem = (itemId: string) => {
    const menuItem = menuItems.find(item => item.id === itemId);
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

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions are required to add images');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as any,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      setCustomItemImage(result.assets[0].uri);
    }
  };

  const handleAddCustomItem = () => {
    console.log('[Cashier] Adding custom item:', { customItemName, customItemPrice, customItemQuantity });

    if (!customItemName.trim()) {
      Alert.alert('خطا / Error', 'تکایە ناوی خواردن بنووسە / Please enter item name');
      return;
    }
    
    const price = parseFloat(customItemPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('خطا / Error', 'تکایە نرخێکی دروست بنووسە / Please enter valid price (numbers only)');
      return;
    }
    
    const quantity = parseInt(customItemQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('خطا / Error', 'تکایە ژمارەیەکی دروست بنووسە / Please enter valid quantity');
      return;
    }

    const customId = `custom-${Date.now()}`;
    const newItem = {
      id: customId,
      name: customItemName,
      nameKurdish: customItemName,
      price: price,
      quantity: quantity,
      image: customItemImage,
    };

    console.log('[Cashier] Custom item created:', newItem);
    setOrderItems([...orderItems, newItem]);

    setCustomItemModal(false);
    setCustomItemName('');
    setCustomItemPrice('');
    setCustomItemQuantity('1');
    setCustomItemImage(undefined);

    Alert.alert('✅ سەرکەوتوو / Success', `${customItemName} زیادکرا / added to order`);
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
        menuItemId: item.id.startsWith('custom-') ? '35' : item.id,
        quantity: item.quantity,
        price: item.price,
        notes: item.id.startsWith('custom-') ? `Custom: ${item.name}` : undefined,
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

  const filteredMenuItems = useMemo(() => {
    const filtered = menuItems.filter(
      item => item.category === selectedCategory && item.available
    );
    console.log('[Cashier] Selected category:', selectedCategory);
    console.log('[Cashier] Filtered items:', filtered.length);
    return filtered;
  }, [menuItems, selectedCategory]);

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
            {CATEGORIES.map(category => (
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
                  {CATEGORY_LABELS[category] || category.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {menuQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Loading menu...</Text>
            </View>
          ) : (
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
          )}
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
                  <View style={styles.orderItemRow}>
                    {item.image && (
                      <Image
                        source={{ uri: item.image }}
                        style={styles.orderItemImage}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemName} numberOfLines={2}>{item.name}</Text>
                      <Text style={styles.orderItemPrice}>
                        {formatPrice(item.price * item.quantity)}
                      </Text>
                    </View>
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
                onPress={() => setCustomItemModal(true)}
              >
                <Plus size={16} color={Colors.primary} />
                <Text style={styles.actionButtonText}>Add Custom</Text>
              </TouchableOpacity>

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

      <Modal
        visible={customItemModal}
        transparent
        animationType="slide"
        onRequestClose={() => setCustomItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>زیادکردنی خواردنی تایبەت / Add Custom Item</Text>
              <TouchableOpacity onPress={() => setCustomItemModal(false)}>
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>وێنە / Image (Optional)</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={handlePickImage}
              >
                {customItemImage ? (
                  <Image
                    source={{ uri: customItemImage }}
                    style={styles.customItemPreviewImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.imagePickerPlaceholder}>
                    <Plus size={32} color="#C7C7CC" />
                    <Text style={styles.imagePickerText}>وێنەیەک هەڵبژێرە / Select Image</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.inputLabel}>ناو / Name</Text>
              <TextInput
                style={styles.modalInput}
                value={customItemName}
                onChangeText={setCustomItemName}
                placeholder="e.g., Special Request"
                placeholderTextColor="#999999"
              />

              <Text style={styles.inputLabel}>نرخ / Price (IQD)</Text>
              <TextInput
                style={styles.modalInput}
                value={customItemPrice}
                onChangeText={setCustomItemPrice}
                placeholder="23456"
                keyboardType="numeric"
                placeholderTextColor="#999999"
              />

              <Text style={styles.inputLabel}>ژمارە / Quantity</Text>
              <TextInput
                style={styles.modalInput}
                value={customItemQuantity}
                onChangeText={setCustomItemQuantity}
                placeholder="1"
                keyboardType="numeric"
                placeholderTextColor="#999999"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => {
                    console.log('[Cashier] Cancel custom item');
                    setCustomItemModal(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalCancelButtonText}>پاشگەزبوونەوە / Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={() => {
                    console.log('[Cashier] Add button pressed');
                    handleAddCustomItem();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalConfirmButtonText}>زیادکردن / Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  menuSection: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  categoryScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  categoryScrollContent: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#4A0000',
    borderWidth: 1,
    borderColor: '#4A0000',
  },
  categoryButtonActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  categoryButtonText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  categoryButtonTextActive: {
    color: '#1a0000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#333333',
  },
  menuScroll: {
    flex: 1,
  },
  menuGrid: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuItem: {
    width: '31%',
    minWidth: 160,
    maxWidth: 220,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 8,
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
    backgroundColor: '#F5F5F7',
  },
  menuItemInfo: {
    padding: 10,
  },
  menuItemName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#000000',
    marginBottom: 2,
  },
  menuItemNameKurdish: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 6,
  },
  menuItemPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gold,
    marginBottom: 4,
  },
  addButton: {
    position: 'absolute' as const,
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.gold,
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
    backgroundColor: '#F5F5F7',
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
    backgroundColor: '#FFFFFF',
  },
  orderTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#000000',
  },
  tableSelector: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666666',
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
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E5EA',
  },
  tableButtonActive: {
    backgroundColor: Colors.gold,
    borderColor: Colors.gold,
  },
  tableButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#000000',
  },
  tableButtonTextActive: {
    color: '#1a0000',
  },
  input: {
    marginHorizontal: 12,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    fontSize: 13,
    color: '#000000',
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
    color: '#999999',
  },
  orderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  orderItemRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  orderItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
  },
  orderItemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  orderItemName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#000000',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.gold,
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
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#000000',
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
    backgroundColor: '#F5F5F7',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#666666',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.gold,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: '#000000',
  },
  actionButtonTextDisabled: {
    color: '#C7C7CC',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.gold,
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
    color: '#1a0000',
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
    fontSize: 18,
    fontWeight: '800' as const,
    color: '#000000',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666666',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#F5F5F7',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#000000',
  },
  modalConfirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  modalConfirmButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1a0000',
  },
  imagePickerButton: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    borderStyle: 'dashed' as const,
    overflow: 'hidden',
    backgroundColor: '#F5F5F7',
  },
  imagePickerPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePickerText: {
    fontSize: 13,
    color: '#666666',
    fontWeight: '600' as const,
  },
  customItemPreviewImage: {
    width: '100%',
    height: '100%',
  },
});
