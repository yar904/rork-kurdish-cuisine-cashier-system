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
import { Package, AlertTriangle, Plus } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';

export default function InventoryScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLowStock, setShowLowStock] = useState(false);
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

  const displayItems = showLowStock ? lowStockQuery.data : inventoryQuery.data;

  if (inventoryQuery.isLoading) {
    return (
      <View style={styles.loadingContainer}>
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
            </View>
          );
        })}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Inventory Item</Text>

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
