import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { Text } from '@/components/CustomText';
import { X, Plus, Search } from 'lucide-react-native';
import { trpc } from '@/lib/trpc';

interface AddItemModalProps {
  visible: boolean;
  onClose: () => void;
  orderId: string;
  onItemAdded: () => void;
}

export function AddItemModal({
  visible,
  onClose,
  orderId,
  onItemAdded,
}: AddItemModalProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const menuQuery = trpc.menu.getAll.useQuery();
  const addItemMutation = trpc.orders.addItem.useMutation();

  const categories = useMemo(() => {
    if (!menuQuery.data) return ['All'];
    const cats = Array.from(new Set(menuQuery.data.map((item: any) => item.category)));
    return ['All', ...cats];
  }, [menuQuery.data]);

  const filteredMenuItems = useMemo(() => {
    if (!menuQuery.data) return [];
    let filtered = menuQuery.data;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter((item: any) => item.category === selectedCategory);
    }

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((item: any) =>
        item.name.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [menuQuery.data, selectedCategory, search]);

  const handleAddItem = async (menuItem: any) => {
    try {
      await addItemMutation.mutateAsync({
        orderId,
        menuItemId: menuItem.id,
        quantity: 1,
        notes: '',
      });

      onItemAdded();
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Add Items</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#3A3A3A" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search size={20} color="#8E8E93" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search menu items..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#8E8E93"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category && styles.categoryTextActive,
                  ]}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {menuQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5C0000" />
            </View>
          ) : filteredMenuItems.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No items found</Text>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {filteredMenuItems.map((item: any) => (
                <View key={item.id} style={styles.menuItem}>
                  {item.image && (
                    <Image source={{ uri: item.image }} style={styles.itemImage} />
                  )}
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.description && (
                      <Text style={styles.itemDescription} numberOfLines={2}>
                        {item.description}
                      </Text>
                    )}
                    <Text style={styles.itemPrice}>IQD {item.price.toLocaleString()}</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      (addItemMutation.isPending || !item.available) && styles.addButtonDisabled,
                    ]}
                    onPress={() => handleAddItem(item)}
                    disabled={addItemMutation.isPending || !item.available}
                  >
                    <Plus size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
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
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    margin: 20,
    marginBottom: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#3A3A3A',
    outlineStyle: 'none' as any,
  },
  categoryScroll: {
    flexGrow: 0,
    marginTop: 16,
    marginBottom: 16,
  },
  categoryContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  categoryButtonActive: {
    backgroundColor: '#5C0000',
    borderColor: '#5C0000',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3A3A3A',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#E5E5EA',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#3A3A3A',
  },
  itemDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#5C0000',
  },
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#5C0000',
  },
  addButtonDisabled: {
    backgroundColor: '#8E8E93',
    opacity: 0.5,
  },
});
