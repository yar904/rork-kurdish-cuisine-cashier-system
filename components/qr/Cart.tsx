import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Text } from '@/components/CustomText';
import { Minus, Plus, Trash2 } from 'lucide-react-native';

interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (menuItemId: string, quantity: number) => void;
  onRemoveItem: (menuItemId: string) => void;
  onCheckout: () => void;
  isLoading?: boolean;
}

export function Cart({ items, onUpdateQuantity, onRemoveItem, onCheckout, isLoading }: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  if (items.length === 0) {
    return (
      <View style={styles.emptyCart}>
        <Text style={styles.emptyText}>Your cart is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Order</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.menuItemId}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>IQD {(item.price * item.quantity).toLocaleString()}</Text>
            </View>

            <View style={styles.itemActions}>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => onUpdateQuantity(item.menuItemId, item.quantity - 1)}
              >
                <Minus size={16} color="#5C0000" />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                style={styles.qtyButton}
                onPress={() => onUpdateQuantity(item.menuItemId, item.quantity + 1)}
              >
                <Plus size={16} color="#5C0000" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => onRemoveItem(item.menuItemId)}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        style={styles.list}
      />

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>IQD {subtotal.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tax (10%)</Text>
          <Text style={styles.summaryValue}>IQD {tax.toLocaleString()}</Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>IQD {total.toLocaleString()}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.checkoutButton, isLoading && styles.checkoutButtonDisabled]}
        onPress={onCheckout}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        <Text style={styles.checkoutButtonText}>
          {isLoading ? 'Placing Order...' : 'Place Order'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginBottom: 20,
  },
  list: {
    flex: 1,
    marginBottom: 20,
  },
  emptyCart: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  cartItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#3A3A3A',
    flex: 1,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F6EEDD',
  },
  qtyText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    minWidth: 32,
    textAlign: 'center',
  },
  deleteButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    marginLeft: 8,
  },
  summary: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    gap: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3A3A3A',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  checkoutButton: {
    backgroundColor: '#5C0000',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonDisabled: {
    opacity: 0.6,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
