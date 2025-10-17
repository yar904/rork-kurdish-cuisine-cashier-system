import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, Dimensions, Platform } from 'react-native';
import { Stack } from 'expo-router';
import { ShoppingCart, Plus, Minus, Trash2, Send } from 'lucide-react-native';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MENU_ITEMS } from '@/constants/menu';
import { MenuCategory } from '@/types/restaurant';
import { Colors } from '@/constants/colors';

const getResponsiveLayout = () => {
  const { width } = Dimensions.get('window');
  return {
    isPhone: width < 768,
    isTablet: width >= 768 && width < 1200,
    isDesktop: width >= 1200,
    width,
  };
};

export default function CashierScreen() {
  const {
    currentOrder,
    selectedTable,
    setSelectedTable,
    addItemToCurrentOrder,
    removeItemFromCurrentOrder,
    updateItemQuantity,
    submitOrder,
    clearCurrentOrder,
    calculateTotal,
  } = useRestaurant();

  const { t, tc } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('appetizers');
  const [waiterName, setWaiterName] = useState<string>('');

  const categories: MenuCategory[] = ['appetizers', 'soups', 'kebabs', 'rice-dishes', 'stews', 'breads', 'desserts', 'drinks'];

  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter(item => item.category === selectedCategory && item.available);
  }, [selectedCategory]);

  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => subscription?.remove();
  }, []);

  const handleSubmitOrder = () => {
    if (currentOrder.length === 0) {
      Alert.alert(t('emptyOrder'), t('pleaseAddItems'));
      return;
    }

    Alert.alert(
      t('submitOrder'),
      `${t('submitOrderConfirm')} ${selectedTable}?`,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('submit'),
          onPress: () => {
            submitOrder(waiterName || undefined);
            Alert.alert(t('success'), t('orderSubmitted'));
          },
        },
      ]
    );
  };

  const getItemsPerRow = () => {
    const layout = getResponsiveLayout();
    if (layout.isDesktop) return 3;
    if (layout.isTablet) return 2;
    return 1;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: `${t('restaurantName')} - ${t('cashier')}`,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
      }} />

      <View style={styles.content}>
        <View style={styles.menuSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive,
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive,
                ]}>
                  {tc(category)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <ScrollView style={styles.itemsScroll} contentContainerStyle={styles.itemsGrid}>
            {filteredItems.map(item => {
              const itemsPerRow = getItemsPerRow();
              const itemWidth = itemsPerRow === 1 ? '100%' : `${100 / itemsPerRow - 2}%`;
              
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, { width: itemWidth }]}
                  onPress={() => addItemToCurrentOrder(item.id)}
                >
                  {item.image && (
                    <Image
                      source={{ uri: item.image }}
                      style={styles.menuItemImage}
                      resizeMode="cover"
                    />
                  )}
                  <View style={styles.menuItemContent}>
                    <View style={styles.menuItemHeader}>
                      <Text style={styles.menuItemName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
                    </View>
                    <Text style={styles.menuItemKurdish} numberOfLines={1}>{item.nameKurdish}</Text>
                    <Text style={styles.menuItemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <View style={styles.addButton}>
                      <Plus size={18} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={[styles.orderSection, dimensions.width >= 768 && styles.orderSectionTablet]}>
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <ShoppingCart size={24} color={Colors.primary} />
              <Text style={styles.orderTitle}>{t('currentOrder')}</Text>
            </View>
            {currentOrder.length > 0 && (
              <TouchableOpacity onPress={clearCurrentOrder}>
                <Text style={styles.clearButton}>{t('clear')}</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tableSelector}>
            <Text style={styles.tableSelectorLabel}>{t('table')}:</Text>
            <View style={styles.tableSelectorButtons}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(table => (
                <TouchableOpacity
                  key={table}
                  style={[
                    styles.tableButton,
                    selectedTable === table && styles.tableButtonActive,
                  ]}
                  onPress={() => setSelectedTable(table)}
                >
                  <Text style={[
                    styles.tableButtonText,
                    selectedTable === table && styles.tableButtonTextActive,
                  ]}>
                    {table}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={styles.waiterInput}
            placeholder={`${t('waiterName')} (${t('optional')})`}
            value={waiterName}
            onChangeText={setWaiterName}
            placeholderTextColor={Colors.textLight}
          />

          <ScrollView style={styles.orderItems}>
            {currentOrder.length === 0 ? (
              <View style={styles.emptyOrder}>
                <Text style={styles.emptyOrderText}>{t('noItemsInOrder')}</Text>
              </View>
            ) : (
              currentOrder.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.orderItemInfo}>
                    <Text style={styles.orderItemName}>{item.menuItem.name}</Text>
                    <Text style={styles.orderItemPrice}>
                      ${(item.menuItem.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                  <View style={styles.orderItemControls}>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateItemQuantity(index, item.quantity - 1)}
                    >
                      <Minus size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.quantityText}>{item.quantity}</Text>
                    <TouchableOpacity
                      style={styles.quantityButton}
                      onPress={() => updateItemQuantity(index, item.quantity + 1)}
                    >
                      <Plus size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => removeItemFromCurrentOrder(index)}
                    >
                      <Trash2 size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          <View style={styles.orderFooter}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('total')}:</Text>
              <Text style={styles.totalAmount}>
                ${calculateTotal(currentOrder).toFixed(2)}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.submitButton,
                currentOrder.length === 0 && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmitOrder}
              disabled={currentOrder.length === 0}
            >
              <Send size={20} color="#fff" />
              <Text style={styles.submitButtonText}>{t('submitOrder')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGray,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    ...Platform.select({
      web: {
        maxWidth: 1920,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
  },
  menuSection: {
    flex: 2,
    backgroundColor: Colors.background,
    minWidth: 0,
  },
  categoryScroll: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.background,
  },
  categoryScrollContent: {
    padding: 12,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.backgroundGray,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  itemsScroll: {
    flex: 1,
  },
  itemsGrid: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'flex-start',
  },
  menuItem: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden' as const,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  menuItemImage: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.backgroundGray,
  },
  menuItemContent: {
    padding: 12,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
    flex: 1,
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  menuItemKurdish: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  menuItemDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  addButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderSection: {
    width: 400,
    backgroundColor: Colors.background,
    borderLeftWidth: 1,
    borderColor: Colors.border,
  },
  orderSectionTablet: {
    width: 450,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  clearButton: {
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600' as const,
  },
  tableSelector: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableSelectorLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  tableSelectorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tableButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
  },
  tableButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tableButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  tableButtonTextActive: {
    color: '#fff',
  },
  waiterInput: {
    margin: 16,
    marginTop: 0,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    color: Colors.text,
  },
  orderItems: {
    flex: 1,
    padding: 16,
  },
  emptyOrder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyOrderText: {
    fontSize: 14,
    color: Colors.textLight,
  },
  orderItem: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  orderItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  orderItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    minWidth: 30,
    textAlign: 'center' as const,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginLeft: 'auto' as const,
  },
  orderFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
