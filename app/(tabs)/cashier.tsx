import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image, useWindowDimensions, Platform, Animated, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { formatPrice } from '@/constants/currency';
import { ShoppingCart, Plus, Minus, Trash2, Send, Eye, Bell, Receipt } from 'lucide-react-native';
import { useRestaurant } from '@/contexts/RestaurantContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { MENU_ITEMS } from '@/constants/menu';
import { MenuCategory } from '@/types/restaurant';
import { Colors } from '@/constants/colors';
import { printOrderReceipt, printKitchenTicket } from '@/lib/printer';
import AIRecommendations from '@/components/AIRecommendations';
import { useMutation } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';



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
    if (isDesktop) return '18%';
    if (isTablet) return '23%';
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

  const callWaiterMutation = useMutation({
    mutationFn: async (data: { tableNumber: number }) => {
      console.log('[Cashier] Calling waiter for table:', data.tableNumber);
      return await trpc.serviceRequests.create.mutate({
        tableNumber: data.tableNumber,
        requestType: 'waiter',
        messageText: 'Staff assistance requested from cashier',
      });
    },
    onSuccess: () => {
      console.log('[Cashier] ✅ Waiter called successfully');
      Alert.alert(t('success'), 'Waiter has been notified');
    },
    onError: (error: any) => {
      console.error('[Cashier] ❌ Call waiter failed:', error);
      Alert.alert('Error', 'Failed to call waiter. Please try again.');
    },
  });

  const requestBillMutation = useMutation({
    mutationFn: async (data: { tableNumber: number }) => {
      console.log('[Cashier] Requesting bill for table:', data.tableNumber);
      return await trpc.serviceRequests.create.mutate({
        tableNumber: data.tableNumber,
        requestType: 'bill',
        messageText: 'Bill requested from cashier',
      });
    },
    onSuccess: () => {
      console.log('[Cashier] ✅ Bill request sent successfully');
      Alert.alert(t('success'), 'Bill request has been sent');
    },
    onError: (error: any) => {
      console.error('[Cashier] ❌ Request bill failed:', error);
      Alert.alert('Error', 'Failed to request bill. Please try again.');
    },
  });

  const handleCallWaiter = () => {
    if (!selectedTable) {
      Alert.alert('Error', 'Please select a table first');
      return;
    }
    callWaiterMutation.mutate({ tableNumber: selectedTable });
  };

  const handleRequestBill = () => {
    if (!selectedTable) {
      Alert.alert('Error', 'Please select a table first');
      return;
    }
    requestBillMutation.mutate({ tableNumber: selectedTable });
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tableSelectorButtons}
            >
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
            </ScrollView>
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

            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  callWaiterMutation.isPending && styles.actionButtonDisabled,
                ]}
                onPress={handleCallWaiter}
                disabled={callWaiterMutation.isPending}
              >
                {callWaiterMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Bell size={18} color={Colors.primary} />
                    <Text style={styles.actionButtonText}>بانگکردنی گارسۆن</Text>
                    <Text style={styles.actionButtonTextEn}>Call Waiter</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  requestBillMutation.isPending && styles.actionButtonDisabled,
                ]}
                onPress={handleRequestBill}
                disabled={requestBillMutation.isPending}
              >
                {requestBillMutation.isPending ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <>
                    <Receipt size={18} color={Colors.primary} />
                    <Text style={styles.actionButtonText}>داواکردنی پسوولە</Text>
                    <Text style={styles.actionButtonTextEn}>Request Bill</Text>
                  </>
                )}
              </TouchableOpacity>
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
    backgroundColor: '#F8F9FA',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  previewButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
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
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  categoryScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoryScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    opacity: 0.1,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    color: '#6B7280',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
    fontFamily: 'NotoNaskhArabic_700Bold',
  },
  itemsScroll: {
    flex: 1,
  },
  itemsGrid: {
    padding: 16,
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
  },
  menuItem: {
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden' as const,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      },
    }),
  },
  menuItemPhone: {
    width: '100%',
  },
  menuItemImage: {
    width: '100%',
    height: 140,
    backgroundColor: '#F9FAFB',
  },
  menuItemContent: {
    padding: 12,
  },
  menuItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  menuItemName: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#111827',
    flex: 1,
    lineHeight: 20,
  },
  menuItemPrice: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.primary,
    marginLeft: 8,
  },
  menuItemKurdish: {
    fontSize: 12,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  menuItemDescription: {
    fontSize: 12,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#6B7280',
    lineHeight: 16,
    marginBottom: 10,
  },
  addButton: {
    alignSelf: 'flex-end',
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  orderSection: {
    width: 400,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
  },
  orderSectionTablet: {
    width: 380,
  },
  orderSectionDesktop: {
    width: 420,
  },
  orderSectionMobile: {
    width: '100%',
    flex: 0,
    height: '45%',
    borderLeftWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  orderHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  orderTitle: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#111827',
  },
  clearButton: {
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_600SemiBold',
    color: '#EF4444',
  },
  tableSelector: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableSelectorLabel: {
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#6B7280',
    marginBottom: 10,
  },
  tableSelectorButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tableButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tableButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tableButtonText: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#6B7280',
  },
  tableButtonTextActive: {
    color: '#FFFFFF',
  },
  waiterInput: {
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orderItems: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  emptyOrder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyOrderText: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#D1D5DB',
    textAlign: 'center' as const,
  },
  emptyOrderSubtext: {
    fontSize: 13,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#E5E7EB',
    marginTop: 6,
    textAlign: 'center' as const,
  },
  orderItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  orderItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemName: {
    fontSize: 14,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#111827',
    flex: 1,
  },
  orderItemPrice: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.primary,
    marginLeft: 12,
  },
  orderItemControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quantityText: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#111827',
    minWidth: 32,
    textAlign: 'center' as const,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto' as const,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  orderFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#6B7280',
  },
  totalAmount: {
    fontSize: 24,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: Colors.primary,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 6,
    minHeight: 76,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 12,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#111827',
    textAlign: 'center' as const,
  },
  actionButtonTextEn: {
    fontSize: 11,
    fontFamily: 'NotoNaskhArabic_400Regular',
    color: '#9CA3AF',
    textAlign: 'center' as const,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
    ...Platform.select({
      ios: {
        shadowOpacity: 0.1,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'NotoNaskhArabic_700Bold',
    color: '#FFFFFF',
  },
});
