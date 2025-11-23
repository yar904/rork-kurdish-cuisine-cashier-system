import React, { useCallback, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, TextInput, ActivityIndicator, Alert } from 'react-native';
import type { Database } from '@/types/database';
import { Text } from '@/components/CustomText';
import { Stack } from 'expo-router';
import { Settings, MenuSquare, Users, Package, Briefcase, Table, X, Plus, Edit, Trash2, Search, QrCode } from 'lucide-react-native';
import { TableQRManagement } from '@/components/admin/TableQRManagement';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { trpc } from '@/lib/trpc';
import { useClearNotification, useClearTableNotifications, useNotifications } from '@/contexts/NotificationContext';

type AdminSection = 'menu' | 'inventory' | 'employees' | 'categories' | 'tables' | 'qr-codes' | null;

type MenuItem = {
  id: string;
  name: string;
  nameKurdish: string;
  nameArabic: string;
  category: string;
  price: number;
  description: string;
  descriptionKurdish: string;
  descriptionArabic: string;
  image: string | null;
  available: boolean;
  cost?: number;
  created_at?: string;
  updated_at?: string;
};

type TableInfo = {
  number: number;
  status: string;
  capacity: number;
  currentOrderId: string | null;
  reservedFor: string | null;
  lastCleaned?: Date;
};

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const [activeSection, setActiveSection] = useState<AdminSection>(null);
  const notificationsQuery = useNotifications();
  const clearNotification = useClearNotification();
  const clearTableNotifications = useClearTableNotifications();
  const [clearingId, setClearingId] = useState<number | null>(null);
  const [clearingTable, setClearingTable] = useState<number | null>(null);

  const getTimeSince = useCallback((date: string) => {
    const now = Date.now();
    const diff = now - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 min ago';
    return `${minutes} mins ago`;
  }, []);

  const handleClear = useCallback(
    async (id: number) => {
      setClearingId(id);
      try {
        await clearNotification(id);
      } finally {
        setClearingId(null);
      }
    },
    [clearNotification],
  );

  const handleClearTable = useCallback(
    async (tableNumber: number) => {
      setClearingTable(tableNumber);
      try {
        await clearTableNotifications(tableNumber);
      } finally {
        setClearingTable(null);
      }
    },
    [clearTableNotifications],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Stack.Screen
        options={{
          title: 'Admin Panel',
          headerStyle: { backgroundColor: '#5C0000' },
          headerTintColor: '#FFFFFF',
          headerShadowVisible: false,
        }}
      />

      {activeSection === null ? (
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Settings size={32} color="#5C0000" />
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSubtitle}>Manage system and settings</Text>
          </View>

          <View style={styles.cardsGrid}>
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => setActiveSection('menu')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#5C000015' }]}>
                  <MenuSquare size={24} color="#5C0000" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Menu Items</Text>
              <Text style={styles.cardDescription}>Add, edit, or remove menu items</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
              onPress={() => setActiveSection('employees')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#10B98115' }]}>
                  <Users size={24} color="#10B981" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Employees</Text>
              <Text style={styles.cardDescription}>Manage staff and permissions</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
              onPress={() => setActiveSection('inventory')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#F59E0B15' }]}>
                  <Package size={24} color="#F59E0B" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Inventory</Text>
              <Text style={styles.cardDescription}>Track stock levels & suppliers</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
              onPress={() => setActiveSection('categories')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#C6A66715' }]}>
                  <Briefcase size={24} color="#C6A667" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Categories</Text>
              <Text style={styles.cardDescription}>Organize menu categories</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
              onPress={() => setActiveSection('qr-codes')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#8B5CF615' }]}>
                  <QrCode size={24} color="#8B5CF6" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Table QR Codes</Text>
              <Text style={styles.cardDescription}>Generate QR codes for tables</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.card} 
              activeOpacity={0.8}
              onPress={() => setActiveSection('tables')}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconContainer, { backgroundColor: '#3B82F615' }]}>
                  <Table size={24} color="#3B82F6" />
                </View>
              </View>
              <Text style={styles.cardTitle}>Table Layout</Text>
              <Text style={styles.cardDescription}>Manage tables and capacity</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.notificationsCard}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            {notificationsQuery.isLoading ? (
              <ActivityIndicator color="#5C0000" />
            ) : notificationsQuery.data && notificationsQuery.data.length > 0 ? (
              notificationsQuery.data.map((notification) => (
                <View key={notification.id} style={styles.notificationRow}>
                  <Text style={styles.notificationText}>
                    Table {notification.tableNumber} — {notification.type} — {getTimeSince(notification.createdAt)}
                  </Text>
                  <View style={styles.notificationActions}>
                    <TouchableOpacity
                      style={styles.clearButton}
                      onPress={() => handleClear(notification.id)}
                      disabled={clearingId === notification.id}
                    >
                      <Text style={styles.clearButtonText}>Clear</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.clearTableButton}
                      onPress={() => handleClearTable(notification.tableNumber)}
                      disabled={clearingTable === notification.tableNumber}
                    >
                      <Text style={styles.clearButtonText}>Clear Table</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.notificationText}>No notifications</Text>
            )}
          </View>
        </ScrollView>
      ) : activeSection === 'menu' ? (
        <MenuManagement onBack={() => setActiveSection(null)} />
      ) : activeSection === 'employees' ? (
        <EmployeesManagement onBack={() => setActiveSection(null)} />
      ) : activeSection === 'inventory' ? (
        <InventoryManagement onBack={() => setActiveSection(null)} />
      ) : activeSection === 'categories' ? (
        <CategoriesManagement onBack={() => setActiveSection(null)} />
      ) : activeSection === 'tables' ? (
        <TablesManagement onBack={() => setActiveSection(null)} />
      ) : activeSection === 'qr-codes' ? (
        <TableQRManagement onBack={() => setActiveSection(null)} />
      ) : null}
    </View>
  );
}

function MenuManagement({ onBack }: { onBack: () => void }) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const { data: menuItems, isLoading, refetch } = trpc.menu.getAll.useQuery();
  const deleteMutation = trpc.menu.delete.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert('Success', 'Menu item deleted successfully');
    },
  });

  const filteredItems = menuItems?.filter((item: Database['public']['Tables']['menu_items']['Row']) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate({ id })
        }
      ]
    );
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <X size={24} color="#5C0000" />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Menu Management</Text>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color="#8E8E93" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search menu items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E93"
        />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5C0000" />
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>
            {searchQuery ? 'No items match your search' : 'No menu items yet'}
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {filteredItems.map((item: Database['public']['Tables']['menu_items']['Row']) => (
            <View key={item.id} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{item.name}</Text>
                <Text style={styles.listItemSubtitle}>{item.category} • ${item.price}</Text>
                <View style={[styles.badge, item.available ? styles.badgeAvailable : styles.badgeUnavailable]}>
                  <Text style={styles.badgeText}>
                    {item.available ? 'Available' : 'Unavailable'}
                  </Text>
                </View>
              </View>
              <View style={styles.listItemActions}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => setEditingItem(item)}
                >
                  <Edit size={20} color="#5C0000" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => handleDelete(item.id, item.name)}
                >
                  <Trash2 size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {(showAddModal || editingItem) && (
        <MenuItemModal
          item={editingItem}
          onClose={() => {
            setShowAddModal(false);
            setEditingItem(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingItem(null);
            refetch();
          }}
        />
      )}
    </View>
  );
}

function MenuItemModal({ item, onClose, onSuccess }: { item: Database['public']['Tables']['menu_items']['Row'] | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    name_kurdish: item?.name_kurdish || '',
    name_arabic: item?.name_arabic || '',
    category: item?.category || '',
    price: item?.price?.toString() || '',
    cost: item?.cost?.toString() || '0',
    description: item?.description || '',
    description_kurdish: item?.description_kurdish || '',
    description_arabic: item?.description_arabic || '',
    image: item?.image || '',
    available: item?.available ?? true,
  });

  const createMutation = trpc.menu.create.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Menu item created successfully');
      onSuccess();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const updateMutation = trpc.menu.update.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Menu item updated successfully');
      onSuccess();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.category || !formData.price) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const data = {
      name: formData.name,
      nameKurdish: formData.name_kurdish,
      nameArabic: formData.name_arabic,
      category: formData.category,
      price: parseFloat(formData.price),
      description: formData.description,
      descriptionKurdish: formData.description_kurdish,
      descriptionArabic: formData.description_arabic,
      image: formData.image || null,
      available: formData.available,
    };

    if (item) {
      updateMutation.mutate({ id: item.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {item ? 'Edit Menu Item' : 'Add Menu Item'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#3A3A3A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            <Text style={styles.label}>Name (English) *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text: string) => setFormData({ ...formData, name: text })}
              placeholder="Pizza Margherita"
            />

            <Text style={styles.label}>Category *</Text>
            <TextInput
              style={styles.input}
              value={formData.category}
              onChangeText={(text: string) => setFormData({ ...formData, category: text })}
              placeholder="Main Course"
            />

            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={formData.price}
              onChangeText={(text: string) => setFormData({ ...formData, price: text })}
              placeholder="12.99"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Cost</Text>
            <TextInput
              style={styles.input}
              value={formData.cost}
              onChangeText={(text: string) => setFormData({ ...formData, cost: text })}
              placeholder="5.00"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Description (English)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(text: string) => setFormData({ ...formData, description: text })}
              placeholder="Description..."
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Menu Image</Text>
            <ImageUploader
              value={formData.image}
              onChange={(url: string) => setFormData({ ...formData, image: url })}
              bucketName="menu-images"
              folderPath="items"
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonPrimaryText}>
                  {item ? 'Update' : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EmployeesManagement({ onBack }: { onBack: () => void }) {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const { data: employees, isLoading, refetch } = trpc.employees.getAll.useQuery();
  const deleteMutation = trpc.employees.delete.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert('Success', 'Employee deleted successfully');
    },
  });

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Employee',
      `Are you sure you want to delete "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate({ id })
        }
      ]
    );
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <X size={24} color="#5C0000" />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Employees</Text>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5C0000" />
        </View>
      ) : !employees || employees.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No employees yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {employees.map((employee: Database['public']['Tables']['employees']['Row']) => (
            <View key={employee.id} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{employee.name}</Text>
                <Text style={styles.listItemSubtitle}>
                  {employee.role} • ${employee.hourly_rate}/hr
                </Text>
                <View style={[
                  styles.badge, 
                  employee.status === 'active' ? styles.badgeAvailable : styles.badgeUnavailable
                ]}>
                  <Text style={styles.badgeText}>{employee.status}</Text>
                </View>
              </View>
              <View style={styles.listItemActions}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => setEditingEmployee(employee)}
                >
                  <Edit size={20} color="#5C0000" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => handleDelete(employee.id, employee.name)}
                >
                  <Trash2 size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {(showAddModal || editingEmployee) && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setShowAddModal(false);
            setEditingEmployee(null);
          }}
          onSuccess={() => {
            setShowAddModal(false);
            setEditingEmployee(null);
            refetch();
          }}
        />
      )}
    </View>
  );
}

function EmployeeModal({ employee, onClose, onSuccess }: { employee: Database['public']['Tables']['employees']['Row'] | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    role: employee?.role || 'waiter',
    phone: employee?.phone || '',
    email: employee?.email || '',
    hourly_rate: employee?.hourly_rate?.toString() || '',
    status: employee?.status || 'active',
  });

  const createMutation = trpc.employees.create.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Employee created successfully');
      onSuccess();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const updateMutation = trpc.employees.update.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Employee updated successfully');
      onSuccess();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.role || !formData.hourly_rate) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const data = {
      name: formData.name,
      role: formData.role,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      hourlyRate: parseFloat(formData.hourly_rate),
    };

    if (employee) {
      updateMutation.mutate({ id: employee.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {employee ? 'Edit Employee' : 'Add Employee'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#3A3A3A" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalForm}>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(text: string) => setFormData({ ...formData, name: text })}
              placeholder="John Doe"
            />

            <Text style={styles.label}>Role *</Text>
            <View style={styles.roleButtons}>
              {['waiter', 'chef', 'manager', 'cashier'].map(role => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleButton,
                    formData.role === role && styles.roleButtonActive
                  ]}
                  onPress={() => setFormData({ ...formData, role })}
                >
                  <Text style={[
                    styles.roleButtonText,
                    formData.role === role && styles.roleButtonTextActive
                  ]}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Hourly Rate *</Text>
            <TextInput
              style={styles.input}
              value={formData.hourly_rate}
              onChangeText={(text: string) => setFormData({ ...formData, hourly_rate: text })}
              placeholder="15.00"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Phone</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(text: string) => setFormData({ ...formData, phone: text })}
              placeholder="+1234567890"
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text: string) => setFormData({ ...formData, email: text })}
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonPrimaryText}>
                  {employee ? 'Update' : 'Create'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function InventoryManagement({ onBack }: { onBack: () => void }) {
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);

  const { data: inventory, isLoading, refetch } = trpc.inventory.getAll.useQuery();

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <X size={24} color="#5C0000" />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Inventory</Text>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5C0000" />
        </View>
      ) : !inventory || inventory.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No inventory items yet</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {inventory.map((item: Database['public']['Tables']['inventory_items']['Row']) => (
            <View key={item.id} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{item.name}</Text>
                <Text style={styles.listItemSubtitle}>
                  {item.category} • {item.current_stock} {item.unit}
                </Text>
                {item.current_stock <= item.minimum_stock && (
                  <View style={[styles.badge, styles.badgeWarning]}>
                    <Text style={styles.badgeText}>Low Stock</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity 
                style={styles.adjustButton}
                onPress={() => {
                  setSelectedItem(item);
                  setShowAdjustModal(true);
                }}
              >
                <Text style={styles.adjustButtonText}>Adjust</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {showAdjustModal && selectedItem && (
        <AdjustStockModal
          item={selectedItem}
          onClose={() => {
            setShowAdjustModal(false);
            setSelectedItem(null);
          }}
          onSuccess={() => {
            setShowAdjustModal(false);
            setSelectedItem(null);
            refetch();
          }}
        />
      )}
    </View>
  );
}

function CategoriesManagement({ onBack }: { onBack: () => void }) {
  const [editingCategory, setEditingCategory] = useState<{ name: string; itemCount: number } | null>(null);

  const { data: menuItems, isLoading, refetch } = trpc.menu.getAll.useQuery();

  const categories = menuItems 
    ? Array.from(new Set(menuItems.map((item: any) => item.category))).map(categoryName => ({
        name: categoryName,
        itemCount: menuItems.filter((item: any) => item.category === categoryName).length
      }))
    : [];

  const handleDelete = (name: string, itemCount: number) => {
    if (itemCount > 0) {
      Alert.alert(
        'Cannot Delete',
        `Category "${name}" contains ${itemCount} menu items. Please reassign or delete those items first.`
      );
      return;
    }

    Alert.alert('Info', 'Categories are automatically managed based on menu items.');
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <X size={24} color="#5C0000" />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5C0000" />
        </View>
      ) : categories.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No categories yet</Text>
          <Text style={styles.emptySubtext}>Categories are automatically created when you add menu items</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {categories.map((category) => (
            <View key={category.name} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>{category.name}</Text>
                <Text style={styles.listItemSubtitle}>
                  {category.itemCount} item{category.itemCount !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.listItemActions}>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => setEditingCategory(category)}
                >
                  <Edit size={20} color="#5C0000" />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.iconButton}
                  onPress={() => handleDelete(category.name, category.itemCount)}
                >
                  <Trash2 size={20} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {editingCategory && (
        <CategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => {
            setEditingCategory(null);
            refetch();
          }}
        />
      )}
    </View>
  );
}

function CategoryModal({ category, onClose, onSuccess }: { category: { name: string; itemCount: number }; onClose: () => void; onSuccess: () => void }) {
  const [newName, setNewName] = useState<string>(category.name);

  const handleSubmit = () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (newName === category.name) {
      onClose();
      return;
    }

    Alert.alert('Not Implemented', 'Category rename is not yet implemented. Please update category via menu items.');
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Category</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#3A3A3A" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalForm}>
            <Text style={styles.itemInfo}>{category.name}</Text>
            <Text style={styles.itemCurrentStock}>
              {category.itemCount} item{category.itemCount !== 1 ? 's' : ''} in this category
            </Text>

            <Text style={styles.label}>New Category Name *</Text>
            <TextInput
              style={styles.input}
              value={newName}
              onChangeText={setNewName}
              placeholder="Category name"
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
            >
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSubmit}
            >
              <Text style={styles.buttonPrimaryText}>Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function TablesManagement({ onBack }: { onBack: () => void }) {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  const { data: tables, isLoading, refetch } = trpc.tables.getAll.useQuery();
  const deleteMutation = trpc.tables.delete.useMutation({
    onSuccess: () => {
      refetch();
      Alert.alert('Success', 'Table deleted successfully');
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleDelete = (tableNumber: number, status: string) => {
    if (status === 'occupied') {
      Alert.alert(
        'Cannot Delete',
        `Table ${tableNumber} is currently occupied. Please complete the order first.`
      );
      return;
    }

    Alert.alert(
      'Delete Table',
      `Are you sure you want to delete Table ${tableNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteMutation.mutate({ number: tableNumber })
        }
      ]
    );
  };

  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <X size={24} color="#5C0000" />
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Table Layout</Text>
        <TouchableOpacity 
          onPress={() => setShowAddModal(true)}
          style={styles.addButton}
        >
          <Plus size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#5C0000" />
        </View>
      ) : !tables || tables.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>No tables yet</Text>
          <Text style={styles.emptySubtext}>Add your first table to get started</Text>
        </View>
      ) : (
        <ScrollView style={styles.listContainer}>
          {tables.map((table: Database['public']['Tables']['tables']['Row']) => (
            <View key={table.number} style={styles.listItem}>
              <View style={styles.listItemContent}>
                <Text style={styles.listItemTitle}>Table {table.number}</Text>
                <Text style={styles.listItemSubtitle}>
                  Capacity: {table.capacity} • {table.status}
                </Text>
                <View style={[
                  styles.badge,
                  table.status === 'available' ? styles.badgeAvailable : 
                  table.status === 'occupied' ? styles.badgeUnavailable :
                  styles.badgeWarning
                ]}>
                  <Text style={styles.badgeText}>{table.status}</Text>
                </View>
              </View>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={() => handleDelete(table.number, table.status)}
              >
                <Trash2 size={20} color="#DC2626" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      {showAddModal && (
        <TableModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            refetch();
          }}
        />
      )}
    </View>
  );
}

function TableModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [tableNumber, setTableNumber] = useState<string>('');
  const [capacity, setCapacity] = useState<string>('4');

  const createMutation = trpc.tables.create.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Table created successfully');
      onSuccess();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleSubmit = () => {
    if (!tableNumber || !capacity) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const num = parseInt(tableNumber);
    const cap = parseInt(capacity);

    if (isNaN(num) || num <= 0) {
      Alert.alert('Error', 'Please enter a valid table number');
      return;
    }

    if (isNaN(cap) || cap <= 0) {
      Alert.alert('Error', 'Please enter a valid capacity');
      return;
    }

    createMutation.mutate({
      number: num,
      capacity: cap,
      status: 'available',
    });
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Table</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#3A3A3A" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalForm}>
            <Text style={styles.label}>Table Number *</Text>
            <TextInput
              style={styles.input}
              value={tableNumber}
              onChangeText={setTableNumber}
              placeholder="1"
              keyboardType="number-pad"
            />

            <Text style={styles.label}>Capacity *</Text>
            <TextInput
              style={styles.input}
              value={capacity}
              onChangeText={setCapacity}
              placeholder="4"
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
              disabled={createMutation.isPending}
            >
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AdjustStockModal({ item, onClose, onSuccess }: { item: Database['public']['Tables']['inventory_items']['Row']; onClose: () => void; onSuccess: () => void }) {
  const [adjustType, setAdjustType] = useState<'add' | 'reduce'>('add');
  const [quantity, setQuantity] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const adjustMutation = trpc.inventory.adjustStock.useMutation({
    onSuccess: () => {
      Alert.alert('Success', 'Stock adjusted successfully');
      onSuccess();
    },
    onError: (error) => {
      Alert.alert('Error', error.message);
    },
  });

  const handleSubmit = () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    const amount = parseFloat(quantity);
    const changeAmount = adjustType === 'add' ? amount : -amount;

    adjustMutation.mutate({
      inventoryItemId: item.id,
      quantity: changeAmount,
      movementType: adjustType === 'add' ? 'purchase' : 'adjustment',
      notes: notes || (adjustType === 'add' ? 'Stock added' : 'Stock removed'),
    });
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Adjust Stock</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#3A3A3A" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalForm}>
            <Text style={styles.itemInfo}>{item.name}</Text>
            <Text style={styles.itemCurrentStock}>
              Current: {item.current_stock} {item.unit}
            </Text>

            <View style={styles.adjustTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.adjustTypeButton,
                  adjustType === 'add' && styles.adjustTypeButtonActive
                ]}
                onPress={() => setAdjustType('add')}
              >
                <Text style={[
                  styles.adjustTypeText,
                  adjustType === 'add' && styles.adjustTypeTextActive
                ]}>
                  Add Stock
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.adjustTypeButton,
                  adjustType === 'reduce' && styles.adjustTypeButtonActive
                ]}
                onPress={() => setAdjustType('reduce')}
              >
                <Text style={[
                  styles.adjustTypeText,
                  adjustType === 'reduce' && styles.adjustTypeTextActive
                ]}>
                  Reduce Stock
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Quantity *</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="Enter quantity"
              keyboardType="decimal-pad"
            />

            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Reason for adjustment..."
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.button, styles.buttonSecondary]}
              onPress={onClose}
              disabled={adjustMutation.isPending}
            >
              <Text style={styles.buttonSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleSubmit}
              disabled={adjustMutation.isPending}
            >
              {adjustMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonPrimaryText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6EEDD',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    ...Platform.select({
      web: {
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  card: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
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
  cardHeader: {
    marginBottom: 16,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  notificationsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
      },
    }),
  },
  notificationRow: {
    paddingVertical: 10,
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: 1,
    gap: 8,
  },
  notificationText: {
    color: '#1F2937',
    fontSize: 14,
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  clearButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearTableButton: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  clearButtonText: {
    color: '#5C0000',
    fontWeight: '600',
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#5C0000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cardBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  sectionContainer: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#5C0000',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#3A3A3A',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
  },
  listItemContent: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  listItemActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeAvailable: {
    backgroundColor: '#10B98115',
  },
  badgeUnavailable: {
    backgroundColor: '#DC262615',
  },
  badgeWarning: {
    backgroundColor: '#F59E0B15',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#3A3A3A',
  },
  adjustButton: {
    backgroundColor: '#5C0000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  adjustButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#3A3A3A',
  },
  modalForm: {
    padding: 20,
    maxHeight: 400,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3A3A3A',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#F6EEDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#3A3A3A',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#5C0000',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  buttonSecondary: {
    backgroundColor: '#E5E5E5',
  },
  buttonSecondaryText: {
    color: '#3A3A3A',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  roleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F6EEDD',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  roleButtonActive: {
    backgroundColor: '#5C0000',
    borderColor: '#5C0000',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#3A3A3A',
    fontWeight: '500' as const,
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
  },
  itemInfo: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#3A3A3A',
    marginBottom: 4,
  },
  itemCurrentStock: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 16,
  },
  adjustTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  adjustTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F6EEDD',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  adjustTypeButtonActive: {
    backgroundColor: '#5C0000',
    borderColor: '#5C0000',
  },
  adjustTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#3A3A3A',
  },
  adjustTypeTextActive: {
    color: '#FFFFFF',
  },
});
