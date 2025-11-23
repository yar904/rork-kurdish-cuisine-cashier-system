import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Text } from '@/components/CustomText';
import { X, Plus, Minus, Trash2, CheckCircle2 } from 'lucide-react-native';
import { AddItemModal } from './AddItemModal';

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  notes?: string | null;
  menu_item?: {
    name: string;
    price: number;
  };
}

interface Order {
  id: string;
  table_number: number;
  status: string;
  total: number;
  order_items: OrderItem[];
}

interface TableDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  tableNumber: number;
  tableStatus: string;
  order: Order | null;
  isLoading: boolean;
  onUpdateStatus: (status: string) => void;
  onUpdateItemQty: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onRefreshOrder: () => void;
}

export function TableDetailsModal({
  visible,
  onClose,
  tableNumber,
  tableStatus,
  order,
  isLoading,
  onUpdateStatus,
  onUpdateItemQty,
  onRemoveItem,
  onRefreshOrder,
}: TableDetailsModalProps) {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addItemModalVisible, setAddItemModalVisible] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied':
        return '#10B981';
      case 'available':
        return '#8E8E93';
      case 'reserved':
        return '#3B82F6';
      case 'needs-cleaning':
        return '#F59E0B';
      default:
        return '#8E8E93';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'occupied':
        return 'Occupied';
      case 'available':
        return 'Available';
      case 'reserved':
        return 'Reserved';
      case 'needs-cleaning':
        return 'Needs Cleaning';
      default:
        return status;
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    await onUpdateStatus(newStatus);
    setUpdatingStatus(false);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Table {tableNumber}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tableStatus) }]}>
                <Text style={styles.statusText}>{getStatusLabel(tableStatus)}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#3A3A3A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Change Status</Text>
              <View style={styles.statusButtons}>
                {['available', 'occupied', 'reserved', 'needs-cleaning'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusButton,
                      tableStatus === status && styles.statusButtonActive,
                      { borderColor: getStatusColor(status) },
                    ]}
                    onPress={() => handleStatusChange(status)}
                    disabled={updatingStatus}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        tableStatus === status && { color: '#FFFFFF' },
                        { color: getStatusColor(status) },
                      ]}
                    >
                      {getStatusLabel(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#5C0000" />
              </View>
            ) : order ? (
              <View style={styles.section}>
                <View style={styles.orderHeader}>
                  <Text style={styles.sectionTitle}>Active Order</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setAddItemModalVisible(true)}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.addButtonText}>Add Items</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.orderItems}>
                  {order.order_items.map((item) => (
                    <View key={item.id} style={styles.orderItem}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.menu_item?.name || 'Unknown Item'}</Text>
                        <Text style={styles.itemPrice}>
                          IQD {((item.menu_item?.price || 0) * item.quantity).toLocaleString()}
                        </Text>
                      </View>

                      <View style={styles.itemActions}>
                        <TouchableOpacity
                          style={styles.qtyButton}
                          onPress={() => onUpdateItemQty(item.id, item.quantity - 1)}
                        >
                          <Minus size={16} color="#5C0000" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyButton}
                          onPress={() => onUpdateItemQty(item.id, item.quantity + 1)}
                        >
                          <Plus size={16} color="#5C0000" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => onRemoveItem(item.id)}
                        >
                          <Trash2 size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.orderTotal}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalAmount}>IQD {order.total.toLocaleString()}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.emptyOrder}>
                <CheckCircle2 size={48} color="#8E8E93" />
                <Text style={styles.emptyText}>No active order</Text>
                <TouchableOpacity
                  style={styles.createOrderButton}
                  onPress={() => setAddItemModalVisible(true)}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.createOrderText}>Create Order</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {order && (
        <AddItemModal
          visible={addItemModalVisible}
          onClose={() => setAddItemModalVisible(false)}
          orderId={order.id}
          onItemAdded={() => {
            setAddItemModalVisible(false);
            onRefreshOrder();
          }}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  statusButtonActive: {
    backgroundColor: '#5C0000',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#5C0000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  orderItems: {
    gap: 12,
    marginBottom: 16,
  },
  orderItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
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
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  emptyOrder: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  createOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#5C0000',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  createOrderText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
});
