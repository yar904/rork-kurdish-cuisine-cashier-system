import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack } from 'expo-router';
import { Package, AlertTriangle, Plus, TrendingUp, TrendingDown, History, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpcClient';

export default function InventoryScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: '',
    movementType: 'purchase' as 'purchase' | 'waste' | 'adjustment' | 'order',
    notes: '',
  });
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    unit: '',
    currentStock: '',
    minimumStock: '',
    costPerUnit: '',
  });

  const inventoryQuery = trpc.inventory.getAll.useQuery();
  const lowStockQuery = trpc.inventory.getLowStock.useQuery();
  const movementsQuery = trpc.inventory.getMovements.useQuery(
    { inventoryItemId: selectedItem?.id },
    { enabled: !!selectedItem && showHistoryModal }
  );

  const createMutation = trpc.inventory.create.useMutation({
    onSuccess: () => {
      inventoryQuery.refetch();
      lowStockQuery.refetch();
      setShowAddModal(false);
      setNewItem({ name: '', category: '', unit: '', currentStock: '', minimumStock: '', costPerUnit: '' });
      Alert.alert('Success', 'Inventory item added');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const adjustStockMutation = trpc.inventory.adjustStock.useMutation({
    onSuccess: () => {
      inventoryQuery.refetch();
      lowStockQuery.refetch();
      movementsQuery.refetch();
      setShowAdjustModal(false);
      setAdjustmentData({ quantity: '', movementType: 'purchase', notes: '' });
      Alert.alert('Success', 'Stock adjusted successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleAddItem = () => {
    if (!newItem.name || !newItem.category || !newItem.unit || !newItem.currentStock || !newItem.minimumStock || !newItem.costPerUnit) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    createMutation.mutate({
      name: newItem.name,
      category: newItem.category,
      unit: newItem.unit,
      currentStock: parseFloat(newItem.currentStock),
      minimumStock: parseFloat(newItem.minimumStock),
      costPerUnit: parseFloat(newItem.costPerUnit),
    });
  };

  const handleAdjustStock = (isAddition: boolean) => {
    if (!adjustmentData.quantity || parseFloat(adjustmentData.quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    const quantity = isAddition ? parseFloat(adjustmentData.quantity) : -parseFloat(adjustmentData.quantity);

    adjustStockMutation.mutate({
      inventoryItemId: selectedItem.id,
      quantity,
      movementType: adjustmentData.movementType,
      notes: adjustmentData.notes || undefined,
    });
  };

  const openAdjustModal = (item: any) => {
    setSelectedItem(item);
    setShowAdjustModal(true);
  };

  const openHistoryModal = (item: any) => {
    setSelectedItem(item);
    setShowHistoryModal(true);
  };

  const displayItems = showLowStock ? lowStockQuery.data : inventoryQuery.data;

  if (inventoryQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen
          options={{
            title: 'Inventory Management',
            headerStyle: { backgroundColor: Colors.primary },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: '700' as const,
            },
          }}
        />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Inventory Management',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700' as const,
          },
        }}
      />

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Inventory</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, !showLowStock && styles.filterButtonActive]}
            onPress={() => setShowLowStock(false)}
          >
            <Text style={[styles.filterText, !showLowStock && styles.filterTextActive]}>
              All Items ({inventoryQuery.data?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, showLowStock && styles.filterButtonActive]}
            onPress={() => setShowLowStock(true)}
          >
            <AlertTriangle size={16} color={showLowStock ? '#fff' : '#ef4444'} />
            <Text style={[styles.filterText, showLowStock && styles.filterTextActive]}>
              Low Stock ({lowStockQuery.data?.length || 0})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
        {displayItems?.map((item) => {
          const isLowStock = item.current_stock < item.minimum_stock;
          const stockPercentage = (item.current_stock / item.minimum_stock) * 100;

          return (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Package size={20} color={Colors.primary} />
                <Text style={styles.itemName}>{item.name}</Text>
                {isLowStock && (
                  <View style={styles.lowStockBadge}>
                    <AlertTriangle size={12} color="#dc2626" />
                  </View>
                )}
              </View>

              <Text style={styles.category}>{item.category}</Text>

              <View style={styles.stockInfo}>
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>Current Stock:</Text>
                  <Text style={[styles.stockValue, isLowStock && styles.lowStockText]}>
                    {item.current_stock} {item.unit}
                  </Text>
                </View>
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>Minimum:</Text>
                  <Text style={styles.stockValue}>{item.minimum_stock} {item.unit}</Text>
                </View>
                <View style={styles.stockRow}>
                  <Text style={styles.stockLabel}>Cost/Unit:</Text>
                  <Text style={styles.stockValue}>${item.cost_per_unit}</Text>
                </View>
              </View>

              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${Math.min(stockPercentage, 100)}%`,
                      backgroundColor: isLowStock ? '#ef4444' : '#22c55e',
                    },
                  ]}
                />
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openAdjustModal(item)}
                  activeOpacity={0.7}
                >
                  <TrendingUp size={16} color={Colors.primary} />
                  <Text style={styles.actionButtonText}>Adjust Stock</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => openHistoryModal(item)}
                  activeOpacity={0.7}
                >
                  <History size={16} color="#8E8E93" />
                  <Text style={styles.actionButtonText}>History</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={showAdjustModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAdjustModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adjust Stock</Text>
              <TouchableOpacity onPress={() => setShowAdjustModal(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <View style={styles.selectedItemInfo}>
                <Text style={styles.selectedItemName}>{selectedItem.name}</Text>
                <Text style={styles.selectedItemStock}>
                  Current: {selectedItem.current_stock} {selectedItem.unit}
                </Text>
              </View>
            )}

            <TextInput
              style={styles.input}
              placeholder="Quantity"
              value={adjustmentData.quantity}
              onChangeText={(text: string) => setAdjustmentData({ ...adjustmentData, quantity: text })}
              keyboardType="decimal-pad"
            />

            <View style={styles.reasonSelector}>
              <Text style={styles.reasonLabel}>Reason:</Text>
              <View style={styles.reasonButtons}>
                {['purchase', 'waste', 'adjustment', 'order'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.reasonButton,
                      adjustmentData.movementType === type && styles.reasonButtonActive,
                    ]}
                    onPress={() => setAdjustmentData({ ...adjustmentData, movementType: type as any })}
                  >
                    <Text
                      style={[
                        styles.reasonButtonText,
                        adjustmentData.movementType === type && styles.reasonButtonTextActive,
                      ]}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Notes (optional)"
              value={adjustmentData.notes}
              onChangeText={(text: string) => setAdjustmentData({ ...adjustmentData, notes: text })}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.addStockButton]}
                onPress={() => handleAdjustStock(true)}
                disabled={adjustStockMutation.isPending}
              >
                {adjustStockMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <TrendingUp size={18} color="#fff" />
                    <Text style={styles.addStockButtonText}>Add Stock</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.reduceStockButton]}
                onPress={() => handleAdjustStock(false)}
                disabled={adjustStockMutation.isPending}
              >
                {adjustStockMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <TrendingDown size={18} color="#fff" />
                    <Text style={styles.reduceStockButtonText}>Reduce Stock</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showHistoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.historyModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Stock History</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {selectedItem && (
              <View style={styles.selectedItemInfo}>
                <Text style={styles.selectedItemName}>{selectedItem.name}</Text>
                <Text style={styles.selectedItemStock}>
                  Current: {selectedItem.current_stock} {selectedItem.unit}
                </Text>
              </View>
            )}

            <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
              {movementsQuery.isLoading ? (
                <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
              ) : movementsQuery.data && movementsQuery.data.length > 0 ? (
                movementsQuery.data.map((movement: any) => {
                  const isPositive = movement.quantity > 0;
                  return (
                    <View key={movement.id} style={styles.historyItem}>
                      <View style={styles.historyHeader}>
                        <View style={[styles.historyBadge, { backgroundColor: isPositive ? '#22c55e20' : '#ef444420' }]}>
                          {isPositive ? (
                            <TrendingUp size={16} color="#22c55e" />
                          ) : (
                            <TrendingDown size={16} color="#ef4444" />
                          )}
                          <Text style={[styles.historyQuantity, { color: isPositive ? '#22c55e' : '#ef4444' }]}>
                            {isPositive ? '+' : ''}{movement.quantity}
                          </Text>
                        </View>
                        <Text style={styles.historyType}>{movement.movement_type}</Text>
                      </View>
                      {movement.notes && (
                        <Text style={styles.historyNotes}>{movement.notes}</Text>
                      )}
                      <Text style={styles.historyDate}>
                        {new Date(movement.created_at).toLocaleString()}
                      </Text>
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>No movement history yet</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Inventory Item</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Item Name"
              value={newItem.name}
              onChangeText={(text: string) => setNewItem({ ...newItem, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Category"
              value={newItem.category}
              onChangeText={(text: string) => setNewItem({ ...newItem, category: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Unit (kg, lbs, pieces, etc.)"
              value={newItem.unit}
              onChangeText={(text: string) => setNewItem({ ...newItem, unit: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Current Stock"
              value={newItem.currentStock}
              onChangeText={(text: string) => setNewItem({ ...newItem, currentStock: text })}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Minimum Stock"
              value={newItem.minimumStock}
              onChangeText={(text: string) => setNewItem({ ...newItem, minimumStock: text })}
              keyboardType="decimal-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Cost Per Unit"
              value={newItem.costPerUnit}
              onChangeText={(text: string) => setNewItem({ ...newItem, costPerUnit: text })}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleAddItem}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Add Item</Text>
                )}
              </TouchableOpacity>
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
    backgroundColor: Colors.backgroundGray,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundGray,
  },
  header: {
    backgroundColor: Colors.background,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
    padding: 16,
  },
  itemCard: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  lowStockBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  category: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 12,
    fontWeight: '600' as const,
  },
  stockInfo: {
    gap: 6,
    marginBottom: 12,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stockLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  lowStockText: {
    color: '#ef4444',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  actionButtons: {
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
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  selectedItemInfo: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  selectedItemName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  selectedItemStock: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  reasonSelector: {
    marginBottom: 16,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  reasonButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reasonButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  reasonButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  reasonButtonTextActive: {
    color: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  addStockButton: {
    backgroundColor: '#22c55e',
    flexDirection: 'row',
    gap: 8,
  },
  addStockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  reduceStockButton: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    gap: 8,
  },
  reduceStockButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  historyModalContent: {
    maxHeight: '80%',
  },
  historyList: {
    maxHeight: 400,
  },
  historyItem: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  historyQuantity: {
    fontSize: 16,
    fontWeight: '800' as const,
  },
  historyType: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
  },
  historyNotes: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 6,
    fontStyle: 'italic' as const,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center' as const,
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: Colors.cardBackground,
    color: Colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundGray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700' as const,
  },
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
