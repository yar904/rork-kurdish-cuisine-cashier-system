import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, useWindowDimensions, Platform, Animated } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { formatPrice } from '@/constants/currency';
import { ShoppingCart, Plus, Minus, Trash2, Send, Eye } from 'lucide-react-native';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MENU_ITEMS } from '@/constants/menu';
import { MenuCategory } from '@/types/restaurant';
import { Colors } from '@/constants/colors';
import { printOrderReceipt, printKitchenTicket } from '@/lib/printer';
import AIRecommendations from '@/components/AIRecommendations';



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
    orders,
  } = useRestaurant();

  const { t, tc } = useLanguage();
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('appetizers');
  const [waiterName, setWaiterName] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const categoryAnimations = useRef<{ [key: string]: Animated.Value }>({});
  const categoryPositions = useRef<{ [key: string]: number }>({});

  const { width } = useWindowDimensions();
  
  const isPhone = width < 768;
  const isTablet = width >= 768 && width < 1200;
  const isDesktop = width >= 1200;

  const itemWidth = useMemo(() => {
    if (isDesktop) return '23.5%';
    if (isTablet) return '31%';
    return '48%';
  }, [isDesktop, isTablet]);

  const categories: MenuCategory[] = ['appetizers', 'soups', 'kebabs', 'rice-dishes', 'stews', 'breads', 'desserts', 'drinks'];

  useEffect(() => {
    categories.forEach(category => {
      if (!categoryAnimations.current[category]) {
        categoryAnimations.current[category] = new Animated.Value(selectedCategory === category ? 1 : 0);
      }
    });
  }, []);

  useEffect(() => {
    categories.forEach(category => {
      const animation = categoryAnimations.current[category];
      if (animation) {
        Animated.spring(animation, {
          toValue: selectedCategory === category ? 1 : 0,
          useNativeDriver: true,
          tension: 80,
          friction: 10,
        }).start();
      }
    });
  }, [selectedCategory]);

  const handleCategoryPress = (category: MenuCategory, index: number) => {
    setSelectedCategory(category);
    
    const position = categoryPositions.current[category];
    if (position !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ 
        x: Math.max(0, position - 50), 
        animated: true 
      });
    }
  };

  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter(item => item.category === selectedCategory && item.available);
  }, [selectedCategory]);

  const handleSubmitOrder = async () => {
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
          onPress: async () => {
            try {
              const result = await submitOrder(waiterName || undefined);
              if (result?.orderId) {
                Alert.alert(
                  t('success'),
                  t('orderSubmitted'),
                  [
                    {
                      text: 'Print Receipt',
                      onPress: () => handlePrintReceipt(result.orderId),
                    },
                    {
                      text: 'Print Kitchen',
                      onPress: () => handlePrintKitchen(result.orderId),
                    },
                    { text: 'OK' },
                  ]
                );
              } else {
                Alert.alert(t('success'), t('orderSubmitted'));
              }
            } catch (err) {
              console.error('Submit order error:', err);
              Alert.alert('Error', 'Failed to submit order');
            }
          },
        },
      ]
    );
  };

  const handlePrintReceipt = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      await printOrderReceipt(order, {
        name: t('restaurantName'),
        address: 'Erbil, Kurdistan Region, Iraq',
        phone: '+964 750 123 4567',
        taxId: 'TAX-12345',
      });
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print receipt');
    }
  };

  const handlePrintKitchen = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    try {
      await printKitchenTicket(order, t('restaurantName'));
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert('Error', 'Failed to print kitchen ticket');
    }
  };



  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: `کاشێر / Cashier`,
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: '#fff',
        headerRight: () => (
          <TouchableOpacity 
            style={styles.previewButton}
            onPress={() => router.push('/public-menu')}
            activeOpacity={0.7}
          >
            <Eye size={20} color="#fff" strokeWidth={2} />
            <Text style={styles.previewButtonText}>Menu</Text>
          </TouchableOpacity>
        ),
      }} />

      <View style={[styles.content, isPhone && styles.contentMobile]}>
        <View style={styles.menuSection}>
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((category, index) => {
              const animation = categoryAnimations.current[category] || new Animated.Value(0);
              const isActive = selectedCategory === category;
              
              const scale = animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.92, 1],
              });

              const opacity = animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.7, 1],
              });

              const glowIntensity = animation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
              });

              return (
                <TouchableOpacity
                  key={category}
                  activeOpacity={0.8}
                  onPress={() => handleCategoryPress(category, index)}
                  onLayout={(event) => {
                    categoryPositions.current[category] = event.nativeEvent.layout.x;
                  }}
                >
                  <Animated.View
                    style={[
                      styles.categoryButton,
                      isActive && styles.categoryButtonActive,
                      {
                        transform: [{ scale }],
                        opacity,
                      },
                    ]}
                  >
                    {isActive && (
                      <Animated.View 
                        style={[
                          styles.glowEffect,
                          {
                            opacity: glowIntensity,
                          },
                        ]} 
                      />
                    )}
                    <Animated.Text style={[
                      styles.categoryButtonText,
                      isActive && styles.categoryButtonTextActive,
                      { opacity },
                    ]}>
                      {tc(category)}
                    </Animated.Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <ScrollView style={styles.itemsScroll} contentContainerStyle={styles.itemsGrid}>
            {filteredItems.map(item => {
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.menuItem, isPhone && styles.menuItemPhone, !isPhone && { width: itemWidth }]}
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
                      <Text style={styles.menuItemPrice}>{formatPrice(item.price)}</Text>
                    </View>
                    <Text style={styles.menuItemKurdish} numberOfLines={1}>{item.nameKurdish}</Text>
                    <Text style={styles.menuItemDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                    <View style={styles.addButton}>
                      <Plus size={24} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={[
          styles.orderSection,
          isTablet && styles.orderSectionTablet,
          isDesktop && styles.orderSectionDesktop,
          isPhone && styles.orderSectionMobile,
        ]}>
          <View style={styles.orderHeader}>
            <View style={styles.orderHeaderLeft}>
              <ShoppingCart size={24} color={Colors.primary} />
              <Text style={styles.orderTitle}>داواکاری ئێستا / Current Order</Text>
            </View>
            {currentOrder.length > 0 && (
              <TouchableOpacity onPress={clearCurrentOrder}>
                <Text style={styles.clearButton}>پاککردنەوە / Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.tableSelector}>
            <Text style={styles.tableSelectorLabel}>مێز / Table:</Text>
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
            placeholder="ناوی گارسۆن / Waiter Name (دڵخواز / Optional)"
            value={waiterName}
            onChangeText={setWaiterName}
            placeholderTextColor={Colors.textLight}
          />

          <AIRecommendations
            tableNumber={selectedTable}
            onSelectItem={(itemId) => addItemToCurrentOrder(itemId)}
          />

          <ScrollView style={styles.orderItems}>
            {currentOrder.length === 0 ? (
              <View style={styles.emptyOrder}>
                <Text style={styles.emptyOrderText}>هیچ شتێک لە داواکاریدا نییە</Text>
                <Text style={styles.emptyOrderSubtext}>No items in order</Text>
              </View>
            ) : (
              currentOrder.map((item, index) => (
                <View key={index} style={styles.orderItem}>
                  <View style={styles.orderItemInfo}>
                    <Text style={styles.orderItemName}>{item.menuItem.name}</Text>
                    <Text style={styles.orderItemPrice}>
                      {formatPrice(item.menuItem.price * item.quantity)}
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
              <Text style={styles.totalLabel}>کۆی گشتی / Total:</Text>
              <Text style={styles.totalAmount}>
                {formatPrice(calculateTotal(currentOrder))}
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
              <Text style={styles.submitButtonText}>ناردنی داواکاری / Submit Order</Text>
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
    backgroundColor: '#F5F5F7',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  previewButtonText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  content: {
    flex: 1,
    flexDirection: 'row' as const,
    ...Platform.select({
      web: {
        maxWidth: 1920,
        alignSelf: 'center' as const,
        width: '100%',
      },
    }),
  },
  contentMobile: {
    flexDirection: 'column' as const,
  },
  menuSection: {
    flex: 2,
    backgroundColor: '#fff',
    minWidth: 0,
  },
  categoryScroll: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
    backgroundColor: '#fff',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
    }),
  },
  categoryScrollContent: {
    padding: 16,
    gap: 10,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F7',
    marginRight: 10,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
      },
      android: {
        elevation: 1,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        transition: 'none',
      },
    }),
  },
  glowEffect: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 23,
    backgroundColor: Colors.primary,
    opacity: 0.15,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 0 12px rgba(204, 153, 51, 0.4), 0 0 24px rgba(204, 153, 51, 0.2)',
      },
    }),
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 12px rgba(204, 153, 51, 0.3)',
      },
    }),
  },
  categoryButtonText: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.text,
    zIndex: 2,
  },
  categoryButtonTextActive: {
    color: '#fff',
    fontSize: 16,
  },
  itemsScroll: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  itemsGrid: {
    padding: 20,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 16,
  },
  menuItem: {
    minWidth: 220,
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E5E7',
    overflow: 'hidden' as const,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      },
    }),
  },
  menuItemPhone: {
    width: '100%',
  },
  menuItemImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F5F5F7',
  },
  menuItemContent: {
    padding: 14,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  menuItemName: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.text,
    flex: 1,
  },
  menuItemPrice: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.primary,
    marginLeft: 8,
  },
  menuItemKurdish: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  menuItemDescription: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  addButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  orderSection: {
    width: 420,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderColor: '#E5E5E7',
    ...Platform.select({
      web: {
        boxShadow: '-2px 0 8px rgba(0,0,0,0.06)',
      },
    }),
  },
  orderSectionTablet: {
    width: 380,
  },
  orderSectionDesktop: {
    width: 440,
  },
  orderSectionMobile: {
    width: '100%',
    maxHeight: '40%',
    borderLeftWidth: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.text,
  },
  clearButton: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.error,
  },
  tableSelector: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableSelectorLabel: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.text,
    marginBottom: 8,
  },
  tableSelectorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tableButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: Colors.backgroundGray,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  tableButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  tableButtonText: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.text,
  },
  tableButtonTextActive: {
    color: '#fff',
  },
  waiterInput: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.backgroundGray,
    borderWidth: 2,
    borderColor: Colors.border,
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_400Regular',
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
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.textSecondary,
    textAlign: 'center' as const,
  },
  emptyOrderSubtext: {
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: Colors.textLight,
    marginTop: 4,
    textAlign: 'center' as const,
  },
  orderItem: {
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  orderItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderItemName: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.text,
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.primary,
  },
  orderItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  quantityText: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.text,
    minWidth: 40,
    textAlign: 'center' as const,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.error,
    marginLeft: 'auto' as const,
    ...Platform.select({
      ios: {
        shadowColor: Colors.error,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
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
    marginBottom: 16,
    padding: 16,
    backgroundColor: Colors.backgroundGray,
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 20,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 28,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.primary,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  submitButtonDisabled: {
    backgroundColor: Colors.textLight,
  },
  submitButtonText: {
    fontSize: 18,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#fff',
  },
});
