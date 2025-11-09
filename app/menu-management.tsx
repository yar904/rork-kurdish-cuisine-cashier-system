import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Dimensions, Platform, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Plus, Edit, Trash2, Save, X, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc';
import { formatPrice } from '@/constants/currency';
import { CATEGORY_NAMES } from '@/constants/menu';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MenuItemForm = {
  id?: string;
  name: string;
  nameKurdish: string;
  nameArabic: string;
  category: string;
  price: string;
  description: string;
  descriptionKurdish: string;
  descriptionArabic: string;
  image: string;
  available: boolean;
};

const EMPTY_FORM: MenuItemForm = {
  name: '',
  nameKurdish: '',
  nameArabic: '',
  category: 'appetizers',
  price: '',
  description: '',
  descriptionKurdish: '',
  descriptionArabic: '',
  image: '',
  available: true,
};

export default function MenuManagementScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemForm>(EMPTY_FORM);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const menuQuery = trpc.menu.getAll.useQuery(undefined, {
    refetchInterval: 5000,
  });

  const createMutation = trpc.menu.create.useMutation({
    onSuccess: () => {
      menuQuery.refetch();
      setModalVisible(false);
      setEditingItem(EMPTY_FORM);
      Alert.alert('Success', 'Menu item created successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to create menu item');
    },
  });

  const updateMutation = trpc.menu.update.useMutation({
    onSuccess: () => {
      menuQuery.refetch();
      setModalVisible(false);
      setEditingItem(EMPTY_FORM);
      Alert.alert('Success', 'Menu item updated successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to update menu item');
    },
  });

  const deleteMutation = trpc.menu.delete.useMutation({
    onSuccess: () => {
      menuQuery.refetch();
      Alert.alert('Success', 'Menu item deleted successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message || 'Failed to delete menu item');
    },
  });

  const checkAccess = useCallback(() => {
    if (user.role !== 'admin') {
      Alert.alert('Access Denied', 'Only super admin can manage menu items');
      router.back();
    }
  }, [user.role, router]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const handleSave = () => {
    if (!editingItem.nameKurdish) {
      Alert.alert('Validation Error', 'Kurdish name is required. Other languages are optional.');
      return;
    }

    if (!editingItem.descriptionKurdish) {
      Alert.alert('Validation Error', 'Kurdish description is required. Other languages are optional.');
      return;
    }

    const price = parseFloat(editingItem.price);
    if (isNaN(price) || price < 0) {
      Alert.alert('Validation Error', 'Please enter a valid price');
      return;
    }

    const data = {
      name: editingItem.name || editingItem.nameKurdish,
      nameKurdish: editingItem.nameKurdish,
      nameArabic: editingItem.nameArabic || editingItem.nameKurdish,
      category: editingItem.category,
      price: price,
      description: editingItem.description || editingItem.descriptionKurdish,
      descriptionKurdish: editingItem.descriptionKurdish,
      descriptionArabic: editingItem.descriptionArabic || editingItem.descriptionKurdish,
      image: editingItem.image || null,
      available: editingItem.available,
    };

    if (editingItem.id) {
      updateMutation.mutate({ id: editingItem.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      nameKurdish: item.name_kurdish,
      nameArabic: item.name_arabic,
      category: item.category,
      price: item.price.toString(),
      description: item.description,
      descriptionKurdish: item.description_kurdish,
      descriptionArabic: item.description_arabic,
      image: item.image || '',
      available: item.available,
    });
    setModalVisible(true);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Menu Item',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate({ id }),
        },
      ]
    );
  };

  const filteredItems = menuQuery.data?.filter((item: any) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name_kurdish.includes(searchQuery) ||
      item.name_arabic.includes(searchQuery);
    
    const matchesCategory = !filterCategory || item.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];

  const dimensions = Dimensions.get('window');
  const isTablet = dimensions.width >= 768;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen 
        options={{ 
          title: 'Menu Management',
          headerStyle: { backgroundColor: Colors.primary },
          headerTintColor: '#fff',
        }} 
      />

      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textLight}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilter}
          contentContainerStyle={styles.categoryFilterContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !filterCategory && styles.categoryChipActive]}
            onPress={() => setFilterCategory(null)}
          >
            <Text style={[styles.categoryChipText, !filterCategory && styles.categoryChipTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {Object.entries(CATEGORY_NAMES).map(([key, value]) => (
            <TouchableOpacity
              key={key}
              style={[styles.categoryChip, filterCategory === key && styles.categoryChipActive]}
              onPress={() => setFilterCategory(key)}
            >
              <Text style={[styles.categoryChipText, filterCategory === key && styles.categoryChipTextActive]}>
                {value}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingItem(EMPTY_FORM);
            setModalVisible(true);
          }}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Menu Item</Text>
        </TouchableOpacity>
      </View>

      {menuQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading menu items...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={[styles.menuGrid, isTablet && styles.menuGridTablet]}>
            {filteredItems.map((item: any) => (
              <View key={item.id} style={[styles.menuCard, isTablet && styles.menuCardTablet]}>
                <View style={styles.menuCardHeader}>
                  <View style={styles.menuCardInfo}>
                    <Text style={styles.menuCardName}>{item.name}</Text>
                    <Text style={styles.menuCardNameSecondary}>{item.name_kurdish}</Text>
                    <Text style={styles.menuCardNameSecondary}>{item.name_arabic}</Text>
                  </View>
                  <View style={[styles.availabilityBadge, item.available ? styles.availableBadge : styles.unavailableBadge]}>
                    <Text style={styles.availabilityText}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.menuCardCategory}>{CATEGORY_NAMES[item.category]}</Text>
                <Text style={styles.menuCardPrice}>{formatPrice(item.price)}</Text>
                
                <Text style={styles.menuCardDescription} numberOfLines={2}>
                  {item.description}
                </Text>

                <View style={styles.menuCardActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => handleEdit(item)}
                  >
                    <Edit size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDelete(item.id, item.name)}
                  >
                    <Trash2 size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {filteredItems.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No menu items found</Text>
              <Text style={styles.emptyStateSubtext}>
                {searchQuery || filterCategory ? 'Try adjusting your filters' : 'Add your first menu item to get started'}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingItem.id ? 'Edit Menu Item' : 'Add Menu Item'}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
              <X size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalContentContainer}>
            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Kurdish (کوردی) - Required</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name (ناو) *</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem.nameKurdish}
                  onChangeText={(text: string) => setEditingItem({ ...editingItem, nameKurdish: text })}
                  placeholder="ناوی خواردن (پێویستە)"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (وەسف) *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editingItem.descriptionKurdish}
                  onChangeText={(text: string) => setEditingItem({ ...editingItem, descriptionKurdish: text })}
                  placeholder="وەسفی خواردن... (پێویستە)"
                  placeholderTextColor={Colors.textLight}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>English (Optional)</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem.name}
                  onChangeText={(text: string) => setEditingItem({ ...editingItem, name: text })}
                  placeholder="e.g., Tikka Kebab (defaults to Kurdish)"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editingItem.description}
                  onChangeText={(text: string) => setEditingItem({ ...editingItem, description: text })}
                  placeholder="Describe the dish... (defaults to Kurdish)"
                  placeholderTextColor={Colors.textLight}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Arabic (عربي) - Optional</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name (اسم)</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem.nameArabic}
                  onChangeText={(text: string) => setEditingItem({ ...editingItem, nameArabic: text })}
                  placeholder="اسم الطبق (افتراضي للكردية)"
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description (وصف)</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editingItem.descriptionArabic}
                  onChangeText={(text: string) => setEditingItem({ ...editingItem, descriptionArabic: text })}
                  placeholder="وصف الطبق... (افتراضي للكردية)"
                  placeholderTextColor={Colors.textLight}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formSectionTitle}>Details</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => setCategoryPickerVisible(!categoryPickerVisible)}
                >
                  <Text style={styles.pickerButtonText}>
                    {CATEGORY_NAMES[editingItem.category]}
                  </Text>
                  <ChevronDown size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
                
                {categoryPickerVisible && (
                  <View style={styles.pickerDropdown}>
                    {Object.entries(CATEGORY_NAMES).map(([key, value]) => (
                      <TouchableOpacity
                        key={key}
                        style={styles.pickerOption}
                        onPress={() => {
                          setEditingItem({ ...editingItem, category: key });
                          setCategoryPickerVisible(false);
                        }}
                      >
                        <Text style={styles.pickerOptionText}>{value}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Price (IQD) *</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem.price}
                  onChangeText={(text: string) => setEditingItem({ ...editingItem, price: text })}
                  placeholder="25000"
                  placeholderTextColor={Colors.textLight}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Image URL (optional)</Text>
                <TextInput
                  style={styles.input}
                  value={editingItem.image}
                  onChangeText={(text) => setEditingItem({ ...editingItem, image: text })}
                  placeholder="https://images.unsplash.com/..."
                  placeholderTextColor={Colors.textLight}
                />
              </View>

              <TouchableOpacity
                style={styles.availabilityToggle}
                onPress={() => setEditingItem({ ...editingItem, available: !editingItem.available })}
              >
                <View style={[styles.checkbox, editingItem.available && styles.checkboxChecked]}>
                  {editingItem.available && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.availabilityToggleText}>Available for ordering</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.saveButton]}
              onPress={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Save size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Save</Text>
                </>
              )}
            </TouchableOpacity>
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
  header: {
    padding: 16,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryFilter: {
    marginBottom: 12,
  },
  categoryFilterContent: {
    gap: 8,
  },
  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  menuGrid: {
    gap: 16,
  },
  menuGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  menuCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
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
  menuCardTablet: {
    width: '48%',
  },
  menuCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  menuCardInfo: {
    flex: 1,
  },
  menuCardName: {
    fontSize: 18,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  menuCardNameSecondary: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  availabilityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  availableBadge: {
    backgroundColor: Colors.success + '20',
  },
  unavailableBadge: {
    backgroundColor: Colors.error + '20',
  },
  availabilityText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  menuCardCategory: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 4,
  },
  menuCardPrice: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  menuCardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  menuCardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editBtn: {
    backgroundColor: Colors.primary,
  },
  deleteBtn: {
    backgroundColor: Colors.error,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '800' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  pickerDropdown: {
    marginTop: 8,
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  pickerOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pickerOptionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
  availabilityToggleText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundGray,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
