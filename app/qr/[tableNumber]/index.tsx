import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { Text } from '@/components/CustomText';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ShoppingCart, X, HandHeart, Receipt } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useNotifications } from '@/contexts/NotificationContext';
import { MenuGrid } from '@/components/qr/MenuGrid';
import { CategoryTabs } from '@/components/qr/CategoryTabs';
import { Cart } from '@/components/qr/Cart';
import { QRSuccess } from '@/components/qr/QRSuccess';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

export default function QROrderingPage() {
  const { tableNumber } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string>('');

  const menuQuery = trpc.menu.getAll.useQuery();
  const createOrderMutation = trpc.orders.create.useMutation();
  const addItemMutation = trpc.orders.addItem.useMutation();
  const { publish } = useNotifications();

  const categories = useMemo(() => {
    if (!menuQuery.data) return ['All'];
    const cats = Array.from(new Set(menuQuery.data.map((item: any) => item.category)));
    return ['All', ...cats];
  }, [menuQuery.data]);

  const filteredMenuItems = useMemo(() => {
    if (!menuQuery.data) return [];
    if (selectedCategory === 'All') return menuQuery.data;
    return menuQuery.data.filter((item: any) => item.category === selectedCategory);
  }, [menuQuery.data, selectedCategory]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleAddToCart = (menuItem: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.menuItemId === menuItem.id);
      if (existing) {
        return prev.map((item) =>
          item.menuItemId === menuItem.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [
          ...prev,
          {
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
          },
        ];
      }
    });
  };

  const handleUpdateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.menuItemId === menuItemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const handleRemoveItem = (menuItemId: string) => {
    setCart((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  };

  const handleCheckout = async () => {
    try {
      const tableNum = parseInt(String(tableNumber), 10);
      if (isNaN(tableNum)) {
        console.error('Invalid table number');
        return;
      }

      const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const taxAmount = totalAmount * 0.1;
      const finalTotal = totalAmount + taxAmount;

      const order = await createOrderMutation.mutateAsync({
        tableNumber: tableNum,
        items: cart.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          notes: item.notes,
        })),
        total: finalTotal,
      });

      setPlacedOrderId(order.id);
      setOrderPlaced(true);
      setCart([]);
      setCartModalVisible(false);
    } catch (error) {
      console.error('Failed to place order:', error);
    }
  };

  const handleServiceRequest = async (requestType: 'help' | 'other' = 'help') => {
    try {
      const tableNum = parseInt(String(tableNumber), 10);
      if (isNaN(tableNum)) {
        console.error('Invalid table number');
        return;
      }

      await publish(tableNum, requestType);

      if (Platform.OS === 'web') {
        alert('Request sent successfully');
      } else {
        Alert.alert('Success', 'Request sent successfully');
      }
    } catch (error) {
      console.error('Failed to send service request:', error);
      if (Platform.OS === 'web') {
        alert('Failed to send request');
      } else {
        Alert.alert('Error', 'Failed to send request');
      }
    }
  };

  if (orderPlaced) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <QRSuccess
          tableNumber={parseInt(String(tableNumber), 10)}
          orderId={placedOrderId}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: `Table ${tableNumber}`,
          headerStyle: { backgroundColor: '#5C0000' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />

      <CategoryTabs
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />

      {menuQuery.isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5C0000" />
        </View>
      )}

      {!menuQuery.isLoading && filteredMenuItems.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No items available</Text>
        </View>
      )}

      {!menuQuery.isLoading && filteredMenuItems.length > 0 && (
        <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
          <MenuGrid
            items={filteredMenuItems.map((item: any) => ({
              id: item.id,
              name: item.name,
              description: item.description || '',
              price: item.price,
              image: item.image,
              available: item.available,
            }))}
            onItemPress={handleAddToCart}
          />
        </ScrollView>
      )}

      <View style={[styles.floatingActions, { bottom: insets.bottom + 20 }]}>
        <TouchableOpacity
          style={styles.serviceButton}
          onPress={() => handleServiceRequest('help')}
          activeOpacity={0.8}
        >
          <HandHeart size={22} color="#5C0000" />
          <Text style={styles.serviceButtonText}>Call Waiter</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.serviceButton}
          onPress={() => handleServiceRequest('other')}
          activeOpacity={0.8}
        >
          <Receipt size={22} color="#5C0000" />
          <Text style={styles.serviceButtonText}>Notify Staff</Text>
        </TouchableOpacity>

        {cartCount > 0 && (
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => setCartModalVisible(true)}
            activeOpacity={0.9}
          >
            <ShoppingCart size={24} color="#FFFFFF" />
            <Text style={styles.cartButtonText}>View Cart</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={cartModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCartModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Cart</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setCartModalVisible(false)}
              >
                <X size={24} color="#3A3A3A" />
              </TouchableOpacity>
            </View>

            <Cart
              items={cart}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onCheckout={handleCheckout}
              isLoading={createOrderMutation.isPending}
            />
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  menuContainer: {
    flex: 1,
    paddingBottom: 100,
  },
  floatingActions: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  serviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#5C0000',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      },
    }),
  },
  serviceButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#5C0000',
  },
  cartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#5C0000',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      },
    }),
  },
  cartButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  cartBadge: {
    backgroundColor: '#C6A667',
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#F6EEDD',
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
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
});
