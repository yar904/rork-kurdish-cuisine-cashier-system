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
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import { formatPrice } from '@/constants/currency';
import { ShoppingCart, Plus, Minus, Trash2, Send, Bell, Receipt, Printer, X } from 'lucide-react-native';
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
  'appetizers',
  'soups',
  'salads',
  'kebabs',
  'rice-dishes',
  'stews',
  'seafood',
  'breads',
  'desserts',
  'drinks',
  'shisha',
  'hot-drinks',
];

const CATEGORY_LABELS: Record<string, { en: string; ku: string }> = {
  appetizers: { en: 'Appetizers', ku: 'خواردنی پێشوەخت' },
  soups: { en: 'Soups', ku: 'شۆربا' },
  salads: { en: 'Salads', ku: 'زەڵاتە' },
  kebabs: { en: 'Kebabs', ku: 'کەباب' },
  'rice-dishes': { en: 'Rice Dishes', ku: 'خواردنی برنج' },
  stews: { en: 'Stews', ku: 'خۆراک' },
  seafood: { en: 'Seafood', ku: 'ماسی و میگۆ' },
  breads: { en: 'Breads', ku: 'نان' },
  desserts: { en: 'Desserts', ku: 'شیرینی' },
  drinks: { en: 'Cold Drinks', ku: 'خواردنەوەی سارد' },
  shisha: { en: 'Shisha', ku: 'شیشە' },
  'hot-drinks': { en: 'Hot Drinks', ku: 'خواردنەوەی گەرم' },
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
    const menuItem = menuItems.find((item) => item.id === itemId);
    if (!menuItem) return;

    const existingItem = orderItems.find((item) => item.id === itemId);

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          id: menuItem.id,
          name: menuItem.name,
          nameKurdish: menuItem.nameKurdish,
          price: menuItem.price,
          quantity: 1,
          image: menuItem.image,
        },
      ]);
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
    console.log('[Cashier] Adding custom item:', {
      customItemName,
      customItemPrice,
      customItemQuantity,
    });

    if (!customItemName.trim()) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }

    const price = parseFloat(customItemPrice);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter valid price (numbers only)');
      return;
    }

    const quantity = parseInt(customItemQuantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter valid quantity');
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

    Alert.alert('✅ Success', `${customItemName} added to order`);
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
      items: orderItems.map((item) => ({
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
      setOrderItems(orderItems.filter((item) => item.id !== itemId));
    } else {
      setOrderItems(
        orderItems.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item))
      );
    }
  };

  const removeItem = (itemId: string) => {
    setOrderItems(orderItems.filter((item) => item.id !== itemId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
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
      items: orderItems.map((item) => ({
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
      (item) => item.category === selectedCategory && item.available
    );
    console.log('[Cashier] Selected category:', selectedCategory);
    console.log('[Cashier] Filtered items:', filtered.length);
    return filtered;
  }, [menuItems, selectedCategory]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Cashier / کاشێر',
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#1C1C1E',
          headerShadowVisible: false,
        }}
      />

      <View style={styles.content}>
        <View style={styles.categorySection}>
          <Text style={styles.categorySectionTitle}>Categories</Text>
          <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryItem,
                  selectedCategory === category && styles.categoryItemActive,
                ]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.7}
              >
                <View>
                  <Text
                    style={[
                      styles.categoryItemText,
                      selectedCategory === category && styles.categoryItemTextActive,
                    ]}
                  >
                    {CATEGORY_LABELS[category]?.en || category.toUpperCase()}
                  </Text>
                  <Text
                    style={[
                      styles.categoryItemTextKurdish,
                      selectedCategory === category && styles.categoryItemTextActiveKurdish,
                    ]}
                  >
                    {CATEGORY_LABELS[category]?.ku || ''}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.menuSection}>
          {menuQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3d0101" />
              <Text style={styles.loadingText}>Loading menu...</Text>
            </View>
          ) : (
            <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.menuGrid}>
                {filteredMenuItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.menuItem}
                    onPress={() => addItem(item.id)}
                    activeOpacity={0.9}
                  >
                    {item.image && (
                      <Image source={{ uri: item.image }} style={styles.menuItemImage} resizeMode="cover" />
                    )}
                    <View style={styles.menuItemInfo}>
                      <Text style={styles.menuItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.menuItemNameKurdish} numberOfLines={1}>
                        {item.nameKurdish}
                      </Text>
                      <Text style={styles.menuItemPrice}>{formatPrice(item.price)}</Text>
                    </View>
                    <View style={styles.addButton}>
                      <Plus size={18} color="#fff" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        <View style={styles.orderSection}>
          <View style={styles.orderHeader}>
            <ShoppingCart size={20} color="#1C1C1E" />
            <Text style={styles.orderTitle}>Order / داواکاری</Text>
          </View>

          <View style={styles.tableSelector}>
            <Text style={styles.label}>Table / مێز</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tableButtons}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((table) => (
                <TouchableOpacity
                  key={table}
                  style={[styles.tableButton, selectedTable === table && styles.tableButtonActive]}
                  onPress={() => setSelectedTable(table)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tableButtonText,
                      selectedTable === table && styles.tableButtonTextActive,
                    ]}
                  >
                    {table}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Waiter Name (Optional)"
            value={waiterName}
            onChangeText={setWaiterName}
            placeholderTextColor="#999"
          />

          <ScrollView style={styles.orderList} showsVerticalScrollIndicator={false}>
            {orderItems.length === 0 ? (
              <View style={styles.emptyOrder}>
                <Text style={styles.emptyText}>No items</Text>
              </View>
            ) : (
              orderItems.map((item) => (
                <View key={item.id} style={styles.orderItem}>
                  <View style={styles.orderItemRow}>
                    {item.image && (
                      <Image source={{ uri: item.image }} style={styles.orderItemImage} resizeMode="cover" />
                    )}
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.orderItemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.orderItemPrice}>
                        {formatPrice(item.price * item.quantity)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.orderItemControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity - 1)}
                      activeOpacity={0.7}
                    >
                      <Minus size={14} color="#1C1C1E" />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateQuantity(item.id, item.quantity + 1)}
                      activeOpacity={0.7}
                    >
                      <Plus size={14} color="#1C1C1E" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeItem(item.id)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalAmount}>{formatPrice(calculateTotal())}</Text>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setCustomItemModal(true)}
                activeOpacity={0.7}
              >
                <Plus size={16} color="#1C1C1E" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCallWaiter}
                disabled={createServiceRequestMutation.isPending}
                activeOpacity={0.7}
              >
                {createServiceRequestMutation.isPending ? (
                  <ActivityIndicator size="small" color="#1C1C1E" />
                ) : (
                  <Bell size={16} color="#1C1C1E" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleRequestBill}
                disabled={createServiceRequestMutation.isPending}
                activeOpacity={0.7}
              >
                {createServiceRequestMutation.isPending ? (
                  <ActivityIndicator size="small" color="#1C1C1E" />
                ) : (
                  <Receipt size={16} color="#1C1C1E" />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handlePrintReceipt}
                disabled={orderItems.length === 0}
                activeOpacity={0.7}
              >
                <Printer size={16} color={orderItems.length > 0 ? '#1C1C1E' : '#C7C7CC'} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                (orderItems.length === 0 || createOrderMutation.isPending) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitOrder}
              disabled={orderItems.length === 0 || createOrderMutation.isPending}
              activeOpacity={0.8}
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
              <Text style={styles.modalTitle}>Add Custom Item</Text>
              <TouchableOpacity onPress={() => setCustomItemModal(false)} activeOpacity={0.7}>
                <X size={24} color="#000000" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Image (Optional)</Text>
              <TouchableOpacity
                style={styles.imagePickerButton}
                onPress={handlePickImage}
                activeOpacity={0.7}
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
                    <Text style={styles.imagePickerText}>Select Image</Text>
                  </View>
                )}
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.modalInput}
                value={customItemName}
                onChangeText={setCustomItemName}
                placeholder="e.g., Special Request"
                placeholderTextColor="#999999"
              />

              <Text style={styles.inputLabel}>Price (IQD)</Text>
              <TextInput
                style={styles.modalInput}
                value={customItemPrice}
                onChangeText={setCustomItemPrice}
                placeholder="23456"
                keyboardType="numeric"
                placeholderTextColor="#999999"
              />

              <Text style={styles.inputLabel}>Quantity</Text>
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
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={() => {
                    console.log('[Cashier] Add button pressed');
                    handleAddCustomItem();
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.modalConfirmButtonText}>Add</Text>
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
    backgroundColor: '#F5F5F7',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  categorySection: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
  },
  categorySectionTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#8E8E93',
    padding: 16,
    paddingBottom: 8,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  categoryList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  categoryItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: '#F5F5F7',
  },
  categoryItemActive: {
    backgroundColor: '#3d0101',
  },
  categoryItemText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1C1C1E',
    marginBottom: 2,
  },
  categoryItemTextActive: {
    color: '#FFFFFF',
  },
  categoryItemTextKurdish: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: '#8E8E93',
  },
  categoryItemTextActiveKurdish: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  menuSection: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  menuScroll: {
    flex: 1,
  },
  menuGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  menuItem: {
    width: 'calc(50% - 6px)' as any,
    minWidth: 160,
    maxWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      },
    }),
  },
  menuItemImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E5E5EA',
  },
  menuItemInfo: {
    padding: 12,
    paddingBottom: 48,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1C1C1E',
    marginBottom: 2,
  },
  menuItemNameKurdish: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 6,
  },
  menuItemPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#3d0101',
  },
  addButton: {
    position: 'absolute' as const,
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3d0101',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  orderSection: {
    width: 340,
    backgroundColor: '#FFFFFF',
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
  },
  orderTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#1C1C1E',
  },
  tableSelector: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#8E8E93',
    marginBottom: 8,
  },
  tableButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tableButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableButtonActive: {
    backgroundColor: '#3d0101',
  },
  tableButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1C1C1E',
  },
  tableButtonTextActive: {
    color: '#FFFFFF',
  },
  input: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
    fontSize: 14,
    color: '#1C1C1E',
  },
  orderList: {
    flex: 1,
    padding: 16,
  },
  emptyOrder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  orderItem: {
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  orderItemRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  orderItemImage: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#E5E5EA',
  },
  orderItemInfo: {
    flex: 1,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  orderItemPrice: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#3d0101',
  },
  orderItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1C1C1E',
    minWidth: 24,
    textAlign: 'center' as const,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto' as const,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#8E8E93',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#3d0101',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    minHeight: 44,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#3d0101',
    borderRadius: 8,
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
  },
  submitButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
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
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
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
    fontWeight: '700' as const,
    color: '#1C1C1E',
    flex: 1,
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    backgroundColor: '#F5F5F7',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1C1C1E',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  modalCancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#F5F5F7',
    alignItems: 'center',
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#1C1C1E',
  },
  modalConfirmButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    backgroundColor: '#3d0101',
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  imagePickerButton: {
    width: '100%',
    height: 160,
    borderRadius: 8,
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
    color: '#8E8E93',
    fontWeight: '500' as const,
  },
  customItemPreviewImage: {
    width: '100%',
    height: '100%',
  },
});
